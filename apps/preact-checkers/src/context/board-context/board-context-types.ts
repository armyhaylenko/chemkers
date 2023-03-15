import { Board, Color, Move } from 'wasm-checkers';
import { CheckersGameSettings } from '../../types';

export type BoardContextState = {
  board: Board;
  gameStarted: boolean;
  currentTurn: number;
  currentEvaluation: number;
  currentColorToMove: Color;
  moveHistory: Move[];
  playerMoves: Move[];
  startTime: Date;
  endTime: Date;
  moveUpdate: boolean;
  gameSettings: CheckersGameSettings;
};

export enum BoardContextActionType {
  INIT_BOARD = 'INIT_BOARD',
  START_GAME = 'START_GAME',
  END_GAME = 'END_GAME',
  UPDATE_GAME_SETTINGS = 'UPDATE_GAME_SETTINGS',
  UPDATE_PLAYER_MOVES = 'UPDATE_PLAYER_MOVES',
  MAKE_MOVE = 'MAKE_MOVE',
  ADVANCE_TURN = 'ADVANCE_TURN',
}

export type BoardContextInitBoardAction = {
  type: BoardContextActionType.INIT_BOARD;
  payload: null;
};

export type BoardContextUpdateGameSettingsAction = {
  type: BoardContextActionType.UPDATE_GAME_SETTINGS;
  payload: Partial<CheckersGameSettings>;
};

export type BoardContextStartGameAction = {
  type: BoardContextActionType.START_GAME;
  payload: null;
};

export type BoardContextEndGameAction = {
  type: BoardContextActionType.END_GAME;
  payload: null;
};

export type BoardContextUpdatePlayerMovesAction = {
  type: BoardContextActionType.UPDATE_PLAYER_MOVES;
  payload: null;
};

export type BoardContextMakeMoveAction = {
  type: BoardContextActionType.MAKE_MOVE;
  payload: Move;
};

export type BoardContextAdvanceTurnAction = {
  type: BoardContextActionType.ADVANCE_TURN;
  payload: null;
};

export type BoardContextAction =
  | BoardContextInitBoardAction
  | BoardContextStartGameAction
  | BoardContextEndGameAction
  | BoardContextUpdateGameSettingsAction
  | BoardContextUpdatePlayerMovesAction
  | BoardContextMakeMoveAction
  | BoardContextAdvanceTurnAction;
