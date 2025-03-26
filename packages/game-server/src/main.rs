use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};

use clap::Parser;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::{RwLock, mpsc};
use tokio_stream::wrappers::UnboundedReceiverStream;
use tracing::{error, info, warn};
use warp::Filter;
use warp::ws::{Message, WebSocket};

use crate::cmd::{ClientMessage, Cmd};
use crate::response::{ResponseTarget, ServerResponseKind};
use crate::state::ServerState;

mod cmd;
mod error;
mod response;
mod state;

/// Command-line arguments
#[derive(clap::Parser)]
struct Args {
    #[clap(long, help = "port for the websocket server", default_value_t = 8001)]
    pub port: u16,
}

/// Global unique user id counter.
static NEXT_USER_ID: AtomicUsize = AtomicUsize::new(1);

/// Connected users mapping: key is our user id, value is a sender for WebSocket messages.
type Users = Arc<RwLock<HashMap<usize, mpsc::UnboundedSender<Message>>>>;

/// Mapping from a session id to its (host_connection, guest_connection).
/// When a user sends an Announce command, a new session is created with (Some(host), None).
/// Later, when a guest joins, we update the tuple.
type SessionsMap = Arc<RwLock<HashMap<u16, (Option<usize>, Option<usize>)>>>;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();
    let Args { port } = Args::parse();
    let stop_handle = tokio::task::spawn(async move {
        match tokio::signal::ctrl_c().await {
            Ok(_) => {
                info!("shutting down...");
            }
            Err(_) => {
                error!("error shutting down!");
            }
        }
    });

    // Global state for connected users.
    let users: Users = Arc::new(RwLock::new(HashMap::new()));
    // Our game server state (session management etc.)
    let server = Arc::new(RwLock::new(ServerState::new()));
    // Additional mapping to track which user (by our id) is host or guest in a session.
    let sessions_map: SessionsMap = Arc::new(RwLock::new(HashMap::new()));

    // Prepare filters for passing state to our route.
    let users_filter = warp::any().map(move || users.clone());
    let server_filter = warp::any().map(move || server.clone());
    let sessions_filter = warp::any().map(move || sessions_map.clone());

    // WebSocket endpoint at /game
    let game = warp::path("game")
        .and(warp::ws())
        .and(users_filter)
        .and(server_filter)
        .and(sessions_filter)
        .map(|ws: warp::ws::Ws, users, server, sessions_map| {
            ws.on_upgrade(move |socket| user_connected(socket, users, server, sessions_map))
        })
        .with(
            warp::cors()
                .allow_methods(vec!["GET", "POST", "OPTIONS", "HEAD"])
                .allow_any_origin(),
        );

    // GET / returns a simple index HTML.
    let index = warp::path::end().map(warp::reply);

    let routes = index.or(game);
    info!("starting server");
    tokio::task::spawn(warp::serve(routes).bind(([127, 0, 0, 1], port)));
    let _ = stop_handle.await;
}

/// Called once a new user connects via WebSocket.
async fn user_connected(
    ws: WebSocket,
    users: Users,
    server: Arc<RwLock<ServerState>>,
    sessions_map: SessionsMap,
) {
    let my_id = NEXT_USER_ID.fetch_add(1, Ordering::Relaxed);
    error!("New user connected: {}", my_id);

    let (mut ws_tx, mut ws_rx) = ws.split();
    let (tx, rx) = mpsc::unbounded_channel();
    let mut rx = UnboundedReceiverStream::new(rx);

    // Spawn a task to send queued messages to the client.
    tokio::task::spawn(async move {
        while let Some(message) = rx.next().await {
            if let Err(e) = ws_tx.send(message).await {
                error!("WebSocket send error (user {}): {}", my_id, e);
                break;
            }
        }
    });

    // Save the sender so we can later send messages to this user.
    users.write().await.insert(my_id, tx);

    // Process incoming messages from this user.
    while let Some(result) = ws_rx.next().await {
        let msg = match result {
            Ok(m) => m,
            Err(e) => {
                error!("WebSocket error (uid={}): {}", my_id, e);
                break;
            }
        };
        user_message(my_id, msg, &users, &server, &sessions_map).await;
    }

    user_disconnected(my_id, &users, &sessions_map).await;
}

