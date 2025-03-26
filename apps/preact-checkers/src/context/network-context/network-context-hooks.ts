import { useContext, useEffect, useRef } from 'preact/hooks';
import { NetworkContext, NetworkDispatchContext } from './network-context';
import { ServerResponse } from './network-context-types';
import { NetworkAction, NetworkState } from './network-context-types';
import {
  setSessionId,
  setAvailableSessions,
  setGuestUsername,
  setGuestUsernameHash,
  setGuestPublic,
  setHostPublic,
  setRatchetData,
  setLastReceivedMessage,
} from './network-context-actions';
import nacl from 'tweetnacl';
import { w_init_ratchet_sender, w_init_ratchet_receiver, w_ratchet_encrypt, w_ratchet_decrypt, Header } from 'double-ratchet';

/**
 * Computes SHA-256 hash (hex string) for a given input.
 */
async function computeSHA256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Used to convert the session id (u16) to big endian bytes.
 *
 */
function toBigEndianBytes(num: number): Uint8Array {
  const high = (num >> 8) & 0xff;
  const low = num & 0xff;
  return Uint8Array.from([high, low]);
}

function constructSendSessionMessageSignature(sessionId: number): Uint8Array {
  const sendSessionMessage = 'SendSessionMessage';
  const encoder = new TextEncoder();
  const bytes = encoder.encode(sendSessionMessage);
  return Uint8Array.from([...bytes, ...toBigEndianBytes(sessionId)]);
}

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * A minimal WebSocket client class.
 */
class WSClient {
  private ws: WebSocket;
  public onMessage: ((msg: ServerResponse) => void) | undefined;
  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => console.log('WebSocket connected');
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerResponse;
        if (this.onMessage) {
          this.onMessage(msg);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    this.ws.onerror = (event) => console.error('WebSocket error:', event);
    this.ws.onclose = () => console.log('WebSocket closed');
  }
  sendMessage(message: any) {
		console.log('sending msg', message);
    this.ws.send(JSON.stringify(message));
  }
  close() {
    this.ws.close();
  }
}

/**
 * Handler for incoming server messages.
 * Depending on the response type, this will update the network state.
 *
 * For host (sender role):
 *  - On "Announce", sets the session id of the created session to state.
 *  - On "JoinSession": receives guest's public key and username, computes shared secret via
 *    scalarMult(ownX25519Private, guestX25519Public), then calls w_init_ratchet_sender to obtain ratchetData.
 *
 * For guest (receiver role):
 *  - On "GetSessions", sets the array of available sessions.
 *  - On "ConfirmJoinSession": receives host's public key, computes shared secret via
 *    scalarMult(ownX25519Private, hostX25519Public), then calls w_init_ratchet_receiver to obtain ratchetData.
 */
export async function handleServerMessage(
  message: ServerResponse,
  dispatch: (action: NetworkAction) => void,
  state: NetworkState
) {
  switch (message.kind.type) {
    case 'Announce':
      dispatch(setSessionId(message.kind.data.session_id));
      break;
    case 'GetSessions':
      const sessions = message.kind.data.sessions.map((s) => {
        return {
          sessionId: s.session_id,
          hostHash: s.host,
        };
      });
      dispatch(setAvailableSessions(sessions));
      break;
    case 'JoinSession': {
      // For the host: store guest information.
      const guestPublic = new Uint8Array(
        message.kind.data.guest_x25519_public_key
      );
      const guestUsername = message.kind.data.guest_username;
      dispatch(setGuestUsername(guestUsername));
      const guestHash = await computeSHA256Hex(guestUsername);
      dispatch(setGuestUsernameHash(guestHash));
      dispatch(setGuestPublic(guestPublic));

      // Compute shared secret: scalarMult(host_secret, guestPublic)
      if (state.x25519Keypair) {
        const sharedSecret = nacl.scalarMult(
          state.x25519Keypair.secretKey,
          guestPublic
        );
        // Initialize the ratchet as sender (host role)
        const ratchetData = w_init_ratchet_sender(guestPublic, sharedSecret);
        dispatch(setRatchetData(ratchetData));
      } else {
        console.error('Host x25519 keypair missing');
      }
      break;
    }
    case 'ConfirmJoinSession': {
      // For the guest: store host's public key and update session id.
      dispatch(setSessionId(message.kind.data.session_id));
      const hostPublic = new Uint8Array(
        message.kind.data.host_x25519_public_key
      );
      dispatch(setHostPublic(hostPublic));
      if (state.x25519Keypair) {
        const sharedSecret = nacl.scalarMult(
          state.x25519Keypair.secretKey,
          hostPublic
        );
        // Initialize the ratchet as receiver (guest role)
        const ratchetData = w_init_ratchet_receiver(
          state.x25519Keypair.secretKey,
          sharedSecret
        );
        dispatch(setRatchetData(ratchetData));
      } else {
        console.error('Guest x25519 keypair missing');
      }
      break;
    }
    case 'SendSessionMessage': {
      if (state.ratchetData) {
				const header = Header.from_json(message.kind.data.header);
				if (!header) {
					console.error('could not parse header from json');
					break;
				}
				console.log('header of received message', header);
				const ciphertext = message.kind.data.ciphertext;
				const ciphertextBytes = base64ToUint8Array(ciphertext);
				const decryptedAndRatchetData = w_ratchet_decrypt(state.ratchetData, header, ciphertextBytes);
				if (!decryptedAndRatchetData) {
					console.error('failed to decrypt message!');
					break;
				}
				const decoder = new TextDecoder();
				const plaintext = decoder.decode(decryptedAndRatchetData[0]);
				console.log('plaintext', plaintext);
				dispatch(setLastReceivedMessage(plaintext));
				dispatch(setRatchetData(decryptedAndRatchetData[1]));
      } else {
        console.error('Ratchet data missing');
      }
      break;
    }
    default:
      console.warn('Unhandled server response type:', message.kind);
  }
}

