import {
  BoardContextAdvanceTurnAction,
  BoardContextEndGameAction,
  BoardContextMakeMoveAction,
  BoardContextStartGameAction,
  BoardContextUpdateGameSettingsAction,
  BoardContextUpdatePlayerMovesAction,
} from './board-context-types';
import { BoardContextInitBoardAction, BoardContextActionType } from '.';

export const initBoardAction = (): BoardContextInitBoardAction => {
  return {
    type: BoardContextActionType.INIT_BOARD,
    payload: null,
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

export const updateGameSettings = (
  payload: BoardContextUpdateGameSettingsAction['payload']
): BoardContextUpdateGameSettingsAction => {
  return {
    type: BoardContextActionType.UPDATE_GAME_SETTINGS,
    payload,
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

export const advanceTurn = (): BoardContextAdvanceTurnAction => {
  return {
    type: BoardContextActionType.ADVANCE_TURN,
    payload: null,
  };
};
