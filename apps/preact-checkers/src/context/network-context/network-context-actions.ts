import { NetworkAction, Keypair } from './network-context-types';

export const setUsername = (username: string): NetworkAction => ({
  type: 'SET_USERNAME',
  payload: username,
});

export const setUsernameHash = (usernameHash: string): NetworkAction => ({
  type: 'SET_USERNAME_HASH',
  payload: usernameHash,
});

export const setGuestUsername = (guestUsername: string): NetworkAction => ({
  type: 'SET_GUEST_USERNAME',
  payload: guestUsername,
});

export const setGuestUsernameHash = (
  guestUsernameHash: string
): NetworkAction => ({
  type: 'SET_GUEST_USERNAME_HASH',
  payload: guestUsernameHash,
});

export const setSessionId = (sessionId: number | null): NetworkAction => ({
  type: 'SET_SESSION_ID',
  payload: sessionId,
});

export const setIsHost = (isHost: boolean): NetworkAction => ({
  type: 'SET_IS_HOST',
  payload: isHost,
});

export const setAvailableSessions = (
  availableSessions: Array<{ sessionId: number; hostHash: string }>
): NetworkAction => ({
  type: 'SET_AVAILABLE_SESSIONS',
  payload: availableSessions,
});

export const setServerUrl = (serverUrl: string): NetworkAction => ({
  type: 'SET_SERVER_URL',
  payload: serverUrl,
});

export const setConnected = (isConnected: boolean): NetworkAction => ({
  type: 'SET_CONNECTED',
  payload: isConnected,
});

export const setError = (error?: string): NetworkAction => ({
  type: 'SET_ERROR',
  payload: error,
});

export const setOwnKeypair = (ownKeypair: Keypair): NetworkAction => ({
  type: 'SET_OWN_KEYPAIR',
  payload: ownKeypair,
});

export const setOwnX25519 = (x25519Pair: nacl.BoxKeyPair): NetworkAction => ({
  type: 'SET_OWN_X25519',
  payload: x25519Pair,
});

export const setHostPublic = (publicKey: Uint8Array): NetworkAction => ({
  type: 'SET_HOST_PUBLIC',
  payload: publicKey,
});

export const setGuestPublic = (publicKey: Uint8Array): NetworkAction => ({
  type: 'SET_GUEST_PUBLIC',
  payload: publicKey,
});

export const setRatchetData = (ratchetData: any): NetworkAction => ({
  type: 'SET_RATCHET_DATA',
  payload: ratchetData,
});

export const setLastReceivedMessage = (message: string): NetworkAction => ({
  type: 'SET_LAST_RECEIVED_MESSAGE',
  payload: message,
});
