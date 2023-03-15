use std::collections::HashMap;

use aes_gcm_siv::{aead::Payload, Aes256GcmSiv, Nonce};
use anyhow::{anyhow, bail};
use generic_array::GenericArray;

use hkdf::Hkdf;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::{digest::FixedOutput, Sha256};
use wasm_bindgen::prelude::*;
use x25519_dalek::{PublicKey, StaticSecret};

const CHAIN_KEY_DERIVATION_BYTE: u8 = 0x01u8;
const MESSAGE_KEY_DERIVATION_BYTE: u8 = 0x02u8;
const NONCE_DERIVATION_BYTE: u8 = 0x03u8;
const INFO: &'static [u8] = b"Checkers";
/// the maximum number of skipped messages.
/// in the checkers usecase, typically is at most 1.
const MAX_SKIP: u8 = 32;
type HmacSha256 = Hmac<Sha256>;
pub type SymmetricKey = GenericArray<u8, typenum::U32>;

struct UserServerData {
    pub username: String,
}

#[derive(Debug)]
#[wasm_bindgen]
struct Header {
    sender: PublicKey,
    previous_sending_chain_length: u64,
    num_sent: u64,
}

#[derive(Serialize, Deserialize)]
struct UserClientDataWrapper {
    /// the private key of the sender
    /// used only for DH and is regenerated on the respective ratchet step
    pub dh_s: [u8; 32],
    /// the public key of the receiver
    /// used only for DH and is updated on the respective ratchet step
    pub dh_r: Option<[u8; 32]>,
    /// root key
    pub current_root: [u8; 32],
    /// sending chain key
    pub current_chain_key_sender: Option<[u8; 32]>,
    /// receiving chain key
    pub current_chain_key_receiver: Option<[u8; 32]>,
    /// number of sent messages in the current sending chain
    pub num_sent: u64,
    /// number of received messages in the current receiving chain
    pub num_recieved: u64,
    /// length of the previous sending chain
    pub previous_sending_chain_length: u64,
    // /// Dictionary of skipped-over message keys, indexed by ratchet public key and message number.
    // pub skipped_messages: HashMap<(PublicKey, u64), SymmetricKey>,
    /// Dictionary of skipped-over message keys and our correspoinding receiver public keys, indexed by sender public key and message number.
    pub skipped_messages: HashMap<([u8; 32], u64), ([u8; 32], [u8; 32])>,
}

impl From<UserClientData> for UserClientDataWrapper {
    fn from(value: UserClientData) -> Self {
        let skipped_messages_converted = value
            .skipped_messages
            .into_iter()
            .map(|(k, v)| {
                (
                    (k.0.to_bytes(), k.1),
                    (Into::<[u8; 32]>::into(v.0), v.1.to_bytes()),
                )
            })
            .collect::<HashMap<_, _>>();
        Self {
            dh_s: value.dh_s.to_bytes(),
            dh_r: value.dh_r.map(|p| p.to_bytes()),
            current_root: value.current_root.into(),
            current_chain_key_sender: value.current_chain_key_sender.map(Into::into),
            current_chain_key_receiver: value.current_chain_key_receiver.map(Into::into),
            num_sent: value.num_sent,
            num_recieved: value.num_recieved,
            previous_sending_chain_length: value.previous_sending_chain_length,
            skipped_messages: skipped_messages_converted,
        }
    }
}

impl From<UserClientDataWrapper> for UserClientData {
    fn from(value: UserClientDataWrapper) -> Self {
        todo!()
    }
}

