import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { isRealLinuxSupported, realLinuxUnsupportedReason } from './v86';
import type { EngineKind } from './types';

interface EngineContextValue {
  kind: EngineKind;

  supported: boolean;

  reason: string | null;
}

const EngineContext = createContext<EngineContextValue | null>(null);

function simForced(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const search = new URLSearchParams(window.location.search).get('engine');
    const hash = window.location.hash.includes('?')
      ? new URLSearchParams(window.location.hash.split('?')[1]).get('engine')
      : null;
    const stored = localStorage.getItem('linux-odyssey-engine');
    return [search, hash, stored].includes('sim');
  } catch {
    return false;
  }
}

export function EngineProvider({ children }: { children: ReactNode }) {
  const value = useMemo<EngineContextValue>(() => {
    const supported = !simForced() && isRealLinuxSupported();
    return {
      kind: supported ? 'real' : 'simulated',
      supported,
      reason: simForced() ? 'forced simulated engine' : realLinuxUnsupportedReason(),
    };
  }, []);
  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEngine(): EngineContextValue {
  const value = useContext(EngineContext);
  if (!value) throw new Error('useEngine must be used within EngineProvider');
  return value;
}
