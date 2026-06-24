import { color } from './ansi';

export type FileType = 'file' | 'dir' | 'exec';

export interface FileNode {
  name: string;
  type: FileType;
  content?: string;
  children?: FileNode[];
  permissions?: string;
  owner?: string;
  size?: number;
}

export interface FileSystemState {
  root: FileNode;
  cwd: string;
}

export const initialFileSystem: FileNode = {
  name: '/',
  type: 'dir',
  permissions: 'drwxr-xr-x',
  owner: 'root',
  children: [
    {
      name: 'home',
      type: 'dir',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      children: [
        {
          name: 'penguin',
          type: 'dir',
          permissions: 'drwxr-xr-x',
          owner: 'penguin',
          children: [
            {
              name: 'Documents',
              type: 'dir',
              children: [
                {
                  name: 'hello.txt',
                  type: 'file',
                  content: 'Привет, путешественник!\nДобро пожаловать в мир Linux.',
                },
                {
                  name: 'todo.txt',
                  type: 'file',
                  content:
                    '1. Освоить терминал\n2. Покорить файловую систему\n3. Стать линукс-магом',
                },
              ],
            },
            {
              name: 'Pictures',
              type: 'dir',
              children: [{ name: 'tux.png', type: 'file', content: '<binary image data>' }],
            },
            {
              name: 'run.sh',
              type: 'file',
              content: '#!/bin/bash\necho "Hello Linux way!"',
              permissions: '-rw-r--r--',
            },
            {
              name: 'config.txt',
              type: 'file',
              content: 'APP_NAME=LinuxOdyssey\nDEBUG=false',
              permissions: '-rw-rw-r--',
            },
            {
              name: 'projects',
              type: 'dir',
              children: [
                {
                  name: 'linux-odyssey',
                  type: 'dir',
                  children: [
                    {
                      name: 'README.md',
                      type: 'file',
                      content: '# Linux Odyssey\n\nИнтерактивный гид по Linux.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'message.txt',
              type: 'file',
              content: 'Hello Linux\nWelcome to the Linux Odyssey.',
            },
            { name: '.bashrc', type: 'file', content: '# Настройки bash\nalias ll="ls -la"' },
          ],
        },
      ],
    },
    {
      name: 'etc',
      type: 'dir',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      children: [
        { name: 'hostname', type: 'file', content: 'linux-odyssey' },
        { name: 'passwd', type: 'file', content: 'penguin:x:1000:1000::/home/penguin:/bin/bash' },
      ],
    },
    {
      name: 'usr',
      type: 'dir',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      children: [
        {
          name: 'bin',
          type: 'dir',
          children: [
            { name: 'cat', type: 'exec' },
            { name: 'ls', type: 'exec' },
            { name: 'pwd', type: 'exec' },
          ],
        },
      ],
    },
    {
      name: 'var',
      type: 'dir',
      children: [
        {
          name: 'log',
          type: 'dir',
          children: [{ name: 'syslog', type: 'file', content: 'System log entries...' }],
        },
      ],
    },
  ],
};

export function resolvePath(cwd: string, path: string): string {
  if (path.startsWith('/')) return normalizePath(path);
  return normalizePath(`${cwd}/${path}`);
}

export function normalizePath(path: string): string {
  const parts = path.split('/').filter(p => p.length > 0);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '..') stack.pop();
    else if (part !== '.') stack.push(part);
  }
  return '/' + stack.join('/');
}

export function getNode(fs: FileNode, path: string): FileNode | null {
  const parts = normalizePath(path).split('/').filter(Boolean);
  let current: FileNode = fs;
  for (const part of parts) {
    if (!current.children) return null;
    const next = current.children.find(c => c.name === part);
    if (!next) return null;
    current = next;
  }
  return current;
}

export function getParent(fs: FileNode, path: string): FileNode | null {
  const normalized = normalizePath(path);
  if (normalized === '/') return null;
  const parentPath = normalized.substring(0, normalized.lastIndexOf('/')) || '/';
  return getNode(fs, parentPath);
}

function colorFileName(name: string, type: FileType): string {
  if (type === 'dir') return color(name, 'blue');
  if (type === 'exec') return color(name, 'green');
  return name;
}

function colorPermissions(perms: string): string {
  if (perms.length < 10) return perms;
  const type = perms[0];
  const typeColored = type === 'd' ? color('d', 'blue') : type === 'l' ? color('l', 'cyan') : type;
  const bits = perms.slice(1);
  const colored = bits
    .split('')
    .map((bit, i) => {
      if (bit === '-') return color('-', 'gray');
      const bitType = i % 3;
      if (bitType === 0) return color(bit, 'green');
      if (bitType === 1) return color(bit, 'yellow');
      return color(bit, 'red');
    })
    .join('');
  return typeColored + colored;
}

export function formatLs(node: FileNode, long = false): string {
  if (!node.children) return '';
  if (long) {
    return node.children
      .map(child => {
        const perms =
          child.permissions ||
          (child.type === 'dir'
            ? 'drwxr-xr-x'
            : child.type === 'exec'
              ? '-rwxr-xr-x'
              : '-rw-r--r--');
        const owner = child.owner || 'penguin';
        const size = child.type === 'file' ? child.content?.length || 0 : 0;
        return `${colorPermissions(perms)} ${owner} ${String(size).padStart(5)} ${colorFileName(child.name, child.type)}`;
      })
      .join('\n');
  }
  return node.children.map(c => colorFileName(c.name, c.type)).join('  ');
}

export function formatTree(node: FileNode, prefix = ''): string {
  let result = '';
  if (node.children) {
    const dirs = node.children.filter(c => c.type === 'dir');
    const files = node.children.filter(c => c.type !== 'dir');
    const sorted = [...dirs, ...files];
    sorted.forEach((child, index) => {
      const isLast = index === sorted.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      result += `${prefix}${connector}${colorFileName(child.name, child.type)}\n`;
      if (child.children) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        result += formatTree(child, newPrefix);
      }
    });
  }
  return result;
}

export function cloneFs(node: FileNode): FileNode {
  return {
    ...node,
    children: node.children ? node.children.map(cloneFs) : undefined,
  };
}

export function createNode(
  parent: FileNode,
  name: string,
  type: FileType,
  content?: string
): boolean {
  if (!parent.children) parent.children = [];
  if (parent.children.find(c => c.name === name)) return false;
  parent.children.push({ name, type, content, children: type === 'dir' ? [] : undefined });
  return true;
}

export function cloneNode(node: FileNode): FileNode {
  return {
    ...node,
    children: node.children ? node.children.map(cloneNode) : undefined,
  };
}

export function removeNode(parent: FileNode, name: string): boolean {
  if (!parent.children) return false;
  const index = parent.children.findIndex(c => c.name === name);
  if (index === -1) return false;
  parent.children.splice(index, 1);
  return true;
}

function permissionToString(bits: { r: boolean; w: boolean; x: boolean }): string {
  return (bits.r ? 'r' : '-') + (bits.w ? 'w' : '-') + (bits.x ? 'x' : '-');
}

function parsePermissionString(perm: string): { r: boolean; w: boolean; x: boolean } {
  return {
    r: perm[0] === 'r',
    w: perm[1] === 'w',
    x: perm[2] === 'x',
  };
}

export function applyChmod(node: FileNode, mode: string): boolean {
  if (!node.permissions || node.permissions.length < 9) {
    const typeChar = node.type === 'dir' ? 'd' : '-';
    node.permissions = typeChar + 'rw-rw-r--';
  }

  const typeChar = node.permissions[0];
  const current = node.permissions.slice(1);
  const owner = parsePermissionString(current.slice(0, 3));
  const group = parsePermissionString(current.slice(3, 6));
  const others = parsePermissionString(current.slice(6, 9));

  if (/^[0-7]{3,4}$/.test(mode)) {
    const digits = mode.length === 4 ? mode.slice(1) : mode;
    const toBits = (n: number) => ({
      r: (n & 4) !== 0,
      w: (n & 2) !== 0,
      x: (n & 1) !== 0,
    });
    node.permissions =
      typeChar +
      permissionToString(toBits(parseInt(digits[0], 10))) +
      permissionToString(toBits(parseInt(digits[1], 10))) +
      permissionToString(toBits(parseInt(digits[2], 10)));
    return true;
  }

  const match = mode.match(/^([ugoa]*)([+-=])([rwx]+)$/);
  if (!match) return false;
  const [, targets, op, perms] = match;
  const allTargets = targets.length === 0 ? ['u', 'g', 'o'] : targets.split('');
  const affectsAll = allTargets.includes('a');

  const apply = (bits: { r: boolean; w: boolean; x: boolean }) => {
    for (const p of perms) {
      if (op === '+' || op === '=') bits[p as 'r' | 'w' | 'x'] = true;
      if (op === '-') bits[p as 'r' | 'w' | 'x'] = false;
    }
    if (op === '=') {
      for (const p of ['r', 'w', 'x'] as const) {
        if (!perms.includes(p)) bits[p] = false;
      }
    }
  };

  const targetsList = affectsAll ? ['u', 'g', 'o'] : allTargets;
  for (const t of targetsList) {
    if (t === 'u') apply(owner);
    if (t === 'g') apply(group);
    if (t === 'o') apply(others);
  }

  node.permissions =
    typeChar + permissionToString(owner) + permissionToString(group) + permissionToString(others);
  return true;
}

export function canAccess(node: FileNode, user: string, permission: 'r' | 'w' | 'x'): boolean {
  if (!node.permissions || node.permissions.length < 10) return true;
  if (user === 'root') return true;

  const isOwner = node.owner === user;
  const bits = node.permissions.slice(1);
  let section: string;
  if (isOwner) {
    section = bits.slice(0, 3);
  } else {
    section = bits.slice(6, 9);
  }

  const index = permission === 'r' ? 0 : permission === 'w' ? 1 : 2;
  return section[index] === permission;
}