struct UserClientData {
    /// the private key of the sender
    /// used only for DH and is regenerated on the respective ratchet step
    pub dh_s: StaticSecret,
    /// the public key of the receiver
    /// used only for DH and is updated on the respective ratchet step
    pub dh_r: Option<PublicKey>,
    /// root key
    pub current_root: SymmetricKey,
    /// sending chain key
    pub current_chain_key_sender: Option<SymmetricKey>,
    /// receiving chain key
    pub current_chain_key_receiver: Option<SymmetricKey>,
    /// number of sent messages in the current sending chain
    pub num_sent: u64,
    /// number of received messages in the current receiving chain
    pub num_recieved: u64,
    /// length of the previous sending chain
    pub previous_sending_chain_length: u64,
    // /// Dictionary of skipped-over message keys, indexed by ratchet public key and message number.
    // pub skipped_messages: HashMap<(PublicKey, u64), SymmetricKey>,
    /// Dictionary of skipped-over message keys and our correspoinding receiver public keys, indexed by sender public key and message number.
    pub skipped_messages: HashMap<(PublicKey, u64), (SymmetricKey, PublicKey)>,
}

impl UserClientData {
    pub fn init_ratchet_sender(dh_r: PublicKey, shared_secret: SymmetricKey) -> Self {
        let dh_s = StaticSecret::random();
        let (rk, cks) = kdf_rk(shared_secret.as_ref(), &dh_s, &dh_r);
        Self {
            dh_s,
            dh_r: Some(dh_r),
            current_root: rk,
            current_chain_key_sender: Some(cks),
            current_chain_key_receiver: None,
            num_sent: 0,
            num_recieved: 0,
            previous_sending_chain_length: 0,
            skipped_messages: Default::default(),
        }
    }

    pub fn init_ratchet_receiver(dh_s: StaticSecret, shared_secret: SymmetricKey) -> Self {
        Self {
            dh_s,
            dh_r: None,
            current_root: shared_secret,
            current_chain_key_sender: None,
            current_chain_key_receiver: None,
            num_sent: 0,
            num_recieved: 0,
            previous_sending_chain_length: 0,
            skipped_messages: Default::default(),
        }
    }

    pub fn ratchet_encrypt(&mut self, plaintext: &[u8]) -> (Header, Vec<u8>) {
        use aes_gcm_siv::{aead::Aead, KeyInit};
        let (cks, mk) = kdf_ck(&self.current_chain_key_sender.expect("TODO"));
        self.current_chain_key_sender = Some(cks);
        let header = Header {
            sender: (&self.dh_s).into(),
            num_sent: self.num_sent,
            previous_sending_chain_length: self.previous_sending_chain_length,
        };
        self.num_sent += 1;
        let nonce = derive_nonce(&mk);
        let ciphertext = aes_gcm_siv::Aes256GcmSiv::new(&mk).encrypt(
            &nonce,
            Payload {
                msg: plaintext,
                aad: self
                    .dh_r
                    .expect("must know recipient when encrypting a message")
                    .as_bytes(),
                // aad: &[],
            },
        );
        (header, ciphertext.expect("encryption must work"))
    }

    pub fn ratchet_decrypt(
        &mut self,
        header: &Header,
        ciphertext: &[u8],
    ) -> anyhow::Result<Vec<u8>> {
        use aes_gcm_siv::{aead::Aead, KeyInit};
        let old_public = PublicKey::from(&self.dh_s);
        let old_public_bytes = old_public.as_bytes();
        if let Some(plaintext) = self.try_skipped_message_keys(header, ciphertext) {
            return Ok(plaintext);
        }
        if Some(header.sender) != self.dh_r {
            self.skip_message_keys(header.previous_sending_chain_length, old_public)?;
            self.perform_ratchet(header);
        }
        self.skip_message_keys(header.num_sent, old_public)?;
        let (ckr, mk) = kdf_ck(
            &self
                .current_chain_key_receiver
                .ok_or_else(|| anyhow!("missing current receiver chain key!"))?,
        );
        self.current_chain_key_receiver = Some(ckr);
        self.num_recieved += 1;
        let nonce = derive_nonce(&mk);
        Ok(Aes256GcmSiv::new(&mk)
            .decrypt(
                &nonce,
                Payload {
                    msg: ciphertext,
                    aad: old_public_bytes,
                },
            )
            .map_err(|e| anyhow!("could not decrypt ciphertext: {e}"))?)
    }

