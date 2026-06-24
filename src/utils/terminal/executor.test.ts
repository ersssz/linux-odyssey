import { describe, it, expect } from 'vitest';
import { executeCommand, parseShell } from './executor';
import { cloneFs, initialFileSystem } from '../fileSystem';
import { parseAnsi } from '../ansi';
import type { TerminalContext } from './types';

function stripAnsi(input: string): string {
  return parseAnsi(input)
    .map(s => s.text)
    .join('');
}

function makeContext(): TerminalContext {
  return {
    fs: cloneFs(initialFileSystem),
    cwd: '/home/penguin',
    user: 'penguin',
    env: { HOME: '/home/penguin', PATH: '/usr/bin', USER: 'penguin' },
    aliases: {},
    commandHistory: [],
  };
}

describe('parseShell', () => {
  it('parses simple commands', () => {
    const parsed = parseShell('ls -la');
    expect(parsed.args).toEqual(['ls', '-la']);
  });

  it('parses quoted arguments', () => {
    const parsed = parseShell('echo "hello world"');
    expect(parsed.args).toEqual(['echo', 'hello world']);
  });

  it('detects redirection', () => {
    const parsed = parseShell('echo hi > file.txt');
    expect(parsed.redirectOut).toBe('file.txt');
  });

  it('detects pipes', () => {
    const parsed = parseShell('ls | grep txt');
    expect(parsed.hasPipe).toBe(true);
    expect(parsed.pipeTarget).toBe('grep txt');
  });
});

