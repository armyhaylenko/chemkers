use ed25519_dalek::{Signature, VerifyingKey};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

use crate::{
    cmd::{
        ANNOUNCE_BYTES, AnnounceArgs, CONFIRM_JOIN_SESSION_BYTES, ClientMessage, Cmd,
        ConfirmJoinSessionArgs, JOIN_SESSION_BYTES, JoinSessionArgs, SendSessionMessageArgs,
        SessionId, construct_send_session_message_plaintext,
    },
    error::GameServerError,
    response::{
        AnnounceResponse, ConfirmJoinSessionResponse, GetSessionsResponse, JoinSessionResponse,
        ResponseTarget, SendSessionMessageResponse, ServerResponse, ServerResponseKind,
        SessionDataView,
    },
};

#[derive(Default)]
pub struct ServerState {
    sessions: HashMap<SessionId, SessionState>,
    username_sessions: HashMap<String, SessionId>,
}

impl ServerState {
    pub fn new() -> Self {
        Default::default()
    }

    pub async fn process_client_message(
        &mut self,
        message: ClientMessage,
    ) -> Result<ServerResponse, GameServerError> {
        match message.cmd {
            Cmd::Announce(AnnounceArgs { username, public }) => {
                let verifying_key = VerifyingKey::from_bytes(&public)
                    .map_err(|_| GameServerError::InvalidPublicKey)?;
                let mut signature: [u8; 64] = [0; 64];
                hex::decode_to_slice(message.sig, &mut signature)
                    .map_err(|_| GameServerError::DecodeError)?;
                verifying_key
                    .verify_strict(ANNOUNCE_BYTES, &Signature::from_bytes(&signature))
                    .map_err(|_| GameServerError::SignatureVerification)?;
                let username_hex = hex::encode(Sha256::digest(username));
                if self.username_sessions.get(&username_hex).is_some() {
                    return Err(GameServerError::SessionExists(username_hex));
                }
                let host_state = UserState {
                    username_hash: username_hex.clone(),
                    _sequence_number: 0,
                    public: verifying_key,
                };
                let session_id: u16 = rand::random();
                self.sessions.insert(
                    session_id,
                    SessionState {
                        host: host_state,
                        guest: GuestState::None,
                    },
                );
                self.username_sessions
                    .insert(username_hex.clone(), session_id);
                Ok(ServerResponse {
                    kind: ServerResponseKind::Announce(AnnounceResponse {
                        session_id,
                        username_hex,
                    }),
                    target: ResponseTarget::Host,
                })
            }
            Cmd::GetSessions => {
                let sessions = self
                    .sessions
                    .iter()
                    .filter_map(|(k, v)| {
                        if matches!(v.guest, GuestState::None) {
                            Some(SessionDataView {
                                session_id: *k,
                                host: v.host.username_hash.clone(),
                            })
                        } else {
                            None
                        }
                    })
                    .collect();
                Ok(ServerResponse {
                    kind: ServerResponseKind::GetSessions(GetSessionsResponse { sessions }),
                    target: ResponseTarget::Guest,
                })
            }
            Cmd::JoinSession(JoinSessionArgs {
                guest_username,
                guest_x25519_public_key,
                public,
            }) => {
                let verifying_key = VerifyingKey::from_bytes(&public)
                    .map_err(|_| GameServerError::InvalidPublicKey)?;
                let mut signature: [u8; 64] = [0; 64];
                hex::decode_to_slice(message.sig, &mut signature)
                    .map_err(|_| GameServerError::DecodeError)?;
                verifying_key
                    .verify_strict(JOIN_SESSION_BYTES, &Signature::from_bytes(&signature))
                    .map_err(|_| GameServerError::SignatureVerification)?;
                let username_hex = hex::encode(Sha256::digest(guest_username.clone()));
                let guest_state = GuestState::PendingConfirmation(UserState {
                    username_hash: username_hex,
                    _sequence_number: 0,
                    public: verifying_key,
                });
                let session = self
                    .sessions
                    .get_mut(&message.sid.ok_or(GameServerError::MissingSessionId)?)
                    .ok_or(GameServerError::UnknownSession(message.sid.unwrap()))?;
                session.guest = guest_state;

                Ok(ServerResponse {
                    kind: ServerResponseKind::JoinSession(JoinSessionResponse {
                        guest_username,
                        guest_x25519_public_key,
                    }),
                    target: ResponseTarget::Host,
                })
            }
            Cmd::ConfirmJoinSession(ConfirmJoinSessionArgs {
                guest_username: _,
                host_x25519_public_key,
            }) => {
                let session = self
                    .sessions
                    .get_mut(&message.sid.ok_or(GameServerError::MissingSessionId)?)
                    .ok_or(GameServerError::UnknownSession(message.sid.unwrap()))?;
                let verifying_key = session.host.public;
                let mut signature: [u8; 64] = [0; 64];
                hex::decode_to_slice(message.sig, &mut signature)
                    .map_err(|_| GameServerError::DecodeError)?;
                verifying_key
                    .verify_strict(
                        CONFIRM_JOIN_SESSION_BYTES,
                        &Signature::from_bytes(&signature),
                    )
                    .map_err(|_| GameServerError::SignatureVerification)?;
                match session.guest {
                    GuestState::PendingConfirmation(ref mut g) => {
                        session.guest = GuestState::Some(std::mem::take(g));
                    }
                    _ => return Err(GameServerError::NotPending),
                }
                Ok(ServerResponse {
                    kind: ServerResponseKind::ConfirmJoinSession(ConfirmJoinSessionResponse {
                        session_id: message.sid.unwrap(),
                        host_x25519_public_key,
                    }),
                    target: ResponseTarget::Guest,
                })
            }
            Cmd::SendSessionMessage(SendSessionMessageArgs {
                ciphertext,
                public,
                header,
            }) => {
                let sid = message.sid.ok_or(GameServerError::MissingSessionId)?;
                let verifying_key = VerifyingKey::from_bytes(&public)
                    .map_err(|_| GameServerError::InvalidPublicKey)?;
                let mut signature: [u8; 64] = [0; 64];
                hex::decode_to_slice(message.sig, &mut signature)
                    .map_err(|_| GameServerError::DecodeError)?;
                verifying_key
                    .verify_strict(
                        &construct_send_session_message_plaintext(sid),
                        &Signature::from_bytes(&signature),
                    )
                    .map_err(|_| GameServerError::SignatureVerification)?;
                let session = self
                    .sessions
                    .get_mut(&sid)
                    .ok_or(GameServerError::UnknownSession(message.sid.unwrap()))?;
                let host_public = &session.host.public;
                let GuestState::Some(UserState {
                    public: ref guest_public,
                    ..
                }) = session.guest
                else {
                    return Err(GameServerError::NoPeer);
                };
                let response_target = if &verifying_key == host_public {
                    Some(ResponseTarget::Guest)
                } else if &verifying_key == guest_public {
                    Some(ResponseTarget::Host)
                } else {
                    None
                };
                let Some(target) = response_target else {
                    return Err(GameServerError::WrongSession);
                };
                Ok(ServerResponse {
                    kind: ServerResponseKind::SendSessionMessage(SendSessionMessageResponse {
                        ciphertext,
                        header,
                    }),
                    target,
                })
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum GuestState {
    None,
    PendingConfirmation(UserState),
    Some(UserState),
}

#[derive(Debug, Clone)]
pub struct SessionState {
    host: UserState,
    guest: GuestState,
}

#[derive(Debug, Default, Clone)]
pub struct UserState {
    pub username_hash: String, // hex-encoded
    pub _sequence_number: u64,
    pub public: ed25519_dalek::VerifyingKey,
}
