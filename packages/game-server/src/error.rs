
#[derive(Debug, thiserror::Error)]
pub enum GameServerError {
    #[error("Waiting for other peer")]
    NoPeer,
    #[error("Could not verify the signature")]
    SignatureVerification,
    #[error("Session with session id {0} not found")]
    UnknownSession(u16),
    #[error("This message can only be sent if session id is known")]
    MissingSessionId,
    #[error("Session for username hash {0} already exists")]
    SessionExists(String),
    #[error("Invalid public key")]
    InvalidPublicKey,
    #[error("Could not decode the supplied value!")]
    DecodeError,
    #[error("There is no pending player for this session!")]
    NotPending,
    #[error("Expected a message either from the guest or host of the session!")]
    WrongSession,

}
