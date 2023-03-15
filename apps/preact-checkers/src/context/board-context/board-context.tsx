import { ComponentChildren, createContext } from 'preact';
import { useReducer } from 'preact/hooks';
import {
  Board,
  CheckersSettingPreset,
  CheckersSettings,
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
  currentEvaluation: 0,
  currentColorToMove: Color.White,
  startTime: new Date(),
  endTime: new Date(),
  moveUpdate: false,
  gameSettings: {
    playerColor: Color.White,
    opponentColor: Color.Black,
    computerDepth: 5,
    checkersSettings: CheckersSettings.from_preset(
      CheckersSettingPreset.RussianVariation
    ),
  },
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