describe('executeCommand', () => {
  it('executes pwd', () => {
    const result = executeCommand('pwd', makeContext());
    expect(result.output).toBe('/home/penguin');
  });

  it('executes ls', () => {
    const result = executeCommand('ls', makeContext());
    expect(result.output).toContain('Documents');
    expect(result.output).toContain('Pictures');
  });

  it('executes ls with flags (-la, -a, -al) without treating them as a path', () => {
    for (const cmd of ['ls -la', 'ls -a', 'ls -al', 'ls -lah']) {
      const result = executeCommand(cmd, makeContext());
      expect(result.error, `${cmd} should not error`).toBeUndefined();
      expect(result.output).toContain('Documents');
    }
  });

  it('ls -a reveals dotfiles while plain ls hides them', () => {
    const ctx = makeContext();
    const touched = executeCommand('touch .secret', ctx);
    const ctx2 = { ...ctx, fs: touched.newFs ?? ctx.fs };
    const plain = executeCommand('ls', ctx2);
    const all = executeCommand('ls -a', ctx2);
    expect(plain.output).not.toContain('.secret');
    expect(all.output).toContain('.secret');
  });

  it('executes cat', () => {
    const result = executeCommand('cat Documents/hello.txt', makeContext());
    expect(result.output).toContain('Привет');
  });

  it('executes cd and pwd', () => {
    const ctx = makeContext();
    const r1 = executeCommand('cd Documents', ctx);
    expect(r1.newCwd).toBe('/home/penguin/Documents');
    const r2 = executeCommand('pwd', { ...ctx, cwd: r1.newCwd! });
    expect(r2.output).toBe('/home/penguin/Documents');
  });

  it('executes echo with redirection', () => {
    const ctx = makeContext();
    const result = executeCommand('echo "test content" > test.txt', ctx);
    expect(result.skipOutput).toBe(true);
    const newFs = result.newFs!;
    const node = newFs.children
      ?.find(c => c.name === 'home')
      ?.children?.find(c => c.name === 'penguin')
      ?.children?.find(c => c.name === 'test.txt');
    expect(node?.content).toBe('test content');
  });

  it('executes pipe ls | grep', () => {
    const result = executeCommand('ls | grep Doc', makeContext());
    expect(result.output).toContain('Documents');
  });

  it('executes lsb_release -a', () => {
    const result = executeCommand('lsb_release -a', makeContext());
    expect(result.output).toContain('Ubuntu');
  });

  it('executes lsmod', () => {
    const result = executeCommand('lsmod', makeContext());
    expect(result.output).toContain('Module');
  });

  it('executes grep with line numbers', () => {
    const ctx = makeContext();
    const echoResult = executeCommand('echo "hello world" > test.txt', ctx);
    const result = executeCommand('grep -n hello test.txt', {
      ...ctx,
      fs: echoResult.newFs!,
      cwd: '/home/penguin',
    });
    const plain = stripAnsi(result.output || '');
    expect(plain).toContain('hello world');
    expect(plain).toMatch(/\d+:hello world/);
  });

  it('shows unknown command message', () => {
    const result = executeCommand('unknowncmd', makeContext());
    expect(result.error).toContain('command not found');
  });

  it('executes mkdir', () => {
    const ctx = makeContext();
    const result = executeCommand('mkdir newdir', ctx);
    const newFs = result.newFs!;
    const home = newFs.children
      ?.find(c => c.name === 'home')
      ?.children?.find(c => c.name === 'penguin');
    expect(home?.children?.find(c => c.name === 'newdir')).toBeDefined();
  });

  it('does not crash on invalid grep pattern', () => {
    const result = executeCommand('grep [ message.txt', makeContext());
    expect(result.error).toContain('invalid pattern');
  });

  it('suggests commands on typo', () => {
    const result = executeCommand('lss', makeContext());
    expect(result.error).toContain('Did you mean');
  });

  it('suggests pwd for transposed typo pdw', () => {
    const result = executeCommand('pdw', makeContext());
    expect(result.error).toContain('Did you mean');
    expect(result.error).toContain('pwd');
  });

  it('suggests ls for transposed typo sl', () => {
    const result = executeCommand('sl', makeContext());
    expect(result.error).toContain('ls');
  });

  it('copies directory with contents', () => {
    const ctx = makeContext();
    const result = executeCommand('cp Documents Docs', ctx);
    const newFs = result.newFs!;
    const home = newFs.children
      ?.find(c => c.name === 'home')
      ?.children?.find(c => c.name === 'penguin');
    const docs = home?.children?.find(c => c.name === 'Docs');
    expect(docs?.children?.length).toBeGreaterThan(0);
    expect(docs?.children?.find(c => c.name === 'hello.txt')).toBeDefined();
  });

  it('moves directory with contents', () => {
    const ctx = makeContext();
    const result = executeCommand('mv Documents Docs', ctx);
    const newFs = result.newFs!;
    const home = newFs.children
      ?.find(c => c.name === 'home')
      ?.children?.find(c => c.name === 'penguin');
    const oldDocs = home?.children?.find(c => c.name === 'Documents');
    const newDir = home?.children?.find(c => c.name === 'Docs');
    expect(oldDocs).toBeUndefined();
    expect(newDir?.children?.length).toBeGreaterThan(0);
  });

  it('enforces read permissions on cat', () => {
    const ctx = makeContext();
    const chmod = executeCommand('chmod 000 Documents/hello.txt', ctx);
    expect(chmod.error).toBeUndefined();
    expect(chmod.newFs).toBeDefined();
    const result = executeCommand('cat Documents/hello.txt', { ...ctx, fs: chmod.newFs! });
    expect(result.output).toContain('Permission denied');
  });

  it('enforces execute permissions on cd', () => {
    const ctx = makeContext();
    const chmod = executeCommand('chmod 000 Documents', ctx);
    const result = executeCommand('cd Documents', { ...ctx, fs: chmod.newFs! });
    expect(result.error).toContain('permission denied');
  });

  it('enforces write permissions on redirect', () => {
    const ctx = makeContext();
    const chmod = executeCommand('chmod 555 /home/penguin', ctx);
    const result = executeCommand('echo x > /home/penguin/new.txt', { ...ctx, fs: chmod.newFs! });
    expect(result.error).toContain('Permission denied');
  });

  it('sed replaces only the first occurrence without g flag', () => {
    const ctx = makeContext();
    const echoResult = executeCommand('echo "a a a" > /home/penguin/sed.txt', ctx);
    const result = executeCommand('sed s/a/b/ /home/penguin/sed.txt', {
      ...ctx,
      fs: echoResult.newFs || ctx.fs,
    });
    expect(result.output).toContain('b a a');
  });

  it('sed replaces all occurrences with g flag', () => {
    const ctx = makeContext();
    const echoResult = executeCommand('echo "a a a" > /home/penguin/sed.txt', ctx);
    const result = executeCommand('sed s/a/b/g /home/penguin/sed.txt', {
      ...ctx,
      fs: echoResult.newFs || ctx.fs,
    });
    expect(result.output).toContain('b b b');
  });

  it('cal generates a real calendar for current month', () => {
    const result = executeCommand('cal', makeContext());
    expect(result.output).toContain(new Date().toLocaleString('en-US', { month: 'long' }));
    expect(result.output).toMatch(/\d/);
  });

  it('ping respects -c count flag', () => {
    const result = executeCommand('ping -c 3 localhost', makeContext());
    expect(result.output).toContain('3 packets transmitted');
    expect(result.output).toContain('icmp_seq=3');
  });

  it('supports multi-pipe with wc -l flag', () => {
    const ctx = makeContext();
    const result = executeCommand('cat Documents/hello.txt | grep world | wc -l', ctx);
    expect(result.error).toBeUndefined();
    expect(stripAnsi(result.output || '')).toMatch(/^[1-9]\d*$/);
  });

  it('supports three-stage pipe', () => {
    const ctx = makeContext();
    const result = executeCommand('ls -1 | sort | head -n 3', ctx);
    expect(result.error).toBeUndefined();
    const lines = stripAnsi(result.output || '')
      .split('\n')
      .filter(Boolean);
    expect(lines.length).toBeLessThanOrEqual(3);
  });

  it('supports wc -w flag in pipe', () => {
    const ctx = makeContext();
    const result = executeCommand('echo "hello world foo" | wc -w', ctx);
    expect(result.error).toBeUndefined();
    expect(stripAnsi(result.output || '').trim()).toBe('3');
  });
});