    pub fn try_skipped_message_keys(
        &mut self,
        header: &Header,
        ciphertext: &[u8],
    ) -> Option<Vec<u8>> {
        use aes_gcm_siv::{aead::Aead, KeyInit};
        let key = &(header.sender, header.num_sent);
        let maybe_plaintext = self
            .skipped_messages
            .remove(key)
            .map(|(message_key, old_public)| {
                let nonce = derive_nonce(&message_key);
                Aes256GcmSiv::new(&message_key).decrypt(
                    &nonce,
                    Payload {
                        msg: ciphertext,
                        aad: old_public.as_bytes(),
                    },
                )
            });
        maybe_plaintext.and_then(Result::ok)
    }

    pub fn skip_message_keys(&mut self, until: u64, old_public: PublicKey) -> anyhow::Result<()> {
        if self.num_recieved + (MAX_SKIP as u64) < until {
            bail!("Too many messages to skip!");
        }

        if self.current_chain_key_receiver.is_some() {
            while self.num_recieved < until {
                dbg!("skipping message keys");
                let (ckr, mk) = kdf_ck(&self.current_chain_key_receiver.unwrap());
                self.current_chain_key_receiver = Some(ckr);
                self.skipped_messages.insert(
                    (
                        self.dh_r
                            .ok_or_else(|| anyhow!("missing peer public key!"))?,
                        self.num_recieved,
                    ),
                    (mk, old_public),
                );
                dbg!(&self.skipped_messages);
                self.num_recieved += 1;
            }
        }

        Ok(())
    }

    pub fn perform_ratchet(&mut self, header: &Header) {
        self.previous_sending_chain_length = header.num_sent;
        self.num_sent = 0;
        self.num_recieved = 0;
        self.dh_r = Some(header.sender.clone());
        let (rk, ckr) = kdf_rk(self.current_root.as_ref(), &self.dh_s, &header.sender);
        self.current_root = rk;
        self.current_chain_key_receiver = Some(ckr);
        let dh_s = StaticSecret::random();
        self.dh_s = dh_s;
        let (rk, cks) = kdf_rk(self.current_root.as_ref(), &self.dh_s, &header.sender);
        self.current_root = rk;
        self.current_chain_key_sender = Some(cks);
    }
}

fn kdf_rk(
    shared_secret: &[u8],
    our_private_key: &StaticSecret,
    their_public_key: &PublicKey,
) -> (SymmetricKey, SymmetricKey) {
    let dh_out = our_private_key.diffie_hellman(their_public_key);
    let hkdf = Hkdf::<Sha256>::new(Some(shared_secret.as_ref()), dh_out.as_bytes());
    let mut okm: [u8; 64] = [0; 64];
    hkdf.expand(INFO, &mut okm).expect("expand HKDF");
    let mut rk = [0u8; 32];
    let mut ck = [0u8; 32];
    rk.copy_from_slice(&okm[..32]);
    ck.copy_from_slice(&okm[32..]);
    (GenericArray::from(rk), GenericArray::from(ck))
}

fn kdf_ck(prev_chain_key: &SymmetricKey) -> (SymmetricKey, SymmetricKey) {
    let hmac_ck = HmacSha256::new_from_slice(prev_chain_key.as_ref()).unwrap();
    let hmac_mk = HmacSha256::new_from_slice(prev_chain_key.as_ref()).unwrap();
    let next_chain_key = hmac_ck
        .chain_update([CHAIN_KEY_DERIVATION_BYTE])
        .finalize_fixed();
    let message_key = hmac_mk
        .chain_update([MESSAGE_KEY_DERIVATION_BYTE])
        .finalize_fixed();
    (next_chain_key, message_key)
}

fn derive_nonce(mk: &SymmetricKey) -> Nonce {
    let hmac = HmacSha256::new_from_slice(mk.as_ref()).unwrap();
    Nonce::clone_from_slice(&hmac.chain_update([NONCE_DERIVATION_BYTE]).finalize_fixed()[..12])
}

