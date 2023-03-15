import { faSquare, faSquareCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'preact/hooks';
import { CheckersSetting, CheckersSettings, Color } from 'wasm-checkers';

import { useBoard, useBoardDispatch } from '../../../context';
import * as boardActions from '../../../context/board-context/board-context-actions';
import Button from '../../ui/Button';

import Overlay from '../../ui/Overlay';
import style from './GameSettingsOverlay.module.scss';
import ColorSelection from './sections/ColorSelection';
import DifficultySelection from './sections/DifficultySelection';

function GameSettingsOverlay() {
  const { gameSettings, gameStarted } = useBoard();
  const boardDispatch = useBoardDispatch();
  const [selectedSettings, setSelectedSettings] = useState<CheckersSetting[]>([
    CheckersSetting.ForcedCapture,
    CheckersSetting.FlyingKings,
    CheckersSetting.RegularCaptureBackwards,
    CheckersSetting.PromotionMoveTermination,
  ]);

  useEffect(() => {
    boardDispatch(
      boardActions.updateGameSettings({
        ...gameSettings,
        checkersSettings: selectedSettings.reduce((acc, a) => (acc |= a), 0),
      })
    );
  }, [gameStarted, gameSettings.playerColor]);

  const handleGameStart = () => {
    boardDispatch(boardActions.startGame());
  };

  const handleDepthSelect = (value: number) => {
    boardDispatch(
      boardActions.updateGameSettings({
        ...gameSettings,
        computerDepth: value,
      })
    );
  };

  const checkSetting = (setting: CheckersSetting) => {
    const newSettings = selectedSettings.includes(setting)
      ? selectedSettings.filter((s) => s !== setting)
      : [...selectedSettings, setting];
    boardDispatch(
      boardActions.updateGameSettings({
        ...gameSettings,
        checkersSettings: newSettings.reduce((acc, a) => (acc |= a), 0),
      })
    );
    setSelectedSettings(newSettings);
  };

  return (
    <Overlay footerContent={<Button onClick={handleGameStart}>Play</Button>}>
      <div className={style.content}>
        <p>A game of checkers.</p>
        <div className={style.section}>
          <ColorSelection />
        </div>
        <div className={style.section}>
          <DifficultySelection />
        </div>
        <div className={style.section}>
          <h3 className={style.sectionTitle}>Game Rules</h3>

          <div className={style.settingsGrid}>
            <button
              className={style.settingsButton}
              onClick={() => checkSetting(CheckersSetting.ForcedCapture)}
            >
              <FontAwesomeIcon
                className={style.settingButtonIcon}
                icon={
                  selectedSettings.includes(CheckersSetting.ForcedCapture)
                    ? faSquareCheck
                    : faSquare
                }
              />
              <div className={style.settingsButtonContent}>
                Forced Captures
                <p className={style.settingsButtonDescription}>
                  Captures are forced. You must take a capture that is presented
                  to you.
                </p>
              </div>
            </button>
            <button
              className={style.settingsButton}
              onClick={() =>
                checkSetting(CheckersSetting.RegularCaptureBackwards)
              }
            >
              <FontAwesomeIcon
                className={style.settingButtonIcon}
                icon={
                  selectedSettings.includes(
                    CheckersSetting.RegularCaptureBackwards
                  )
                    ? faSquareCheck
                    : faSquare
                }
              />
              <div className={style.settingsButtonContent}>
                Non-king Capture Backwards
                <p className={style.settingsButtonDescription}>
                  Pieces that are not Kings can capture other pieces, even if it
                  means going backwards.
                </p>
              </div>
            </button>
            <button
              className={style.settingsButton}
              onClick={() => checkSetting(CheckersSetting.FlyingKings)}
            >
              <FontAwesomeIcon
                className={style.settingButtonIcon}
                icon={
                  selectedSettings.includes(CheckersSetting.FlyingKings)
                    ? faSquareCheck
                    : faSquare
                }
              />
              <div className={style.settingsButtonContent}>
                Flying Kings
                <p className={style.settingsButtonDescription}>
                  Kings can move along diagonals any number of squares.
                </p>
              </div>
            </button>
            <button
              className={style.settingsButton}
              onClick={() =>
                checkSetting(CheckersSetting.PromotionMoveTermination)
              }
            >
              <FontAwesomeIcon
                className={style.settingButtonIcon}
                icon={
                  selectedSettings.includes(
                    CheckersSetting.PromotionMoveTermination
                  )
                    ? faSquareCheck
                    : faSquare
                }
              />
              <div className={style.settingsButtonContent}>
                Promotion Move Termination
                <p className={style.settingsButtonDescription}>
                  Upon promoting to a king your move will end even if you were
                  chaining captures.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

export default GameSettingsOverlay;
