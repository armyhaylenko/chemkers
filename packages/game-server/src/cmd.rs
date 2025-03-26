use serde::{Deserialize, Serialize};

pub type SessionId = u16;

pub const ANNOUNCE_BYTES: &[u8] = b"Announce";
pub const JOIN_SESSION_BYTES: &[u8] = b"JoinSession";
pub const CONFIRM_JOIN_SESSION_BYTES: &[u8] = b"ConfirmJoinSession";
pub const SEND_SESSION_MESSAGE_BYTES: &[u8] = b"SendSessionMessage";

pub fn construct_send_session_message_plaintext(session_id: u16) -> [u8; 20] {
    let mut out = [0u8; 20];
    out[..18].copy_from_slice(&SEND_SESSION_MESSAGE_BYTES);
    let session_id_bytes = session_id.to_be_bytes();
    out[18..].copy_from_slice(&session_id_bytes);
    out
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnounceArgs {
    pub username: String,
    pub public: [u8; 32],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoinSessionArgs {
    pub guest_username: String,
    pub guest_x25519_public_key: [u8; 32],
    pub public: [u8; 32],
}

// needed for DH to take place
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfirmJoinSessionArgs {
    pub guest_username: String,
    pub host_x25519_public_key: [u8; 32],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendSessionMessageArgs {
    // string must be base64-encoded
    pub ciphertext: String,
    pub header: serde_json::Value,
    pub public: [u8; 32],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "args")]
pub enum Cmd {
    Announce(AnnounceArgs),
    GetSessions,
    JoinSession(JoinSessionArgs),
    ConfirmJoinSession(ConfirmJoinSessionArgs),
    SendSessionMessage(SendSessionMessageArgs),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientMessage {
    pub sid: Option<SessionId>,
    pub cmd: Cmd,
    pub sig: String,
}
