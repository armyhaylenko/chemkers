import style from './App.module.scss';
import CheckersBoard from '../../checkers/CheckersBoard';
import GameSettingsOverlay from '../../overlays/GameSettingsOverlay';
import Overlay from '../../ui/Overlay';
import { useBoard, useBoardDispatch } from '../../../context';
import { initBoardAction } from '../../../context/board-context/board-context-actions';
import { useEffect, useState } from 'preact/hooks';
import GameEndOverlay from '../../overlays/GameEndOverlay';

function App() {
  const [gameEnded, setGameEnded] = useState(false);

  const { gameStarted } = useBoard();
  const boardDispatch = useBoardDispatch();

  const handleNewGame = () => {
    setGameEnded(false);
    boardDispatch(initBoardAction());
  };

  const handleGameEnd = () => {
    setGameEnded(true);
  };

  return (
    <main className={style.main}>
      <div class={style.board}>
        <CheckersBoard onGameEnd={handleGameEnd} />
      </div>
      {!gameEnded && !gameStarted && <GameSettingsOverlay />}
      {gameEnded && <GameEndOverlay onClose={handleNewGame} />}
    </main>
  );
}

export default App;
