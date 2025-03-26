// --- Keypair and State Types ---

import { Header } from "double-ratchet";

export interface Keypair {
  public: Uint8Array; // 32-byte public key
  secret: Uint8Array; // present only on the owner’s side
}

export interface NetworkState {
  // User info
  username: string;
  usernameHash: string;
  // For guests joining a session – these fields will be set on the host’s side.
  guestUsername?: string;
  guestUsernameHash?: string;

  // Session & role info
  sessionId: number | null;
  isHost: boolean;
  availableSessions: Array<{ sessionId: number; hostHash: string }>;
  serverUrl: string;
  isConnected: boolean;
  error?: string;
  lastReceivedMessage?: string;

  // Cryptographic state
  ownKeypair?: Keypair; // the user’s own EdDSA (Ed25519) keypair (generated on login)
  x25519Keypair?: nacl.BoxKeyPair; // the user’s own X25519 (Curve25519, Montgomery) keypair (generated on login)
  hostPublic?: Uint8Array; // for a guest: the host’s public key (from ConfirmJoinSession)
  guestPublic?: Uint8Array; // for a host: the guest’s public key (from JoinSession)
  ratchetData?: any; // the WASM–generated UserClientData (obtained after DH & ratchet init)
}

// --- Action Types ---

export type NetworkAction =
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_USERNAME_HASH'; payload: string }
  | { type: 'SET_GUEST_USERNAME'; payload: string }
  | { type: 'SET_GUEST_USERNAME_HASH'; payload: string }
  | { type: 'SET_SESSION_ID'; payload: number | null }
  | { type: 'SET_IS_HOST'; payload: boolean }
  | {
      type: 'SET_AVAILABLE_SESSIONS';
      payload: Array<{ sessionId: number; hostHash: string }>;
    }
  | { type: 'SET_SERVER_URL'; payload: string }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'SET_OWN_X25519'; payload: nacl.BoxKeyPair }
  | { type: 'SET_OWN_KEYPAIR'; payload: Keypair }
  | { type: 'SET_HOST_PUBLIC'; payload: Uint8Array }
  | { type: 'SET_GUEST_PUBLIC'; payload: Uint8Array }
  | { type: 'SET_RATCHET_DATA'; payload: any }
  | { type: 'SET_LAST_RECEIVED_MESSAGE'; payload: string };

// --- WebSocket Types ---

export type SessionId = number;

export interface AnnounceResponseData {
  session_id: number;
  username_hex: string;
}

export interface GetSessionsResponseData {
  sessions: Array<{ session_id: number; host: string }>;
}

export interface JoinSessionResponseData {
  guest_username: string;
  guest_x25519_public_key: number[]; // will be converted to Uint8Array
}

export interface ConfirmJoinSessionResponseData {
  session_id: number;
  host_x25519_public_key: number[]; // will be converted to Uint8Array
}

export interface SendSessionMessageResponseData {
	header: Header,
  ciphertext: string;
}

export type ServerResponseKind =
  | { type: 'Announce'; data: AnnounceResponseData }
  | { type: 'GetSessions'; data: GetSessionsResponseData }
  | { type: 'JoinSession'; data: JoinSessionResponseData }
  | { type: 'ConfirmJoinSession'; data: ConfirmJoinSessionResponseData }
  | { type: 'SendSessionMessage'; data: SendSessionMessageResponseData };

export interface ServerResponse {
  kind: ServerResponseKind;
}
