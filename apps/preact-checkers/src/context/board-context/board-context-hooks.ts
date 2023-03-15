import { useContext } from 'preact/hooks';
import { BoardContext, BoardContextReducer } from './board-context';
import { BoardContextState } from './board-context-types';

export function useBoard() {
  return useContext(BoardContext) as BoardContextState;
}

export function useBoardDispatch() {
  return useContext(BoardContextReducer);
}
