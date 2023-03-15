import classNames from 'classnames';
import { Color } from 'wasm-checkers';

import style from './ColorSelectButton.module.scss';

import { useBoard, useBoardDispatch } from '../../../../../context';
import { updateGameSettings } from '../../../../../context/board-context/board-context-actions';

export type ColorSelectButtonProps = {
  color: Color;
  label?: string;
};

function ColorSelectButton({ color, label }: ColorSelectButtonProps) {
  const {
    gameSettings: { playerColor },
  } = useBoard();
  const boardDispatch = useBoardDispatch();

  const handleSelect = () => {
    boardDispatch(
      updateGameSettings({
        playerColor: color,
      })
    );
  };

  return (
    <div className={style.container}>
      <button
        className={classNames(style.button, {
          [style.buttonBlack]: color == Color.Black,
          [style.buttonRandom]: color === Color.Empty,
          [style.buttonSelected]: playerColor === color,
        })}
        onClick={handleSelect}
      ></button>
      <span className={style.label}>{label}</span>
    </div>
  );
}

export default ColorSelectButton;
