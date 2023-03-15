import init, { Board, CheckersAi, Color, Move } from 'wasm-checkers';
import { CheckersGameSettings } from '../types';

export const initWasm = async () => {
  if (!import.meta.env.VITE_WASM_PATH) {
    await init();
  } else {
    await init(import.meta.env.VITE_WASM_PATH);
  }
};

export const getBestMove = async (
  boardJson: string,
  color: Color,
  previousMove: string | null,
  gameSettings: CheckersGameSettings
): Promise<string | null> => {
  const board = Board.from_json(boardJson);
  const bestMove = CheckersAi.get_best_move_alphabeta(
    board,
    color,
    gameSettings.computerDepth,
    gameSettings.checkersSettings,
    previousMove ? Move.from_json(previousMove) : undefined
  );

  if (!bestMove) {
    return null;
  }

  return bestMove.to_json();
};