/// Processes a message received from a user, routes it to the game server logic, and dispatches the server’s response.
async fn user_message(
    my_id: usize,
    msg: Message,
    users: &Users,
    server: &Arc<RwLock<ServerState>>,
    sessions_map: &SessionsMap,
) {
    // Only handle text messages.
    let msg_text = match msg.to_str() {
        Ok(s) => s,
        Err(_) => return,
    };

    // Attempt to parse the JSON message into our ClientMessage.
    let client_message: ClientMessage = match serde_json::from_str(msg_text) {
        Ok(m) => m,
        Err(e) => {
            error!("Failed to parse message from user {}: {}", my_id, e);
            if let Some(tx) = users.read().await.get(&my_id) {
                let _ = tx.send(Message::text(format!("Error parsing message: {}", e)));
            }
            return;
        }
    };

    // Process the message using the game server logic.
    let response_result = {
        let mut srv = server.write().await;
        srv.process_client_message(client_message.clone()).await
    };

    match response_result {
        Ok(server_response) => {
            // Update sessions mapping based on command type.
            match client_message.cmd {
                Cmd::Announce(_) => {
                    if let ServerResponseKind::Announce(ref announce_resp) = server_response.kind {
                        // Record that this user is the host for the new session.
                        sessions_map
                            .write()
                            .await
                            .insert(announce_resp.session_id, (Some(my_id), None));
                    }
                }
                Cmd::JoinSession(_) => {
                    if let Some(sid) = client_message.sid {
                        // Record that this user is joining as guest.
                        sessions_map.write().await.entry(sid).and_modify(|tuple| {
                            tuple.1 = Some(my_id);
                        });
                    }
                }
                _ => {}
            }

            // Serialize the server response.
            let response_json = serde_json::to_string(&server_response)
                .unwrap_or_else(|_| "{\"error\": \"serialization error\"}".to_string());

            // Dispatch the response based on its target.
            match server_response.target {
                ResponseTarget::Host => {
                    // For Host target, if the session id is provided, lookup the host connection;
                    // otherwise, default to the sender.
                    if let Some(sid) = client_message.sid {
                        let sessions = sessions_map.read().await;
                        if let Some((Some(host_id), _)) = sessions.get(&sid) {
                            if let Some(tx) = users.read().await.get(host_id) {
                                let _ = tx.send(Message::text(response_json.clone()));
                            }
                        }
                    } else if let Some(tx) = users.read().await.get(&my_id) {
                        let _ = tx.send(Message::text(response_json.clone()));
                    }
                }
                ResponseTarget::Guest => {
                    // For Guest target, lookup the guest connection from the session mapping.
                    if let Some(sid) = client_message.sid {
                        let sessions = sessions_map.read().await;
                        if let Some((_, Some(guest_id))) = sessions.get(&sid) {
                            if let Some(tx) = users.read().await.get(guest_id) {
                                let _ = tx.send(Message::text(response_json.clone()));
                            }
                        }
                    } else if let Some(tx) = users.read().await.get(&my_id) {
                        let _ = tx.send(Message::text(response_json.clone()));
                    }
                }
            }
        }
        Err(e) => {
            // On error, send an error message back to the sender.
            error!("Error processing message from user {}: {}", my_id, e);
            if let Some(tx) = users.read().await.get(&my_id) {
                let _ = tx.send(Message::text(format!("Server error: {}", e)));
            }
        }
    }
}

/// Called when a user disconnects: removes them from the connected users list
/// and cleans up any session mappings that reference them.
async fn user_disconnected(my_id: usize, users: &Users, sessions_map: &SessionsMap) {
    warn!("User disconnected: {}", my_id);
    users.write().await.remove(&my_id);

    // Optionally, remove any sessions where this user was the host or guest.
    let mut sessions = sessions_map.write().await;
    sessions.retain(|_sid, (host, guest)| host != &Some(my_id) && guest != &Some(my_id));
}