#[cfg(test)]
mod tests {
    use x25519_dalek::EphemeralSecret;

    use super::*;

    fn setup() -> (UserClientData, UserClientData) {
        let alice_private_key_for_shared_secret = EphemeralSecret::random();
        let bob_private_key_for_shared_secret = EphemeralSecret::random();
        let alice_public_for_shared_secret: PublicKey =
            (&alice_private_key_for_shared_secret).into();
        let bob_public_for_shared_secret: PublicKey = (&bob_private_key_for_shared_secret).into();
        let alice_shared_secret =
            alice_private_key_for_shared_secret.diffie_hellman(&bob_public_for_shared_secret);
        let bob_shared_secret =
            bob_private_key_for_shared_secret.diffie_hellman(&alice_public_for_shared_secret);
        assert_eq!(alice_shared_secret.as_bytes(), bob_shared_secret.as_bytes());
        let shared_secret = SymmetricKey::from(alice_shared_secret.to_bytes());

        let bob_ratchet_secret = StaticSecret::random();
        let bob_public: PublicKey = (&bob_ratchet_secret).into();
        let bob = UserClientData::init_ratchet_receiver(bob_ratchet_secret, shared_secret);
        let alice = UserClientData::init_ratchet_sender(bob_public, shared_secret);
        (alice, bob)
    }

    #[test]
    fn test_single_message() {
        let (mut alice, mut bob) = setup();
        let message = b"Hello, Bob!";
        let (header, encrypted) = alice.ratchet_encrypt(message);
        let decrypted = bob
            .ratchet_decrypt(&header, &encrypted)
            .expect("decrypt message");
        assert_eq!(&decrypted, message);
    }

    #[test]
    fn test_conversation() {
        let (mut alice, mut bob) = setup();
        let message = b"Hello, Bob!";
        let (header, encrypted) = alice.ratchet_encrypt(message);
        let decrypted = bob
            .ratchet_decrypt(&header, &encrypted)
            .expect("decrypt message");
        assert_eq!(&decrypted, message);

        let message = b"Hi Alice, how are you doing today?";
        let (header, encrypted) = bob.ratchet_encrypt(message);
        let decrypted = alice
            .ratchet_decrypt(&header, &encrypted)
            .expect("decrypt message");
        assert_eq!(&decrypted, message);

        let message = b"Doing great, thanks! Off to work now!";
        let (header, encrypted) = alice.ratchet_encrypt(message);
        let decrypted = bob
            .ratchet_decrypt(&header, &encrypted)
            .expect("decrypt message");
        assert_eq!(&decrypted, message);

        let message = b"Aight, bye.";
        let (header, encrypted) = bob.ratchet_encrypt(message);
        let decrypted = alice
            .ratchet_decrypt(&header, &encrypted)
            .expect("decrypt message");
        assert_eq!(&decrypted, message);
    }

    #[test]
    fn test_skipped_messages() {
        let (mut alice, mut bob) = setup();
        let message1 = b"Hello, Bob!";
        let (header1, encrypted1) = alice.ratchet_encrypt(message1);

        let message2 = b"If you don't mind me asking...";
        let (header2, encrypted2) = alice.ratchet_encrypt(message2);

        let message3 = b"Mind lending me some money?";
        let (header3, encrypted3) = alice.ratchet_encrypt(message3);

        // simulate out of order delivery

        let decrypted3 = bob
            .ratchet_decrypt(&header3, &encrypted3)
            .expect("decrypt message");
        assert_eq!(&decrypted3, message3);
        let decrypted1 = bob
            .ratchet_decrypt(&header1, &encrypted1)
            .expect("decrypt message");
        assert_eq!(&decrypted1, message1);
        let decrypted2 = bob
            .ratchet_decrypt(&header2, &encrypted2)
            .expect("decrypt message");
        assert_eq!(&decrypted2, message2);
    }
}
