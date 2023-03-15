import { Color, Board, MoveGenerator, CheckersAi } from 'wasm-checkers';
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
      return getInitialBoardState();
    }
    case BoardContextActionType.START_GAME: {
      const playerColor =
        state.gameSettings.playerColor === Color.Empty
          ? Math.floor(Math.random() * 2 + 1)
          : state.gameSettings.playerColor;
      const opponentColor =
        playerColor == Color.White ? Color.Black : Color.White;

      return {
        ...state,
        startTime: new Date(),
        gameStarted: true,
        gameSettings: { ...state.gameSettings, playerColor, opponentColor },
      };
    }
    case BoardContextActionType.END_GAME: {
      return { ...state, endTime: new Date(), gameStarted: false };
    }
    case BoardContextActionType.UPDATE_GAME_SETTINGS: {
      const gameSettings = payload;

      return {
        ...state,
        gameSettings: { ...state.gameSettings, ...gameSettings },
      };
    }
    case BoardContextActionType.UPDATE_PLAYER_MOVES: {
      const previousMove = state.moveHistory.reverse().find((move) => {
        return move.moved_piece.color == state.gameSettings.playerColor;
      });
      const forcedPlayerMoves = previousMove?.get_forced_moves_js() || [];

      if (forcedPlayerMoves.length > 0) {
        return { ...state, playerMoves: forcedPlayerMoves };
      }

      const playerMoves = MoveGenerator.get_valid_moves_js(
        state.board as Board,
        state.gameSettings.playerColor,
        state.gameSettings.checkersSettings
      );

      return { ...state, playerMoves };
    }
    case BoardContextActionType.MAKE_MOVE: {
      const move = payload;
      const board = state.board;

      board.handle_move(move);

      const currentEvaluation = CheckersAi.get_heuristic_value_js(
        board,
        state.gameSettings.checkersSettings
      );

      if ((move.get_forced_moves_js() || []).length > 0) {
        return {
          ...state,
          moveUpdate: !state.moveUpdate,
          moveHistory: [...state.moveHistory, move],
        };
      }

      const currentColorToMove =
        state.currentColorToMove == Color.White ? Color.Black : Color.White;
      const currentTurn = state.currentTurn + 1;

      return {
        ...state,
        board,
        currentEvaluation,
        currentTurn,
        currentColorToMove,
        moveUpdate: !state.moveUpdate,
        moveHistory: [...state.moveHistory, move],
      };
    }
    default: {
      throw new Error('Invalid board reducer action provided.');
    }
  }
};
