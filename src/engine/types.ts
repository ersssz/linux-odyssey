import type { Snapshot } from './snapshot';

export type EngineKind = 'real' | 'simulated';

export interface TerminalEngine {
  readonly kind: EngineKind;

  runUser(cmd: string): void;

  snapshot(homePath?: string): Promise<Snapshot>;
}
