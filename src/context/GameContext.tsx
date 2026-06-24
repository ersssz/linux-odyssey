import { createContext, type ReactNode } from 'react';
import { useGameState, type GameState } from '../hooks/useGameState';

interface GameContextValue {
  state: GameState;
  addXp: (amount: number) => void;
  completeLesson: (moduleId: string, lessonId: string, xp: number) => void;
  isLessonCompleted: (moduleId: string, lessonId: string) => boolean;
  selectModule: (moduleId: string | null) => void;
  selectLesson: (moduleId: string, lessonId: string) => void;
  resetProgress: () => void;
  setName: (name: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const gameState = useGameState();
  return <GameContext.Provider value={gameState}>{children}</GameContext.Provider>;
}
