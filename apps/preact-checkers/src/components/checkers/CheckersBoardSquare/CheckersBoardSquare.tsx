import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Color, Move, Piece } from 'wasm-checkers';
import style from './CheckersBoardSquare.module.scss';

const DEBUG_SQUARE_INDEXES = import.meta.env.MODE === 'development';

interface CheckersBoardSquareProps {
  piece: Piece | undefined;
  index: number;
  highlighted: boolean;
  selected: boolean;
  selectedMoves: Move[];
  onMove: (move: Move) => void;
  onSelect: (index: number) => void;
  onClearSelect: () => void;
}

function CheckersBoardSquare({
  piece,
  index,
  highlighted,
  selected,
  selectedMoves,
  onMove,
  onSelect,
  onClearSelect,
}: CheckersBoardSquareProps) {
  if (piece == null) {
    const selectedMove = selectedMoves.find(
      (move) => move.end_square === index
    );

    const squareClassName = [
      style.square,
      selectedMove ? style.squareMoveable : '',
      highlighted ? style.squareHighlighted : '',
    ].join(' ');

    const handleEmptySquareClick = () => {
      if (selectedMove) {
        onMove(selectedMove);
      } else {
        onClearSelect();
      }
    };

    return (
      <div className={squareClassName} onClick={handleEmptySquareClick}>
        {DEBUG_SQUARE_INDEXES && (
          <span className={style.squareIndex}>{index}</span>
        )}
      </div>
    );
  }

  const squareClassName = [
    style.square,
    style.squareFilled,
    selected ? style.squareSelected : '',
    highlighted ? style.squareHighlighted : '',
  ].join(' ');

  const pieceClassName = [
    style.piece,
    piece.color === Color.Black ? style.pieceBlack : '',
    piece.king ? style.pieceKing : '',
  ].join(' ');

  return (
    <div className={squareClassName} onClick={() => onSelect(index)}>
      <div className={pieceClassName}>
        {piece.king && (
          <FontAwesomeIcon className={style.pieceKingIcon} icon={faCrown} />
        )}
      </div>
      {DEBUG_SQUARE_INDEXES && (
        <span className={style.squareIndex}>{index}</span>
      )}
    </div>
  );
}

export default CheckersBoardSquare;
