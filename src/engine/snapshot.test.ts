import { describe, it, expect } from 'vitest';
import { parseLsLaR, parseProcs } from './snapshot';

const FIXTURE = `/root:
total 8
drwx------    3 0        0             0 Jun 19 10:00 .
drwxr-xr-x   18 0        0             0 Jun 19 10:00 ..
-rw-r--r--    1 0        0            12 Jun 19 10:00 hello.txt
drwxr-xr-x    2 0        0             0 Jun 19 10:00 docs

/root/docs:
total 4
drwxr-xr-x    2 0        0             0 Jun 19 10:00 .
drwx------    3 0        0             0 Jun 19 10:00 ..
-rwxr-xr-x    1 0        0             5 Jun 19 10:00 run.sh`;

describe('parseLsLaR', () => {
  const tree = parseLsLaR(FIXTURE, '/root');

  it('roots the tree at the given path', () => {
    expect(tree.name).toBe('/root');
    expect(tree.type).toBe('dir');
  });

  it('lists top-level entries and skips . and ..', () => {
    const names = tree.children?.map(c => c.name).sort();
    expect(names).toEqual(['docs', 'hello.txt']);
  });

  it('classifies file types from the permission bits', () => {
    const hello = tree.children?.find(c => c.name === 'hello.txt');
    const docs = tree.children?.find(c => c.name === 'docs');
    expect(hello?.type).toBe('file');
    expect(hello?.permissions).toBe('-rw-r--r--');
    expect(docs?.type).toBe('dir');
  });

  it('parses the byte size column', () => {
    const hello = tree.children?.find(c => c.name === 'hello.txt');
    expect(hello?.size).toBe(12);
    const run = tree.children
      ?.find(c => c.name === 'docs')
      ?.children?.find(c => c.name === 'run.sh');
    expect(run?.size).toBe(5);
  });

  it('nests children under the right directory', () => {
    const docs = tree.children?.find(c => c.name === 'docs');
    const run = docs?.children?.find(c => c.name === 'run.sh');
    expect(run).toBeDefined();
    expect(run?.type).toBe('exec'); // -rwxr-xr-x → executable
  });
});

describe('parseProcs', () => {
  const procs = parseProcs(`1 init
2 kthreadd
60 sleep
61 sh

bogus line`);

  it('parses pid + comm and skips junk', () => {
    expect(procs).toEqual([
      { pid: 1, comm: 'init' },
      { pid: 2, comm: 'kthreadd' },
      { pid: 60, comm: 'sleep' },
      { pid: 61, comm: 'sh' },
    ]);
  });

  it('sorts by pid ascending', () => {
    const out = parseProcs('5 e\n3 c\n1 a');
    expect(out.map(p => p.pid)).toEqual([1, 3, 5]);
  });
});
