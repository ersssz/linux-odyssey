import type { FileNode } from '../utils/fileSystem';

export interface ProcInfo {
  pid: number;
  comm: string;

  victim?: boolean;
}

export function parseVictimPids(text: string): Set<number> {
  const set = new Set<number>();
  for (const line of text.split('\n')) {
    const n = Number(line.trim());
    if (Number.isInteger(n) && n > 0) set.add(n);
  }
  return set;
}

export interface Snapshot {
  cwd: string;
  fs: FileNode;
  procs: ProcInfo[];
}

export function parseProcs(text: string): ProcInfo[] {
  const procs: ProcInfo[] = [];
  for (const line of text.split('\n')) {
    const m = /^(\d+)\s+(.+)$/.exec(line.trim());
    if (m) procs.push({ pid: Number(m[1]), comm: m[2].trim() });
  }
  return procs.sort((a, b) => a.pid - b.pid);
}

interface RawEntry {
  name: string;
  type: FileNode['type'];
  permissions: string;
  owner?: string;
  size: number;
}

const LINE = /^([dlbcps-][rwxsStT-]{9})\s+\d+\s+(\S+)\s+\S+\s+(\d+)\s+\S+\s+\S+\s+\S+\s+(.+)$/;

function entryFromLine(line: string): RawEntry | null {
  const m = LINE.exec(line);
  if (!m) return null;
  const [, perms, owner, rawSize, rawName] = m;
  let name = rawName;
  if (perms[0] === 'l') name = name.split(' -> ')[0]; // strip symlink target
  if (name === '.' || name === '..') return null;
  const type: FileNode['type'] =
    perms[0] === 'd' ? 'dir' : perms[0] === '-' && /x/i.test(perms.slice(1)) ? 'exec' : 'file';
  return { name, type, permissions: perms, owner, size: Number(rawSize) };
}

export function parseLsLaR(output: string, rootName = '/'): FileNode {
  const root: FileNode = { name: rootName, type: 'dir', children: [], permissions: 'drwxr-xr-x' };

  const byPath = new Map<string, FileNode>();

  const blocks = output.split(/\n(?=\S.*:\n)/);
  let basePath: string | null = null;

  for (const block of blocks) {
    const lines = block.split('\n');
    let headerPath: string | null = null;
    let start = 0;
    if (/^\S.*:$/.test(lines[0]?.trim() ?? '') && lines[0].trim().endsWith(':')) {
      headerPath = lines[0].trim().replace(/:$/, '');
      start = 1;
    }
    if (basePath === null && headerPath !== null) {
      basePath = headerPath; // first header is the root we asked for
      byPath.set(basePath, root);
    }
    const dirPath = headerPath ?? basePath ?? rootName;
    const dirNode = byPath.get(dirPath) ?? root;

    for (let i = start; i < lines.length; i++) {
      const entry = entryFromLine(lines[i].trim());
      if (!entry) continue;
      const node: FileNode = {
        name: entry.name,
        type: entry.type,
        permissions: entry.permissions,
        owner: entry.owner,
        size: entry.size,
        ...(entry.type === 'dir' ? { children: [] } : {}),
      };
      dirNode.children = dirNode.children ?? [];
      dirNode.children.push(node);
      if (entry.type === 'dir') {
        const childPath = dirPath.endsWith('/') ? dirPath + entry.name : `${dirPath}/${entry.name}`;
        byPath.set(childPath, node);
      }
    }
  }

  return root;
}
