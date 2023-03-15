import { Color } from 'wasm-checkers';
import ColorSelectButton from '../../components/ColorSelectButton';
import style from './ColorSelection.module.scss';

export type ColorSelectionProps = {};

function ColorSelection(props: ColorSelectionProps) {
  return (
    <>
      <h1>Player Color</h1>
      <div className={style.container}>
        <ColorSelectButton color={Color.White} label="White" />
        <ColorSelectButton color={Color.Empty} label="Random" />
        <ColorSelectButton color={Color.Black} label="Black" />
      </div>
    </>
  );
}

export default ColorSelection;
