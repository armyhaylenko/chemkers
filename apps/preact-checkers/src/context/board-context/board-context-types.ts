import { Board, Color, Move } from 'wasm-checkers';

export type BoardContextState = {
  board: Board;
  gameStarted: boolean;
  currentTurn: number;
  currentColorToMove: Color;
  moveHistory: Move[];
  playerMoves: Move[];
	playerPieces: number;
	opponentPieces: number;
  startTime: Date;
  endTime: Date;
  moveUpdate: boolean;
  playerColor: Color,
  opponentColor: Color,
};

export enum BoardContextActionType {
  INIT_BOARD = 'INIT_BOARD',
  START_GAME = 'START_GAME',
  END_GAME = 'END_GAME',
  UPDATE_PLAYER_MOVES = 'UPDATE_PLAYER_MOVES',
  MAKE_MOVE = 'MAKE_MOVE',
	SET_BOARD_FROM_JSON = 'SET_BOARD_FROM_JSON',
}

export type BoardContextInitBoardAction = {
  type: BoardContextActionType.INIT_BOARD;
  payload: {
		playerColor: Color,
		opponentColor: Color,
	};
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

export type BoardContextSetBoardFromJsonAction = {
  type: BoardContextActionType.SET_BOARD_FROM_JSON;
  payload: string;
};

export type BoardContextAction =
  | BoardContextInitBoardAction
  | BoardContextStartGameAction
  | BoardContextEndGameAction
  | BoardContextUpdatePlayerMovesAction
  | BoardContextMakeMoveAction
  | BoardContextSetBoardFromJsonAction;
