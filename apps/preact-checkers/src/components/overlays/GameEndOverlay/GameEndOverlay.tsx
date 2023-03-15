import { Color } from 'wasm-checkers';
import { useBoard, useBoardDispatch } from '../../../context';
import Button from '../../ui/Button';

import Overlay from '../../ui/Overlay';
import style from './GameEndOverlay.module.scss';

function GameSettingsOverlay({ onClose }: { onClose: () => void }) {
  const { currentEvaluation, currentTurn, startTime, endTime, gameSettings } =
    useBoard();
  const winnerColor = currentEvaluation > 0 ? Color.White : Color.Black;

  return (
    <Overlay footerContent={<Button onClick={onClose}>Play Again</Button>}>
      <div className={style.content}>
        <h1 className={style.heading}>
          {winnerColor === gameSettings.playerColor
            ? 'You have won! 🎉'
            : 'You lost 🤖'}
        </h1>
        <div className={style.stats}>
          <div className={style.section}>
            <div className={style.sectionHeading}>Score</div>
            {winnerColor === gameSettings.playerColor
              ? Math.abs(currentEvaluation)
              : -Math.abs(currentEvaluation)}
          </div>
          <div className={style.section}>
            <div className={style.sectionHeading}>Turn Count</div>
            {Math.ceil(currentTurn / 2)}
          </div>
          <div className={style.section}>
            <div className={style.sectionHeading}>Time Taken</div>
            {new Date(endTime.getTime() - startTime.getTime())
              .toISOString()
              .slice(14, 19)}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

export default GameSettingsOverlay;
