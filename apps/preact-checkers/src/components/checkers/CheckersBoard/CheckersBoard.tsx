import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  Board,
  CheckersAi,
  Color,
  Move,
  MoveGenerator,
  Piece,
} from 'wasm-checkers';
import style from './CheckersBoard.module.scss';

import CheckersBoardSquare from '../CheckersBoardSquare';
import { wasmCheckersWorker } from '../../../web-workers';
import { CheckersGameSettings } from '../../../types';
import { useBoard, useBoardDispatch } from '../../../context';
import * as boardActions from '../../../context/board-context/board-context-actions';

export interface CheckersBoardProps {
  onGameEnd: () => void;
}

function CheckersBoard({ onGameEnd }: CheckersBoardProps) {
  const {
    board,
    playerMoves,
    gameStarted,
    moveHistory,
    moveUpdate,
    currentColorToMove,
    gameSettings,
  } = useBoard();
  const boardDispatch = useBoardDispatch();

  const [boardPieces, setBoardPieces] = useState<Piece[]>([]);
  const [selectedMoves, setSelectedMoves] = useState<Move[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number>(-1);
  const [highlightedSquares, setHighlightedSquares] = useState<number[]>([]);

  useEffect(() => {
    boardDispatch(boardActions.initBoardAction());
    setBoardPieces(getBoardPieces());
  }, []);

  useEffect(() => {
    if (!gameStarted) {
      return;
    }

    if (currentColorToMove == gameSettings.opponentColor) {
      makeOpponentMove();
      return;
    }
  }, [gameStarted, currentColorToMove, moveUpdate]);

  useEffect(() => {
    boardDispatch(boardActions.updatePlayerMoves());
    setBoardPieces(getBoardPieces());
  }, [gameStarted, moveHistory]);

  useEffect(() => {
    setHighlightedSquares([]);
  }, [gameStarted]);

  useEffect(() => {
    setHighlightedSquares([]);
    setBoardPieces(getBoardPieces());
  }, []);

  useEffect(() => {
    if (currentColorToMove === gameSettings.playerColor) {
      setSelectedMoves(
        playerMoves.filter((move) => move.start_square === selectedPieceIndex)
      );
    } else {
      setSelectedMoves([]);
    }
  }, [playerMoves, selectedPieceIndex]);

  const getBoardPieces = () => {
    const pieces = Array.from(board.get_pieces());

    if (gameSettings.playerColor === Color.White) {
      return pieces.reverse();
    }

    return pieces;
  };

  const checkAndEndGame = () => {
    if (!board.is_game_over(gameSettings.checkersSettings)) {
      return;
    }

    // TODO: Make opponent move

    onGameEnd();
    boardDispatch(boardActions.endGame());
  };

  const makePlayerMove = (move: Move) => {
    setHighlightedSquares([]);
    setSelectedMoves([]);

    setSelectedPieceIndex(move.end_square);

    boardDispatch(boardActions.makeMove(move));
    boardDispatch(boardActions.updatePlayerMoves());
    checkAndEndGame();
  };

  const makeOpponentMove = async () => {
    setSelectedMoves([]);

    const previousMove = moveHistory.at(-1);
    const previousMoveData =
      previousMove?.moved_piece.color === gameSettings.opponentColor
        ? previousMove.to_json()
        : null;
    const startTime = Date.now();
    const bestMoveData = await wasmCheckersWorker.getBestMove(
      board.to_json(),
      gameSettings.opponentColor,
      previousMoveData,
      gameSettings
    );

    if (!bestMoveData) {
      throw new Error(
        'Something went wrong with getting the best opponent move.'
      );
    }

    const bestMove = Move.from_json(bestMoveData);
    const timeTaken = Date.now() - startTime;

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, Math.max(0, 450 - timeTaken));
    });

    setHighlightedSquares([
      ...highlightedSquares,
      bestMove.start_square,
      bestMove.end_square,
    ]);
    boardDispatch(boardActions.makeMove(bestMove));
    checkAndEndGame();
  };

  const handleSelect = (index: number) => {
    setSelectedPieceIndex(index);
  };

  const handleClearSelect = () => {
    setSelectedMoves([]);
    setSelectedPieceIndex(-1);
  };

  const mappedSquares = boardPieces.map((piece, pieceIndex) => {
    const squareIndex =
      gameSettings.playerColor === Color.White ? 63 - pieceIndex : pieceIndex;

    return (
      <>
        <CheckersBoardSquare
          key={squareIndex}
          piece={piece}
          index={squareIndex}
          selectedMoves={selectedMoves}
          highlighted={highlightedSquares.includes(squareIndex)}
          selected={selectedPieceIndex === squareIndex}
          onMove={makePlayerMove}
          onSelect={handleSelect}
          onClearSelect={handleClearSelect}
        />
      </>
    );
  });

  return <div className={style.board}>{mappedSquares}</div>;
}

export default CheckersBoard;
