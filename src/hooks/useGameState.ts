import { useState, useCallback, useEffect } from 'react';
import { achievements } from '../data/achievements';

export interface GameState {
  xp: number;
  level: number;
  name: string;
  completed: Set<string>;
  currentModule: string | null;
  currentLesson: string | null;
  unlockedAchievements: Set<string>;
}

const XP_PER_LEVEL = 100;
const STORAGE_KEY = 'linux-odyssey-progress';

export function resolveAchievements(
  completed: Set<string>,
  baseXp: number,
  unlocked: Set<string>
): { xp: number; level: number; unlocked: Set<string> } {
  let xp = baseXp;
  let level = Math.floor(xp / XP_PER_LEVEL) + 1;
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of achievements) {
      if (!unlocked.has(a.id) && a.condition({ completed, xp, level })) {
        unlocked.add(a.id);
        xp += a.xp;
        level = Math.floor(xp / XP_PER_LEVEL) + 1;
        changed = true;
      }
    }
  }
  return { xp, level, unlocked };
}

function serializeState(state: GameState): string {
  return JSON.stringify({
    xp: state.xp,
    level: state.level,
    name: state.name,
    completed: Array.from(state.completed),
    unlockedAchievements: Array.from(state.unlockedAchievements),
  });
}

function deserializeState(data: string): Partial<GameState> | null {
  try {
    const parsed = JSON.parse(data);
    return {
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      level: typeof parsed.level === 'number' ? parsed.level : 1,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      completed: new Set(Array.isArray(parsed.completed) ? parsed.completed : []),
      unlockedAchievements: new Set(
        Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : []
      ),
    };
  } catch {
    return null;
  }
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = deserializeState(saved);
        if (parsed) {
          return {
            xp: parsed.xp ?? 0,
            level: parsed.level ?? 1,
            name: parsed.name ?? '',
            completed: parsed.completed ?? new Set(),
            unlockedAchievements: parsed.unlockedAchievements ?? new Set(),
            currentModule: null,
            currentLesson: null,
          };
        }
      }
    }
    return {
      xp: 0,
      level: 1,
      name: '',
      completed: new Set(),
      currentModule: null,
      currentLesson: null,
      unlockedAchievements: new Set(),
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, serializeState(state));
    }
  }, [state]);

  const addXp = useCallback((amount: number) => {
    setState(prev => {
      const unlocked = new Set(prev.unlockedAchievements);
      const { xp, level } = resolveAchievements(prev.completed, prev.xp + amount, unlocked);
      return { ...prev, xp, level, unlockedAchievements: unlocked };
    });
  }, []);

  const completeLesson = useCallback((moduleId: string, lessonId: string, xp: number) => {
    const key = `${moduleId}:${lessonId}`;
    setState(prev => {
      if (prev.completed.has(key)) return prev;
      const completed = new Set(prev.completed);
      completed.add(key);
      const unlocked = new Set(prev.unlockedAchievements);
      const { xp: newXp, level: newLevel } = resolveAchievements(completed, prev.xp + xp, unlocked);
      return {
        ...prev,
        completed,
        xp: newXp,
        level: newLevel,
        unlockedAchievements: unlocked,
      };
    });
  }, []);

  const setName = useCallback((name: string) => {
    setState(prev => ({ ...prev, name: name.slice(0, 24) }));
  }, []);

  const isLessonCompleted = useCallback(
    (moduleId: string, lessonId: string) => {
      return state.completed.has(`${moduleId}:${lessonId}`);
    },
    [state.completed]
  );

  const selectModule = useCallback((moduleId: string | null) => {
    setState(prev => ({ ...prev, currentModule: moduleId, currentLesson: null }));
  }, []);

  const selectLesson = useCallback((moduleId: string, lessonId: string) => {
    setState(prev => ({ ...prev, currentModule: moduleId, currentLesson: lessonId }));
  }, []);

  const resetProgress = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setState({
      xp: 0,
      level: 1,
      name: '',
      completed: new Set(),
      currentModule: null,
      currentLesson: null,
      unlockedAchievements: new Set(),
    });
  }, []);

  return {
    state,
    addXp,
    completeLesson,
    isLessonCompleted,
    selectModule,
    selectLesson,
    resetProgress,
    setName,
  };
}
