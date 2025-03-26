import { Color, Board, MoveGenerator, Move } from 'wasm-checkers';
import { getInitialBoardState } from './board-context';
import {
  BoardContextAction,
  BoardContextActionType,
  BoardContextState,
} from './board-context-types';

export const boardContextReducer = (
  state: BoardContextState,
  action: BoardContextAction
) => {
  const { type, payload } = action;

  switch (type) {
    case BoardContextActionType.INIT_BOARD: {
      const initialState = getInitialBoardState();
      return {
        ...initialState,
        playerColor: payload.playerColor,
        opponentColor: payload.opponentColor,
      };
    }
    case BoardContextActionType.START_GAME: {
      const opponentColor =
        state.playerColor === Color.White ? Color.Black : Color.White;

      return {
        ...state,
        startTime: new Date(),
        gameStarted: true,
        opponentColor,
      };
    }
    case BoardContextActionType.END_GAME: {
      return { ...state, endTime: new Date(), gameStarted: false };
    }
    case BoardContextActionType.UPDATE_PLAYER_MOVES: {
      const previousMove = state.moveHistory.reverse().find((move) => {
        return move.moved_piece.color === state.playerColor;
      });
      const forcedPlayerMoves = previousMove?.get_forced_moves_js() || [];

      if (forcedPlayerMoves.length > 0) {
        return { ...state, playerMoves: forcedPlayerMoves };
      }

      const playerMoves = MoveGenerator.get_valid_moves_js(
        state.board as Board,
        state.playerColor
      );

      return { ...state, playerMoves };
    }
    case BoardContextActionType.MAKE_MOVE: {
      const move = payload;
      const board = state.board;

      board.handle_move(move);

      if ((move.get_forced_moves_js() || []).length > 0) {
        return {
          ...state,
          moveUpdate: !state.moveUpdate,
          moveHistory: [...state.moveHistory, move],
        };
      }

      const currentColorToMove =
        state.currentColorToMove === Color.White ? Color.Black : Color.White;
      const currentTurn = state.currentTurn + 1;

      return {
        ...state,
        board,
        currentTurn,
        currentColorToMove,
        moveUpdate: !state.moveUpdate,
        moveHistory: [...state.moveHistory, move],
      };
    }

    case 'SET_BOARD_FROM_JSON': {
      const { board, moveHistory } = JSON.parse(action.payload);
      const newBoard = Board.from_json(board);
      const currentColorToMove =
        state.currentColorToMove === Color.White ? Color.Black : Color.White;
      const currentTurn = state.currentTurn + 1;
      return {
        ...state,
        board: newBoard,
        moveHistory: (moveHistory as string[]).map((m) => Move.from_json(m)),
        currentColorToMove,
        currentTurn,
      };
    }
    default: {
      throw new Error('Invalid board reducer action provided.');
    }
  }
};
