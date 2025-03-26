import { useState, useEffect } from 'preact/hooks';
import {
  useNetworkState,
  useNetworkDispatch,
  useNetworkSender,
} from '../../../context/network-context/network-context-hooks';
import nacl from 'tweetnacl';
import {
  setIsHost,
  setOwnKeypair,
  setOwnX25519,
  setUsername,
} from '../../../context/network-context/network-context-actions';
import init from 'double-ratchet';
import style from './SessionOverlay.module.scss';
import Button from '../../ui/Button';

export function SessionOverlay() {
  // Get current network state and dispatch function from our context
  const state = useNetworkState();
  const dispatch = useNetworkDispatch();
  // Our custom hook with functions to send WS messages
  const {
    sendAnnounce,
    sendJoinSession,
    sendConfirmJoinSession,
  } = useNetworkSender();

  // Local state to manage which mode the overlay is in
  type Mode =
    | 'initial'
    | 'create'
    | 'waitingHost'
    | 'join'
    | 'waitingGuest';
	const [confirmedSession, setConfirmedSession] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>('initial');
  const [inputUsername, setInputUsername] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');

  // On mount, if own keypair is not set, generate an Ed25519 keypair and store it
  useEffect(() => {
    if (!state.ownKeypair) {
      init().then(() => {
        console.log('wasm instantiated');
      });

      const ed25519Pair = nacl.sign.keyPair();
      dispatch(
        setOwnKeypair({
          secret: ed25519Pair.secretKey,
          public: ed25519Pair.publicKey,
        })
      );
      const x25519Pair = nacl.box.keyPair();
      dispatch(setOwnX25519(x25519Pair));
    }
  }, [state.ownKeypair, dispatch]);

  useEffect(() => {
    console.log('STATE', state);
  }, [state]);

  // When the ratchet data is available, the session is fully set up – hide the overlay.
  if (state.ratchetData && (state.isHost ? confirmedSession : true)) {
    return null;
  }

  // Called when a host submits a username to create a session.
  const handleCreateSubmit = () => {
    if (!inputUsername || !state.ownKeypair || !state.x25519Keypair) return;
    dispatch(setUsername(inputUsername));
    dispatch(setIsHost(true));
    sendAnnounce(inputUsername, state.ownKeypair.public);
    setMode('waitingHost');
  };

  // Called when the host confirms the session after receiving a JoinSession response.
  const handleConfirmClick = () => {
    if (state.sessionId && state.x25519Keypair) {
      sendConfirmJoinSession(state.sessionId, state.x25519Keypair.publicKey);
			setConfirmedSession(true);
    }
  };

  // Called when a guest submits their username and the session id to join.
  const handleJoinSubmit = () => {
    if (
      !inputUsername ||
      !inputSessionId ||
      !state.ownKeypair ||
      !state.x25519Keypair
    )
      return;
    const sessionIdNumber = parseInt(inputSessionId, 10);
		dispatch(setUsername(inputUsername));
		dispatch(setIsHost(false));
    sendJoinSession(
      sessionIdNumber,
      inputUsername,
      state.x25519Keypair.publicKey,
      state.ownKeypair.public
    );
    setMode('waitingGuest');
  };

  return (
    <div className={style.overlay}>
      <div className={style.content}>
        {mode === 'initial' && (
          <div className={style.buttonContainer}>
            <Button onClick={() => setMode('create')}>Create Session</Button>
            <Button onClick={() => setMode('join')}>Join Session</Button>
          </div>
        )}

        {mode === 'create' && (
          <div>
            <input
              className={style.input}
              type="text"
              placeholder="Enter your username"
              value={inputUsername}
              onInput={(e: any) => setInputUsername(e.target.value)}
            />
            <Button onClick={handleCreateSubmit}>Submit</Button>
          </div>
        )}

        {mode === 'waitingHost' && (
          <div>
            <p>
              {state.sessionId
                ? `Session created. Your session ID is ${state.sessionId}.`
                : 'Creating session...'}
            </p>
            <p>Waiting for a guest to join...</p>
            {state.guestUsername && (
              <div>
                <p>Guest joined: {state.guestUsername}</p>
                <Button onClick={handleConfirmClick}>Confirm</Button>
              </div>
            )}
            <div className={style.spinner}>Loading...</div>
          </div>
        )}

        {mode === 'join' && (
          <div>
            <input
              className={style.input}
              type="text"
              placeholder="Enter your username"
              value={inputUsername}
              onInput={(e: any) => setInputUsername(e.target.value)}
            />
            <input
              className={style.input}
              type="text"
              placeholder="Enter session ID"
              value={inputSessionId}
              onInput={(e: any) => setInputSessionId(e.target.value)}
            />
            <Button onClick={handleJoinSubmit}>Join Session</Button>
          </div>
        )}

        {mode === 'waitingGuest' && (
          <div>
            <p>Waiting for session confirmation...</p>
            <div className={style.spinner}>Loading...</div>
          </div>
        )}
      </div>
    </div>
  );
}
