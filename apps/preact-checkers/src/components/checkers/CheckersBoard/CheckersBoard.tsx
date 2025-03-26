import { useEffect, useState } from 'preact/hooks';
import { Color, Move, Piece } from 'wasm-checkers';
import style from './CheckersBoard.module.scss';

import CheckersBoardSquare from '../CheckersBoardSquare';
import {
  useBoard,
  useBoardDispatch,
  useNetworkSender,
  useNetworkState,
} from '../../../context';
import * as boardActions from '../../../context/board-context/board-context-actions';
import Button from '../../ui/Button';

function CheckersBoard() {
  const {
    board,
    playerMoves,
    gameStarted,
    moveHistory,
    moveUpdate,
    currentColorToMove,
    playerColor,
  } = useBoard();
  const networkState = useNetworkState();
  const { sendSendSessionMessage } = useNetworkSender();
  const boardDispatch = useBoardDispatch();

  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [boardPieces, setBoardPieces] = useState<Piece[]>([]);
  const [selectedMoves, setSelectedMoves] = useState<Move[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number>(-1);
  const [highlightedSquares, setHighlightedSquares] = useState<number[]>([]);

  useEffect(() => {
    if (!setupComplete && networkState.ratchetData) {
      boardDispatch(
        boardActions.initBoardAction({
          playerColor: networkState.isHost ? Color.White : Color.Black,
          opponentColor: networkState.isHost ? Color.Black : Color.White,
        })
      );
      setBoardPieces(getBoardPieces());
      setSetupComplete(true);
    }
  }, [networkState]);

  useEffect(() => {
    if (setupComplete && networkState.lastReceivedMessage) {
      boardDispatch(
        boardActions.setBoardFromJson(networkState.lastReceivedMessage)
      );
    }
  }, [networkState.lastReceivedMessage]);

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
    if (currentColorToMove === playerColor) {
      setSelectedMoves(
        playerMoves.filter((move) => move.start_square === selectedPieceIndex)
      );
    } else {
      setSelectedMoves([]);
    }
  }, [playerMoves, selectedPieceIndex, moveUpdate]);

  const getBoardPieces = () => {
    const pieces = Array.from(board.get_pieces());

    if (playerColor === Color.White) {
      return pieces.reverse();
    }

    return pieces;
  };

  const makePlayerMove = (move: Move) => {
    setHighlightedSquares([]);
    setSelectedMoves([]);
    setSelectedPieceIndex(move.end_square);

    // Apply the move locally.
    boardDispatch(boardActions.makeMove(move));
    boardDispatch(boardActions.updatePlayerMoves());
  };

  const handleEndTurn = () => {
    const newBoardJson = board.to_json();
    const payload = JSON.stringify({
      board: newBoardJson,
      moveHistory: moveHistory.map((m) => m.to_json()),
    });

    // Use the network sender to send the update.
    sendSendSessionMessage(networkState.sessionId!, payload);
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
      playerColor === Color.White ? 63 - pieceIndex : pieceIndex;

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

  return (
    <div className={style.container}>
      <div className={style.board}>
        {setupComplete ? mappedSquares : undefined}
      </div>
      <div className={style.endTurn}>
        <Button onClick={handleEndTurn}>End Turn</Button>
      </div>
    </div>
  );
}

export default CheckersBoard;
