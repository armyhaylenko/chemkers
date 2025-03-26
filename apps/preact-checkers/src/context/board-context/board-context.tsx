import { ComponentChildren, createContext } from 'preact';
import { useReducer } from 'preact/hooks';
import {
  Board,
  Color,
} from 'wasm-checkers';
import { boardContextReducer } from './board-context-reducer';
import { BoardContextAction, BoardContextState } from './board-context-types';

export const getInitialBoardState: () => BoardContextState = () => ({
  board: new Board(),
  gameStarted: false,
  moveHistory: [],
  playerMoves: [],
  currentTurn: 0,
	playerPieces: 8,
	opponentPieces: 8,
  currentColorToMove: Color.White,
  startTime: new Date(),
  endTime: new Date(),
  moveUpdate: false,
  playerColor: Color.White,
  opponentColor: Color.Black,
});

export const BoardContext = createContext<BoardContextState | null>(null);

export const BoardContextReducer = createContext<
  (action: BoardContextAction) => void
>(() => {});

export const BoardContextProvider = ({
  children,
}: {
  children: ComponentChildren;
}) => {
  const [board, dispatch] = useReducer<BoardContextState, BoardContextAction>(
    boardContextReducer,
    getInitialBoardState()
  );

  return (
    <BoardContext.Provider value={board}>
      <BoardContextReducer.Provider value={dispatch}>
        {children}
      </BoardContextReducer.Provider>
    </BoardContext.Provider>
  );
};
