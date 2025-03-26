import { NetworkState, NetworkAction } from "./network-context-types";

export const networkReducer = (
  state: NetworkState,
  action: NetworkAction
): NetworkState => {
  switch (action.type) {
    case "SET_USERNAME":
      return { ...state, username: action.payload };
    case "SET_USERNAME_HASH":
      return { ...state, usernameHash: action.payload };
    case "SET_GUEST_USERNAME":
      return { ...state, guestUsername: action.payload };
    case "SET_GUEST_USERNAME_HASH":
      return { ...state, guestUsernameHash: action.payload };
    case "SET_SESSION_ID":
      return { ...state, sessionId: action.payload };
    case "SET_IS_HOST":
      return { ...state, isHost: action.payload };
    case "SET_AVAILABLE_SESSIONS":
      return { ...state, availableSessions: action.payload };
    case "SET_SERVER_URL":
      return { ...state, serverUrl: action.payload };
    case "SET_CONNECTED":
      return { ...state, isConnected: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_OWN_KEYPAIR":
      return { ...state, ownKeypair: action.payload };
    case "SET_OWN_X25519":
      return { ...state, x25519Keypair: action.payload };
    case "SET_HOST_PUBLIC":
      return { ...state, hostPublic: action.payload };
    case "SET_GUEST_PUBLIC":
      return { ...state, guestPublic: action.payload };
    case "SET_RATCHET_DATA":
      return { ...state, ratchetData: action.payload };
    case "SET_LAST_RECEIVED_MESSAGE":
      return { ...state, lastReceivedMessage: action.payload };
    default:
      return state;
  }
};

