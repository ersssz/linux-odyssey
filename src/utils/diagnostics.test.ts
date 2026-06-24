import { describe, it, expect } from 'vitest';
import { diagnoseCommand } from './diagnostics';
import { cloneFs, initialFileSystem } from './fileSystem';
import type { TerminalState } from '../components/Terminal';

function makeState(overrides: Partial<TerminalState> = {}): TerminalState {
  return {
    cwd: '/home/penguin',
    fs: cloneFs(initialFileSystem),
    lastOutput: '',
    ...overrides,
  };
}

describe('diagnoseCommand', () => {
  it('returns null for an empty command', () => {
    expect(diagnoseCommand('', makeState())).toBeNull();
  });

  it('diagnoses mkdir without a target', () => {
    const msg = diagnoseCommand('mkdir', makeState());
    expect(msg).toContain('mkdir mydir');
  });

  it('diagnoses mkdir into a non-existent parent', () => {
    const msg = diagnoseCommand('mkdir missing/dir', makeState({ cwd: '/home/penguin' }));
    expect(msg).toContain('не создалась');
    expect(msg).toContain('/home/penguin');
  });

  it('diagnoses cd into a file', () => {
    const msg = diagnoseCommand('cd Documents/hello.txt', makeState());
    expect(msg).toContain('файл');
    expect(msg).toContain('cd работает только с директориями');
  });

  it('diagnoses cat of a directory', () => {
    const msg = diagnoseCommand('cat Documents', makeState());
    expect(msg).toContain('директория');
  });

  it('diagnoses cat of a missing file', () => {
    const msg = diagnoseCommand('cat missing.txt', makeState());
    expect(msg).toContain('не найден');
  });

  it('diagnoses chmod on a missing file', () => {
    const msg = diagnoseCommand('chmod 644 missing.txt', makeState());
    expect(msg).toContain('не найден');
  });

  it('diagnoses grep without a file', () => {
    const msg = diagnoseCommand('grep hello', makeState());
    expect(msg).toContain('два аргумента');
  });

  it('suggests sudo for whoami', () => {
    const msg = diagnoseCommand('whoami', makeState({ lastOutput: 'penguin' }));
    expect(msg).toContain('sudo');
  });
});
