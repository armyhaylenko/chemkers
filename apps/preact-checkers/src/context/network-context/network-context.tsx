import { createContext, ComponentChildren } from "preact";
import { useReducer } from "preact/hooks";
import { networkReducer } from "./network-context-reducer";
import { NetworkState, NetworkAction } from "./network-context-types";

// Initial state for the network context.
const initialNetworkState: NetworkState = {
  username: "",
  usernameHash: "",
  sessionId: null,
  isHost: false,
  availableSessions: [],
  // Vite sets env variables prefixed with VITE_.
  serverUrl: import.meta.env.VITE_SERVER_URL || "http://localhost:8080",
  isConnected: false,
  error: undefined,
};

export const NetworkContext = createContext<NetworkState>(initialNetworkState);
export const NetworkDispatchContext = createContext<(action: NetworkAction) => void>(() => {});

export const NetworkProvider = ({ children }: { children: ComponentChildren }) => {
  const [state, dispatch] = useReducer(networkReducer, initialNetworkState);

  return (
    <NetworkContext.Provider value={state}>
      <NetworkDispatchContext.Provider value={dispatch}>
        {children}
      </NetworkDispatchContext.Provider>
    </NetworkContext.Provider>
  );
};

