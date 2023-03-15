import { Color } from 'wasm-checkers';

export type CheckersGameSettings = {
  playerColor: Color;
  opponentColor: Color;
  computerDepth: number;
  checkersSettings: number;
};