/**
 * Hook to access the network state.
 */
export function useNetworkState(): NetworkState {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetworkState must be used within a NetworkProvider');
  }
  return context;
}

/**
 * Hook to access the network dispatch function.
 */
export function useNetworkDispatch(): (action: NetworkAction) => void {
  const context = useContext(NetworkDispatchContext);
  if (context === undefined) {
    throw new Error('useNetworkDispatch must be used within a NetworkProvider');
  }
  return context;
}

/**
 * Hook to initialize and manage the WebSocket connection.
 * It creates a WSClient using the serverUrl from the network state and wires up the onMessage handler.
 */
export function useWSConnection() {
  const { serverUrl } = useNetworkState();
  const dispatch = useNetworkDispatch();
  const state = useNetworkState();
  const wsClientRef = useRef<WSClient | null>(null);

  useEffect(() => {
    // Convert an HTTP URL to a WS URL and append "/game"
    const wsUrl = serverUrl.replace(/^http/, 'ws') + '/game';
		console.log('creating new ws client');
    const wsClient = new WSClient(wsUrl);
    wsClient.onMessage = (message: ServerResponse) => {
      handleServerMessage(message, dispatch, state).catch(console.error);
    };
    wsClientRef.current = wsClient;
    return () => {
      wsClient.close();
    };
  }, [serverUrl]);

  useEffect(() => {
    if (!wsClientRef.current) return;
    wsClientRef.current.onMessage = (message: ServerResponse) => {
      handleServerMessage(message, dispatch, state).catch(console.error);
    };
  }, [state]);

  return wsClientRef.current;
}

export function useNetworkSender() {
  const wsClient = useWSConnection();
  const networkState = useNetworkState();
	const dispatch = useNetworkDispatch();
  const computeSignature = (
    messageType:
      | 'Announce'
      | 'GetSessions'
      | 'JoinSession'
      | 'ConfirmJoinSession'
      | 'SendSessionMessage'
  ) => {
    const secret = networkState.ownKeypair?.secret;
    if (!secret) {
      console.error(
        'Own keypair must be initialized before sending any messages'
      );
      return;
    }
    const message = new TextEncoder().encode(messageType);
    return Array.from(nacl.sign.detached(message, secret))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };
  return {
    sendAnnounce: (username: string, publicKey: Uint8Array) => {
      if (!wsClient) {
        return;
      }
      const message = {
        sid: undefined,
        cmd: {
          type: 'Announce',
          args: { username, public: Array.from(publicKey) },
        },
        sig: computeSignature('Announce'),
      };
      wsClient.sendMessage(message);
    },
    sendGetSessions: () => {
      if (!wsClient) {
        return;
      }
      const message = {
        sid: undefined,
        cmd: { type: 'GetSessions' },
        sig: '', // signature is not checked for a "view" query like this one
      };
      wsClient.sendMessage(message);
    },
    sendJoinSession: (
      sessionId: number,
      guestUsername: string,
      guestPublicKey: Uint8Array,
      publicKey: Uint8Array
    ) => {
      if (!wsClient) {
        return;
      }
      const message = {
        sid: sessionId,
        cmd: {
          type: 'JoinSession',
          args: {
            guest_username: guestUsername,
            guest_x25519_public_key: Array.from(guestPublicKey),
            public: Array.from(publicKey),
          },
        },
        sig: computeSignature('JoinSession'),
      };
      wsClient.sendMessage(message);
    },
    sendConfirmJoinSession: (sessionId: number, hostPublicKey: Uint8Array) => {
      if (!wsClient) {
        return;
      }
      const message = {
        sid: sessionId,
        cmd: {
          type: 'ConfirmJoinSession',
          args: {
            guest_username: '', // not needed for confirmation
            host_x25519_public_key: Array.from(hostPublicKey),
          },
        },
        sig: computeSignature('ConfirmJoinSession'),
      };
      wsClient.sendMessage(message);
    },
    sendSendSessionMessage: (sessionId: number, plaintext: string) => {
      if (!wsClient) {
        return;
      }
      const secret = networkState.ownKeypair?.secret;
      const publicKey = networkState.ownKeypair?.public;
      if (!secret || !publicKey) {
        console.error(
          'Own keypair must be initialized before sending any messages'
        );
        return;
      }
			const ratchetData = networkState.ratchetData;
			if (!ratchetData) {
				console.error('Ratchet data must be initialized before performing encryption/decryption!');
				return;
			}
			const signatureData = constructSendSessionMessageSignature(sessionId);
      const sig = Array.from(nacl.sign.detached(signatureData, secret))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
			const encoder = new TextEncoder();
			const plaintextBytes = encoder.encode(plaintext);
			const headerAndCiphertext = w_ratchet_encrypt(ratchetData, plaintextBytes);
      const message = {
        sid: sessionId,
        cmd: {
          type: 'SendSessionMessage',
          args: {
						public: Array.from(publicKey),
						header: headerAndCiphertext[0].to_json(),
						ciphertext: uint8ArrayToBase64(headerAndCiphertext[1])
          },
        },
        sig,
      };
			console.log('msg', message);
			dispatch(setRatchetData(headerAndCiphertext[2]));
      wsClient.sendMessage(message);
    },
  };
}
