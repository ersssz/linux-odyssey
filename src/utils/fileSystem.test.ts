import { describe, it, expect } from 'vitest';
import {
  applyChmod,
  cloneFs,
  formatLs,
  formatTree,
  getNode,
  getParent,
  initialFileSystem,
  normalizePath,
  resolvePath,
} from './fileSystem';

describe('fileSystem utils', () => {
  it('normalizes paths', () => {
    expect(normalizePath('/home/penguin//Documents')).toBe('/home/penguin/Documents');
    expect(normalizePath('/home/penguin/../..')).toBe('/');
    expect(normalizePath('/home/penguin/./Documents')).toBe('/home/penguin/Documents');
  });

  it('resolves relative paths', () => {
    expect(resolvePath('/home/penguin', 'Documents')).toBe('/home/penguin/Documents');
    expect(resolvePath('/home/penguin', '..')).toBe('/home');
    expect(resolvePath('/home/penguin', '/etc')).toBe('/etc');
  });

  it('finds nodes by path', () => {
    const fs = cloneFs(initialFileSystem);
    expect(getNode(fs, '/home/penguin')).toBeTruthy();
    expect(getNode(fs, '/home/penguin/Documents/hello.txt')).toBeTruthy();
    expect(getNode(fs, '/nonexistent')).toBeNull();
  });

  it('finds parent nodes', () => {
    const fs = cloneFs(initialFileSystem);
    expect(getParent(fs, '/home/penguin/Documents/hello.txt')?.name).toBe('Documents');
    expect(getParent(fs, '/')).toBeNull();
  });

  it('formats ls output', () => {
    const fs = cloneFs(initialFileSystem);
    const penguin = getNode(fs, '/home/penguin')!;
    const output = formatLs(penguin);
    expect(output).toContain('Documents');
    expect(output).toContain('Pictures');
  });

  it('formats tree output', () => {
    const fs = cloneFs(initialFileSystem);
    const penguin = getNode(fs, '/home/penguin')!;
    const output = formatTree(penguin);
    expect(output).toContain('Documents');
    expect(output).toContain('hello.txt');
  });

  it('applies numeric chmod', () => {
    const fs = cloneFs(initialFileSystem);
    const file = getNode(fs, '/home/penguin/run.sh')!;
    expect(file.permissions).toBe('-rw-r--r--');
    applyChmod(file, '755');
    expect(file.permissions).toBe('-rwxr-xr-x');
  });

  it('applies symbolic chmod', () => {
    const fs = cloneFs(initialFileSystem);
    const file = getNode(fs, '/home/penguin/run.sh')!;
    applyChmod(file, 'u+x');
    expect(file.permissions).toBe('-rwxr--r--');
  });
});
