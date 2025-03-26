import {
  BoardContextEndGameAction,
  BoardContextMakeMoveAction,
  BoardContextSetBoardFromJsonAction,
  BoardContextStartGameAction,
  BoardContextUpdatePlayerMovesAction,
} from './board-context-types';
import { BoardContextInitBoardAction, BoardContextActionType } from '.';

export const initBoardAction = (payload: BoardContextInitBoardAction['payload']): BoardContextInitBoardAction => {
  return {
    type: BoardContextActionType.INIT_BOARD,
    payload,
  };
};

export const startGame = (): BoardContextStartGameAction => {
  return {
    type: BoardContextActionType.START_GAME,
    payload: null,
  };
};

export const endGame = (): BoardContextEndGameAction => {
  return {
    type: BoardContextActionType.END_GAME,
    payload: null,
  };
};

export const updatePlayerMoves = (): BoardContextUpdatePlayerMovesAction => {
  return {
    type: BoardContextActionType.UPDATE_PLAYER_MOVES,
    payload: null,
  };
};

export const makeMove = (
  payload: BoardContextMakeMoveAction['payload']
): BoardContextMakeMoveAction => {
  return {
    type: BoardContextActionType.MAKE_MOVE,
    payload,
  };
};

export const setBoardFromJson = (boardJson: string): BoardContextSetBoardFromJsonAction => ({
  type: BoardContextActionType.SET_BOARD_FROM_JSON,
  payload: boardJson,
});

