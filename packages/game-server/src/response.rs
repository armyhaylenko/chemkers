use crate::cmd::SessionId;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionDataView {
    pub session_id: SessionId,
    pub host: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetSessionsResponse {
    pub sessions: Vec<SessionDataView>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnnounceResponse {
    pub session_id: SessionId,
    pub username_hex: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JoinSessionResponse {
    pub guest_username: String,
    pub guest_x25519_public_key: [u8; 32],
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfirmJoinSessionResponse {
    pub session_id: SessionId,
    pub host_x25519_public_key: [u8; 32],
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SendSessionMessageResponse {
    pub ciphertext: String,
    pub header: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ServerResponseKind {
    Announce(AnnounceResponse),
    GetSessions(GetSessionsResponse),
    JoinSession(JoinSessionResponse),
    ConfirmJoinSession(ConfirmJoinSessionResponse),
    SendSessionMessage(SendSessionMessageResponse),
}

#[derive(Debug)]
pub enum ResponseTarget {
    Host,
    Guest,
}

#[derive(Debug, Serialize)]
pub struct ServerResponse {
    pub kind: ServerResponseKind,
    #[serde(skip_serializing)]
    pub target: ResponseTarget,
}
