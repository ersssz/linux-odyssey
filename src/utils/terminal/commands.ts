import type { FileNode } from '../fileSystem';
import {
  applyChmod,
  canAccess,
  cloneFs,
  cloneNode,
  createNode,
  formatLs,
  formatTree,
  getNode,
  getParent,
  normalizePath,
  removeNode,
  resolvePath,
} from '../fileSystem';
import { color } from '../ansi';
import type { CommandHandler, CommandResult, TerminalContext } from './types';

function resolveAndGet(ctx: TerminalContext, path: string): FileNode | null {
  const target = resolvePath(ctx.cwd, path);
  return getNode(ctx.fs, target);
}

function readFileContent(ctx: TerminalContext, path: string): string | null {
  const node = resolveAndGet(ctx, path);
  if (!node) return null;
  if (node.type === 'dir') return null;
  return node.content || '';
}

function removeFileOrDir(ctx: TerminalContext, path: string, recursive = false): CommandResult {
  const target = resolvePath(ctx.cwd, path);
  const parent = getParent(ctx.fs, target);
  const node = getNode(ctx.fs, target);
  if (!node) return { error: `rm: cannot remove '${path}': No such file or directory` };
  if (node.type === 'dir' && !recursive) {
    return { error: `rm: cannot remove '${path}': Is a directory` };
  }
  if (!parent) return { error: `rm: cannot remove '${path}': Permission denied` };
  if (!canAccess(parent, ctx.user, 'w'))
    return { error: `rm: cannot remove '${path}': Permission denied` };
  const newFs = cloneFs(ctx.fs);
  const newParent = getParent(newFs, target);
  if (!newParent) return { error: `rm: cannot remove '${path}': Permission denied` };
  const name = target.substring(target.lastIndexOf('/') + 1) || path;
  removeNode(newParent, name);
  return { newFs };
}

const commands: Record<string, CommandHandler> = {
  cd: (args, ctx) => {
    const target = args[0] ? resolvePath(ctx.cwd, args[0]) : ctx.env.HOME || '/home/penguin';
    const node = getNode(ctx.fs, target);
    if (!node) return { error: `cd: no such file or directory: ${args[0] || target}` };
    if (node.type !== 'dir') return { error: `cd: not a directory: ${args[0]}` };
    if (!canAccess(node, ctx.user, 'x'))
      return { error: `cd: permission denied: ${args[0] || target}` };
    return { newCwd: normalizePath(target) };
  },

  pwd: (_args, ctx) => ({ output: ctx.cwd }),

  ls: (args, ctx) => {
    const nonFlagArgs = args.filter(a => !a.startsWith('-'));
    const target = nonFlagArgs[0] ? resolvePath(ctx.cwd, nonFlagArgs[0]) : ctx.cwd;
    const node = getNode(ctx.fs, target);
    if (!node) return { error: `ls: cannot access '${nonFlagArgs[0]}': No such file or directory` };
    if (node.type !== 'dir') return { output: node.name };
    if (!canAccess(node, ctx.user, 'r'))
      return {
        error: `ls: cannot open directory '${nonFlagArgs[0] || target}': Permission denied`,
      };

    const flagLetters = args
      .filter(a => a.startsWith('-'))
      .join('')
      .replace(/-/g, '');
    const long = flagLetters.includes('l');
    const showAll = flagLetters.includes('a');
    let children = node.children || [];
    if (!showAll) {
      children = children.filter(c => !c.name.startsWith('.'));
    }
    const displayNode = { ...node, children };
    return { output: formatLs(displayNode, long) };
  },

  tree: (args, ctx) => {
    const target = args[0] ? resolvePath(ctx.cwd, args[0]) : ctx.cwd;
    const node = getNode(ctx.fs, target);
    if (!node) return { error: `tree: '${args[0]}': No such file or directory` };
    if (node.type !== 'dir') return { error: `tree: '${args[0]}': Not a directory` };
    if (!canAccess(node, ctx.user, 'r'))
      return { error: `tree: '${args[0] || target}': Permission denied` };
    return { output: `${node.name === '/' ? '/' : node.name}\n${formatTree(node, '')}` };
  },

  cat: (args, ctx) => {
    if (args.length === 0) return { error: 'cat: missing file operand' };
    let output = '';
    for (const arg of args) {
      const target = resolvePath(ctx.cwd, arg);
      const node = getNode(ctx.fs, target);
      if (!node) output += `cat: ${arg}: No such file or directory\n`;
      else if (node.type === 'dir') output += `cat: ${arg}: Is a directory\n`;
      else if (!canAccess(node, ctx.user, 'r')) output += `cat: ${arg}: Permission denied\n`;
      else output += (node.content || '') + '\n';
    }
    return { output: output.trimEnd() };
  },

  head: (args, ctx) => {
    let lines = 10;
    let fileArg = args[0];
    if (args[0] === '-n' && args[1]) {
      lines = parseInt(args[1], 10) || 10;
      fileArg = args[2];
    }
    if (!fileArg) return { error: 'head: missing file operand' };
    const content = readFileContent(ctx, fileArg);
    if (content === null)
      return { error: `head: cannot open '${fileArg}': No such file or directory` };
    return { output: content.split('\n').slice(0, lines).join('\n') };
  },

  tail: (args, ctx) => {
    let lines = 10;
    let fileArg = args[0];
    if (args[0] === '-n' && args[1]) {
      lines = parseInt(args[1], 10) || 10;
      fileArg = args[2];
    }
    if (!fileArg) return { error: 'tail: missing file operand' };
    const content = readFileContent(ctx, fileArg);
    if (content === null)
      return { error: `tail: cannot open '${fileArg}': No such file or directory` };
    return { output: content.split('\n').slice(-lines).join('\n') };
  },

  wc: (args, ctx) => {
    if (args.length === 0) return { error: 'wc: missing file operand' };
    const results: string[] = [];
    let totalLines = 0;
    let totalWords = 0;
    let totalBytes = 0;
    for (const arg of args) {
      const content = readFileContent(ctx, arg);
      if (content === null) {
        results.push(`wc: ${arg}: No such file or directory`);
        continue;
      }
      const lines = content.split('\n').length;
      const words = content.split(/\s+/).filter(Boolean).length;
      const bytes = content.length;
      totalLines += lines;
      totalWords += words;
      totalBytes += bytes;
      results.push(
        `${lines.toString().padStart(4)} ${words.toString().padStart(4)} ${bytes.toString().padStart(4)} ${arg}`
      );
    }
    if (args.length > 1) {
      results.push(
        `${totalLines.toString().padStart(4)} ${totalWords.toString().padStart(4)} ${totalBytes.toString().padStart(4)} total`
      );
    }
    return { output: results.join('\n') };
  },

  touch: (args, ctx) => {
    if (args.length === 0) return { error: 'touch: missing file operand' };
    let newFs = ctx.fs;
    for (const arg of args) {
      const target = resolvePath(ctx.cwd, arg);
      const parent = getParent(newFs, target);
      if (!parent) return { error: `touch: cannot touch '${arg}': Permission denied` };
      if (!canAccess(parent, ctx.user, 'w'))
        return { error: `touch: cannot touch '${arg}': Permission denied` };
      const existing = getNode(newFs, target);
      if (existing && !canAccess(existing, ctx.user, 'w'))
        return { error: `touch: cannot touch '${arg}': Permission denied` };
      if (!existing) {
        newFs = cloneFs(newFs);
        const newParent = getParent(newFs, target);
        if (newParent) {
          const name = target.substring(target.lastIndexOf('/') + 1) || arg;
          createNode(newParent, name, 'file', '');
        }
      }
    }
    return { newFs };
  },

  mkdir: (args, ctx) => {
    if (args.length === 0) return { error: 'mkdir: missing operand' };
    let newFs = ctx.fs;
    for (const arg of args) {
      const target = resolvePath(ctx.cwd, arg);
      const parent = getParent(newFs, target);
      const node = getNode(newFs, target);
      if (!parent) return { error: `mkdir: cannot create directory '${arg}': Permission denied` };
      if (!canAccess(parent, ctx.user, 'w'))
        return { error: `mkdir: cannot create directory '${arg}': Permission denied` };
      if (node) return { error: `mkdir: cannot create directory '${arg}': File exists` };
      newFs = cloneFs(newFs);
      const newParent = getParent(newFs, target);
      if (newParent) {
        const name = target.substring(target.lastIndexOf('/') + 1) || arg;
        createNode(newParent, name, 'dir');
      }
    }
    return { newFs };
  },

  rm: (args, ctx) => {
    if (args.length === 0) return { error: 'rm: missing operand' };
    const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
    const realArgs = args.filter(a => a !== '-r' && a !== '-rf' && a !== '-fr');
    let newFs = ctx.fs;
    for (const arg of realArgs) {
      const result = removeFileOrDir({ ...ctx, fs: newFs }, arg, recursive);
      if (result.error) return result;
      if (result.newFs) newFs = result.newFs;
    }
    return { newFs };
  },

  cp: (args, ctx) => {
    if (args.length < 2) return { error: 'cp: missing file operand' };
    const src = args[0];
    const dst = args[1];
    const srcNode = resolveAndGet(ctx, src);
    if (!srcNode) return { error: `cp: cannot stat '${src}': No such file or directory` };
    if (!canAccess(srcNode, ctx.user, 'r'))
      return { error: `cp: cannot open '${src}': Permission denied` };
    const dstPath = resolvePath(ctx.cwd, dst);
    const parent = getParent(ctx.fs, dstPath);
    if (!parent) return { error: `cp: cannot create regular file '${dst}': Permission denied` };
    if (!canAccess(parent, ctx.user, 'w'))
      return { error: `cp: cannot create regular file '${dst}': Permission denied` };
    const newFs = cloneFs(ctx.fs);
    const newParent = getParent(newFs, dstPath);
    if (!newParent) return { error: `cp: cannot create regular file '${dst}': Permission denied` };
    const name = dstPath.substring(dstPath.lastIndexOf('/') + 1) || dst;
    const copy = cloneNode(srcNode);
    copy.name = name;
    if (!newParent.children) newParent.children = [];
    if (newParent.children.find(c => c.name === name)) {
      return { error: `cp: cannot overwrite directory '${dst}'` };
    }
    newParent.children.push(copy);
    return { newFs };
  },

  mv: (args, ctx) => {
    if (args.length < 2) return { error: 'mv: missing file operand' };
    const src = args[0];
    const dst = args[1];
    const srcPath = resolvePath(ctx.cwd, src);
    const srcNode = getNode(ctx.fs, srcPath);
    if (!srcNode) return { error: `mv: cannot stat '${src}': No such file or directory` };
    const srcParent = getParent(ctx.fs, srcPath);
    if (!srcParent) return { error: `mv: cannot move '${src}': Permission denied` };
    if (!canAccess(srcParent, ctx.user, 'w'))
      return { error: `mv: cannot move '${src}': Permission denied` };
    const dstPath = resolvePath(ctx.cwd, dst);
    const dstParent = getParent(ctx.fs, dstPath);
    if (!dstParent) return { error: `mv: cannot move to '${dst}': Permission denied` };
    if (!canAccess(dstParent, ctx.user, 'w'))
      return { error: `mv: cannot move to '${dst}': Permission denied` };
    const newFs = cloneFs(ctx.fs);
    const newSrcParent = getParent(newFs, srcPath);
    const newDstParent = getParent(newFs, dstPath);
    if (!newSrcParent || !newDstParent) return { error: `mv: internal error` };
    const srcName = srcPath.substring(srcPath.lastIndexOf('/') + 1) || src;
    const dstName = dstPath.substring(dstPath.lastIndexOf('/') + 1) || dst;
    removeNode(newSrcParent, srcName);
    const copy = cloneNode(srcNode);
    copy.name = dstName;
    if (!newDstParent.children) newDstParent.children = [];
    const existingIndex = newDstParent.children.findIndex(c => c.name === dstName);
    if (existingIndex !== -1) {
      newDstParent.children[existingIndex] = copy;
    } else {
      newDstParent.children.push(copy);
    }
    return { newFs };
  },

  ln: (args, ctx) => {
    if (args.length < 2) return { error: 'ln: missing file operand' };
    const target = args[0];
    const linkName = args[1];
    const targetNode = resolveAndGet(ctx, target);
    if (!targetNode)
      return { error: `ln: failed to access '${target}': No such file or directory` };
    const linkPath = resolvePath(ctx.cwd, linkName);
    const parent = getParent(ctx.fs, linkPath);
    if (!parent)
      return { error: `ln: failed to create symbolic link '${linkName}': Permission denied` };
    const newFs = cloneFs(ctx.fs);
    const newParent = getParent(newFs, linkPath);
    if (!newParent)
      return { error: `ln: failed to create symbolic link '${linkName}': Permission denied` };
    const name = linkPath.substring(linkPath.lastIndexOf('/') + 1) || linkName;
    createNode(newParent, name, 'file', targetNode.content);
    return { newFs, output: `${linkName} -> ${target}` };
  },

  find: (args, ctx) => {
    const startPath = args[0] ? resolvePath(ctx.cwd, args[0]) : ctx.cwd;
    const startNode = getNode(ctx.fs, startPath);
    if (!startNode) return { error: `find: '${args[0]}': No such file or directory` };
    const results: string[] = [];
    const walk = (node: FileNode, path: string) => {
      if (node.name !== '/') results.push(path);
      if (node.children) {
        for (const child of node.children) {
          walk(child, `${path}/${child.name}`);
        }
      }
    };
    walk(startNode, startNode.name === '/' ? '' : startNode.name);
    return { output: results.join('\n') || '.' };
  },

  grep: (args, ctx) => {
    if (args.length < 2) return { error: 'grep: usage: grep [options] pattern file' };
    let caseInsensitive = false;
    let showLineNumbers = false;
    let realArgs = args;
    while (realArgs.length > 0 && realArgs[0].startsWith('-')) {
      const flag = realArgs[0];
      if (flag === '-i') caseInsensitive = true;
      else if (flag === '-n') showLineNumbers = true;
      else if (flag === '-in' || flag === '-ni') {
        caseInsensitive = true;
        showLineNumbers = true;
      } else {
        break;
      }
      realArgs = realArgs.slice(1);
    }
    if (realArgs.length < 2) return { error: 'grep: usage: grep [options] pattern file' };
    const pattern = realArgs[0];
    const files = realArgs.slice(1);
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, caseInsensitive ? 'i' : '');
    } catch {
      return { error: `grep: invalid pattern: ${pattern}` };
    }
    const results: string[] = [];
    for (const file of files) {
      const content = readFileContent(ctx, file);
      if (content === null) {
        results.push(`grep: ${file}: No such file or directory`);
        continue;
      }
      content.split('\n').forEach((line, index) => {
        if (regex.test(line)) {
          const prefix = showLineNumbers ? `${(index + 1).toString().padStart(3)}:` : '';
          const highlightRegex = new RegExp(pattern, caseInsensitive ? 'gi' : 'g');
          const highlighted = line.replace(highlightRegex, match => color(match, 'red'));
          results.push(`${file}:${prefix}${highlighted}`);
        }
      });
    }
    return { output: results.join('\n') };
  },

  which: args => {
    const commands = [
      'pwd',
      'ls',
      'cd',
      'cat',
      'tree',
      'mkdir',
      'touch',
      'rm',
      'cp',
      'mv',
      'ln',
      'grep',
      'find',
      'chmod',
      'echo',
      'ps',
      'clear',
      'whoami',
      'history',
      'date',
      'uname',
      'lsb_release',
      'sudo',
      'uptime',
      'lsmod',
      'ip',
      'ping',
      'nslookup',
      'nano',
      'vim',
      'head',
      'tail',
      'wc',
      'sort',
      'uniq',
      'diff',
      'tar',
      'gzip',
      'env',
      'export',
      'alias',
      'man',
      'apt',
    ];
    const results = args.map(arg => {
      if (commands.includes(arg)) return `/usr/bin/${arg}`;
      return `which: no ${arg} in (/usr/local/bin:/usr/bin:/bin)`;
    });
    return { output: results.join('\n') };
  },

  whereis: args => {
    const results = args.map(arg => `${arg}: /usr/bin/${arg} /usr/share/man/man1/${arg}.1.gz`);
    return { output: results.join('\n') };
  },

  sort: (args, ctx) => {
    if (args.length === 0) return { error: 'sort: missing file operand' };
    const file = args[0];
    const content = readFileContent(ctx, file);
    if (content === null) return { error: `sort: cannot read: ${file}: No such file or directory` };
    return { output: content.split('\n').sort().join('\n') };
  },

  uniq: (args, ctx) => {
    if (args.length === 0) return { error: 'uniq: missing file operand' };
    const file = args[0];
    const content = readFileContent(ctx, file);
    if (content === null) return { error: `uniq: cannot read: ${file}: No such file or directory` };
    const lines = content.split('\n');
    return { output: lines.filter((line, i) => i === 0 || line !== lines[i - 1]).join('\n') };
  },

  diff: (args, ctx) => {
    if (args.length < 2) return { error: 'diff: missing operand' };
    const a = readFileContent(ctx, args[0]);
    const b = readFileContent(ctx, args[1]);
    if (a === null) return { error: `diff: ${args[0]}: No such file or directory` };
    if (b === null) return { error: `diff: ${args[1]}: No such file or directory` };
    const aLines = a.split('\n');
    const bLines = b.split('\n');
    const results: string[] = [];
    const max = Math.max(aLines.length, bLines.length);
    for (let i = 0; i < max; i++) {
      if (aLines[i] !== bLines[i]) {
        results.push(`< ${aLines[i] || ''}`);
        results.push(`> ${bLines[i] || ''}`);
      }
    }
    return { output: results.join('\n') };
  },

  cut: (args, ctx) => {
    if (args.length < 2 || args[0] !== '-d' || args[2] !== '-f') {
      return { output: 'cut: usage: cut -d DELIMITER -f FIELD file' };
    }
    const delimiter = args[1];
    const field = parseInt(args[3], 10) - 1;
    const file = args[4];
    const content = readFileContent(ctx, file);
    if (content === null) return { error: `cut: ${file}: No such file or directory` };
    return {
      output: content
        .split('\n')
        .map(line => line.split(delimiter)[field] || '')
        .join('\n'),
    };
  },

  tr: args => {
    if (args.length < 2) return { error: 'tr: missing operand' };
    return { output: 'tr: usage: tr SET1 SET2 < file (try: echo "hello" | tr a-z A-Z)' };
  },

  rev: (args, ctx) => {
    if (args.length === 0) return { error: 'rev: missing file operand' };
    const content = readFileContent(ctx, args[0]);
    if (content === null)
      return { error: `rev: cannot open ${args[0]}: No such file or directory` };
    return {
      output: content
        .split('\n')
        .map(line => line.split('').reverse().join(''))
        .join('\n'),
    };
  },

  nl: (args, ctx) => {
    if (args.length === 0) return { error: 'nl: missing file operand' };
    const content = readFileContent(ctx, args[0]);
    if (content === null) return { error: `nl: cannot open ${args[0]}: No such file or directory` };
    return {
      output: content
        .split('\n')
        .map((line, i) => `${(i + 1).toString().padStart(6)}  ${line}`)
        .join('\n'),
    };
  },

  sed: (args, ctx) => {
    if (args.length < 2) return { error: 'sed: usage: sed s/old/new/ file' };
    const expr = args[0];
    const file = args[args.length - 1];
    const content = readFileContent(ctx, file);
    if (content === null) return { error: `sed: can't read ${file}: No such file or directory` };
    const match = expr.match(/^s\/(.+)\/(.+)\/(g?)$/);
    if (!match) return { output: content };
    const [, old, replacement, flags] = match;
    const global = flags === 'g';
    return {
      output: content
        .split('\n')
        .map(line => (global ? line.replaceAll(old, replacement) : line.replace(old, replacement)))
        .join('\n'),
    };
  },

  awk: (args, ctx) => {
    if (args.length < 2) return { error: "awk: usage: awk '{print $1}' file" };
    const expr = args[0];
    const file = args[1];
    const content = readFileContent(ctx, file);
    if (content === null) return { error: `awk: cannot open ${file}: No such file or directory` };
    if (expr.includes('{print $1}')) {
      return {
        output: content
          .split('\n')
          .map(line => line.split(/\s+/)[0] || '')
          .join('\n'),
      };
    }
    if (expr.includes('{print $2}')) {
      return {
        output: content
          .split('\n')
          .map(line => line.split(/\s+/)[1] || '')
          .join('\n'),
      };
    }
    return { output: content };
  },

  paste: () => ({ output: 'paste: usage: paste file1 file2' }),

  chmod: (args, ctx) => {
    if (args.length < 2) return { error: 'chmod: missing operand' };
    const mode = args[0];
    let newFs = ctx.fs;
    for (const arg of args.slice(1)) {
      if (arg === mode) continue;
      const target = resolvePath(ctx.cwd, arg);
      const node = getNode(newFs, target);
      if (!node) return { error: `chmod: cannot access '${arg}': No such file or directory` };
      if (node.owner && node.owner !== ctx.user && ctx.user !== 'root') {
        return { error: `chmod: changing permissions of '${arg}': Operation not permitted` };
      }
      newFs = cloneFs(newFs);
      const newNode = getNode(newFs, target);
      if (newNode) {
        const success = applyChmod(newNode, mode);
        if (!success) return { error: `chmod: invalid mode: '${mode}'` };
      }
    }
    return { newFs, output: `chmod ${mode} ${args.slice(1).join(' ')}` };
  },

  chown: args => {
    if (args.length < 2) return { error: 'chown: missing operand' };
    return { output: `chown ${args.join(' ')} (simulated)` };
  },

  chgrp: args => {
    if (args.length < 2) return { error: 'chgrp: missing operand' };
    return { output: `chgrp ${args.join(' ')} (simulated)` };
  },

  umask: args => {
    if (args.length === 0) return { output: '0022' };
    return { output: `umask ${args[0]} (simulated)` };
  },

  uname: args => {
    if (args.includes('-a'))
      return { output: 'Linux linux-odyssey 6.8.0-generic #1 SMP x86_64 GNU/Linux' };
    return { output: 'Linux' };
  },

  lsb_release: args => {
    if (args.includes('-a') || args.includes('-d')) {
      return {
        output:
          'Distributor ID:\tUbuntu\nDescription:\tUbuntu 24.04 LTS\nRelease:\t24.04\nCodename:\tnoble',
      };
    }
    return { output: 'No LSB modules are available.' };
  },

  hostname: () => ({ output: 'linux-odyssey' }),

  uptime: () => ({ output: '14:00:00 up 3 days, 2:15, 1 user,  load average: 0.52, 0.58, 0.59' }),

  date: () => ({ output: new Date().toString() }),

  cal: args => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    if (args.length >= 1) {
      const parsedMonth = parseInt(args[0], 10);
      if (!Number.isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        month = parsedMonth - 1;
      }
    }
    if (args.length >= 2) {
      const parsedYear = parseInt(args[1], 10);
      if (!Number.isNaN(parsedYear) && parsedYear > 0) {
        year = parsedYear;
      }
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' });

    const header = `      ${monthName} ${year}`;
    const weekdayHeader = 'Su Mo Tu We Th Fr Sa';

    let grid = '';
    let currentDay = 1;
    let row = '';
    for (let i = 0; i < firstDay; i++) {
      row += '   ';
    }
    for (let i = firstDay; i < 7; i++) {
      row += currentDay.toString().padStart(2, ' ') + ' ';
      currentDay++;
    }
    grid += row.trimEnd() + '\n';

    while (currentDay <= daysInMonth) {
      row = '';
      for (let i = 0; i < 7 && currentDay <= daysInMonth; i++) {
        row += currentDay.toString().padStart(2, ' ') + ' ';
        currentDay++;
      }
      grid += row.trimEnd() + '\n';
    }

    return {
      output: `${header}\n${weekdayHeader}\n${grid.trimEnd()}`,
    };
  },

  whoami: (_args, ctx) => ({ output: ctx.user }),

  id: args => {
    const user = args[0] || 'penguin';
    return { output: `uid=1000(${user}) gid=1000(${user}) groups=1000(${user}),27(sudo)` };
  },

  groups: () => ({ output: 'penguin : penguin sudo' }),

  users: () => ({ output: 'penguin' }),

  w: () => ({
    output:
      'USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU  WHAT\npenguin  pts/0    penguin.local    10:00    0.00s  0.05s  0.01s  bash',
  }),

  lsmod: () => ({
    output:
      'Module                  Size  Used by\noverlay               155648  0\next4                 1179648  1\nvfat                   20480  1\nnls_utf8               16384  1\nsnd_hda_intel          57344  0',
  }),

  ps: args => {
    if (args.includes('aux')) {
      return {
        output: `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  21532  7640 ?        Ss   10:00   0:01 /sbin/init\npenguin   1010  0.0  0.2  23152  8952 pts/0    Ss   10:01   0:00 bash\npenguin   1024  0.0  0.1  18940  4520 pts/0    R+   10:02   0:00 ps aux\npenguin   2042  0.1  0.5  45200 21000 ?        Sl   10:05   0:12 linux-odyssey`,
      };
    }
    return {
      output:
        '  PID TTY          TIME CMD\n 1010 pts/0    00:00:00 bash\n 1024 pts/0    00:00:00 ps\n 2042 pts/0    00:00:00 linux-odyssey',
    };
  },

  top: () => ({
    output: `top - 14:00:00 up 3 days, 2:15, 1 user, load average: 0.52, 0.58, 0.59\nTasks: 123 total,   1 running, 122 sleeping,   0 stopped,   0 zombie\n%Cpu(s):  2.3 us,  1.0 sy,  0.0 ni, 96.0 id,  0.5 wa,  0.0 hi,  0.2 si\nMiB Mem :   7932.0 total,   2156.0 free,   3421.0 used,   2355.0 buff/cache\nMiB Swap:   2048.0 total,   1980.0 free,     68.0 used.   4123.0 avail Mem\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND\n 2042 penguin   20   0   45200  21000   8900 S   1.0  0.3   0:12.34 linux-odyssey\n 1010 penguin   20   0   23152   8952   5600 S   0.0  0.1   0:00.12 bash\n    1 root      20   0   21532   7640   5600 S   0.0  0.1   0:01.05 init`,
  }),

  htop: () => ({
    output: `htop 1.0 - (C) 2004 Hisham Muhammad\nCPU[||||||||||||||||||||||||                                35.2%]\nMem[||||||||||||||||||||||||||||||||||||||                  42.1%]\nSwp[|||||||                                                    3.3%]\n\n  PID  USER  PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command\n 2042 penguin 20   0 45200 21000  8900 S  1.0  0.3  0:12.34 linux-odyssey\n 1010 penguin 20   0 23152  8952  5600 S  0.0  0.1  0:00.12 bash\n    1 root      20   0 21532  7640  5600 S  0.0  0.1  0:01.05 init`,
  }),

  kill: args => {
    if (args.length === 0) return { error: 'kill: usage: kill [-s SIGNAL] PID' };
    return { output: `Sent signal to ${args.join(', ')}` };
  },

  killall: args => {
    if (args.length === 0) return { error: 'killall: missing process name' };
    return { output: `Killed process(es) matching ${args[0]}` };
  },

  pkill: args => {
    if (args.length === 0) return { error: 'pkill: missing pattern' };
    return { output: `Sent signal to process(es) matching ${args[0]}` };
  },

  jobs: () => ({
    output: '[1]+  Running              make &\n[2]-  Stopped              nano file.txt',
  }),

  bg: () => ({ output: 'bg: job [1] continued in background' }),

  fg: () => ({ output: 'fg: job [1] brought to foreground' }),

  df: () => ({
    output: `Filesystem     1K-blocks     Used Available Use% Mounted on\n/dev/sda1      102400000 45000000  52400000  46% /\ntmpfs            2048000      500   2047500   1% /tmp`,
  }),

  du: args => {
    const target = args[0] || '.';
    return { output: `4096\t${target}` };
  },

  ip: args => {
    if (args[0] === 'addr' || args[0] === 'a') {
      return {
        output: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,UP,LOWER_UP> mtu 1500\n    inet 192.168.1.42/24 brd 192.168.1.255 scope global eth0`,
      };
    }
    if (args[0] === 'link')
      return { output: '1: lo: <LOOPBACK> mtu 65536\n2: eth0: <BROADCAST> mtu 1500' };
    if (args[0] === 'route')
      return { output: 'default via 192.168.1.1 dev eth0\n192.168.1.0/24 dev eth0' };
    return { error: `ip: ${args[0] || ''}: unknown option` };
  },

  ifconfig: () => ({
    output: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.42  netmask 255.255.255.0  broadcast 192.168.1.255\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0`,
  }),

  ping: args => {
    let count = 1;
    let target: string | null = null;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '-c') {
        const next = args[i + 1];
        if (next) {
          const parsed = parseInt(next, 10);
          if (!Number.isNaN(parsed) && parsed > 0) {
            count = parsed;
          }
        }
        i++;
      } else if (!arg.startsWith('-')) {
        target = arg;
      }
    }

    if (!target) {
      return { output: 'ping: usage error: Destination address required' };
    }

    if (target === 'localhost' || target === '127.0.0.1') {
      let output = `PING ${target} (127.0.0.1) 56(84) bytes of data.\n`;
      for (let i = 1; i <= count; i++) {
        output += `64 bytes from localhost (127.0.0.1): icmp_seq=${i} ttl=64 time=0.0${i} ms\n`;
      }
      output += `\n--- localhost ping statistics ---\n${count} packets transmitted, ${count} received, 0% packet loss, time 0ms`;
      return { output };
    }

    if (target === 'google.com') {
      let output = `PING google.com (142.250.80.46) 56(84) bytes of data.\n`;
      for (let i = 1; i <= count; i++) {
        output += `64 bytes from google.com: icmp_seq=${i} ttl=117 time=12.${i} ms\n`;
      }
      output += `\n--- google.com ping statistics ---\n${count} packets transmitted, ${count} received, 0% packet loss, time 12ms`;
      return { output };
    }

    return { output: 'ping: unknown host' };
  },

  nslookup: args => {
    const target = args[0] || 'google.com';
    return {
      output: `Server:\t\t8.8.8.8\nAddress:\t8.8.8.8#53\n\nNon-authoritative answer:\nName:\t${target}\nAddress: 142.250.80.46`,
    };
  },

  dig: args => {
    const target = args[0] || 'google.com';
    return {
      output: `; <<>> DiG 9.18 <<>> ${target}\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR\n;; ANSWER SECTION:\n${target}.\t\t300\tIN\tA\t142.250.80.46`,
    };
  },

  netstat: () => ({
    output: `Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\ntcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN`,
  }),

  ss: () => ({
    output: `Netid  State  Recv-Q  Send-Q  Local Address:Port   Peer Address:Port\ntcp    LISTEN 0       4096    0.0.0.0:22          0.0.0.0:*\ntcp    LISTEN 0       4096    127.0.0.1:3000      0.0.0.0:*`,
  }),

  curl: args => {
    const url = args[0] || 'https://example.com';
    return {
      output: `<!doctype html>\n<html>\n<body>\n  <h1>Mock response from ${url}</h1>\n  <p>This is a simulated response for learning purposes.</p>\n</body>\n</html>`,
    };
  },

  wget: args => {
    const url = args[0] || 'https://example.com/file.zip';
    return {
      output: `--${new Date().toISOString()}--  ${url}\nResolving ${url}... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 1024 (1.0K) [application/zip]\nSaving to: 'file.zip'\n\nfile.zip            100%[===================>]   1.00K  --.-KB/s    in 0s`,
    };
  },

  ssh: args => {
    const host = args[0] || 'server';
    return {
      output: `ssh: connect to host ${host} port 22: Connection simulated.\nWelcome to ${host}!`,
    };
  },

  scp: args => {
    if (args.length < 2) return { error: 'scp: missing file operand' };
    return { output: `Transferred ${args[0]} to ${args[1]} (simulated)` };
  },

  rsync: args => {
    if (args.length < 2) return { error: 'rsync: missing file operand' };
    return { output: `rsync: simulated sync of ${args[0]} to ${args[1]}` };
  },

  traceroute: args => {
    const host = args[0] || 'google.com';
    return {
      output: `traceroute to ${host} (142.250.80.46), 30 hops max\n 1  192.168.1.1  0.5 ms\n 2  10.0.0.1  1.2 ms\n 3  142.250.80.46  12.3 ms`,
    };
  },

  whois: args => {
    const domain = args[0] || 'example.com';
    return {
      output: `Domain Name: ${domain}\nRegistrar: Example Registrar, Inc.\nName Server: ns1.example.com\nUpdated Date: 2024-01-01T00:00:00Z`,
    };
  },

  tar: args => {
    if (args.includes('-cvf'))
      return { output: `tar: created archive ${args[args.indexOf('-cvf') + 1]} (simulated)` };
    if (args.includes('-xvf'))
      return { output: `tar: extracted archive ${args[args.indexOf('-xvf') + 1]} (simulated)` };
    if (args.includes('-tvf'))
      return { output: `tar: listing archive ${args[args.indexOf('-tvf') + 1]} (simulated)` };
    return { output: 'tar: usage: tar -cvf archive.tar files' };
  },

  gzip: args => {
    if (args.length === 0) return { error: 'gzip: missing file operand' };
    return { output: `gzip: compressed ${args[0]} -> ${args[0]}.gz (simulated)` };
  },

  gunzip: args => {
    if (args.length === 0) return { error: 'gunzip: missing file operand' };
    return { output: `gunzip: decompressed ${args[0]} (simulated)` };
  },

  zip: args => {
    if (args.length < 2) return { error: 'zip: missing operand' };
    return { output: `zip: added ${args.slice(1).join(', ')} to ${args[0]} (simulated)` };
  },

  unzip: args => {
    if (args.length === 0) return { error: 'unzip: missing file operand' };
    return { output: `unzip: extracted ${args[0]} (simulated)` };
  },

  echo: args => ({ output: args.join(' ') }),

  printf: args => ({ output: args.join(' ') }),

  env: (args, ctx) => {
    if (args.length === 0) {
      return {
        output: Object.entries(ctx.env)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n'),
      };
    }
    const key = args[0];
    return { output: `${key}=${ctx.env[key] || ''}` };
  },

  export: (args, ctx) => {
    if (args.length === 0)
      return {
        output: Object.entries(ctx.env)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n'),
      };
    const expr = args[0];
    const eq = expr.indexOf('=');
    if (eq === -1) return { output: `export ${expr}=${ctx.env[expr] || ''}` };
    const key = expr.slice(0, eq);
    const value = expr.slice(eq + 1);
    return { newEnv: { ...ctx.env, [key]: value }, output: '' };
  },

  alias: (args, ctx) => {
    if (args.length === 0) {
      return {
        output: Object.entries(ctx.aliases)
          .map(([k, v]) => `alias ${k}='${v}'`)
          .join('\n'),
      };
    }
    const expr = args[0];
    const eq = expr.indexOf('=');
    if (eq === -1) return { output: `alias ${expr}='${ctx.aliases[expr] || ''}'` };
    const key = expr.slice(0, eq);
    const value = expr.slice(eq + 1).replace(/^['"]|['"]$/g, '');
    return { newAliases: { ...ctx.aliases, [key]: value }, output: '' };
  },

  unalias: (args, ctx) => {
    if (args.length === 0) return { error: 'unalias: missing name' };
    const newAliases = { ...ctx.aliases };
    delete newAliases[args[0]];
    return { newAliases, output: '' };
  },

  history: (_args, ctx) => ({
    output: ctx.commandHistory.map((h, i) => `${i + 1}  ${h}`).join('\n'),
  }),

  clear: () => ({ output: '__CLEAR__' }),

  exit: () => ({ output: 'exit\nlogout' }),

  source: (args, ctx) => {
    if (args.length === 0) return { error: 'source: missing file operand' };
    const content = readFileContent(ctx, args[0]);
    if (content === null) return { error: `source: ${args[0]}: No such file or directory` };
    const newAliases = { ...ctx.aliases };
    const newEnv = { ...ctx.env };
    content.split('\n').forEach(line => {
      const aliasMatch = line.match(/^alias\s+([^=]+)=(.+)$/);
      if (aliasMatch) {
        newAliases[aliasMatch[1]] = aliasMatch[2].replace(/^['"]|['"]$/g, '');
      }
      const exportMatch = line.match(/^export\s+([^=]+)=(.+)$/);
      if (exportMatch) {
        newEnv[exportMatch[1]] = exportMatch[2].replace(/^['"]|['"]$/g, '');
      }
    });
    return { newAliases, newEnv, output: '' };
  },

  man: args => {
    if (args.length === 0) return { output: 'man: usage: man COMMAND' };
    return {
      output: `MANUAL PAGE: ${args[0]}\n\nNAME\n  ${args[0]} - Linux command\n\nDESCRIPTION\n  ${args[0]} is a standard Linux command. Try running it with --help.\n\nSEE ALSO\n  bash(1), linux(1)`,
    };
  },

  info: args => {
    if (args.length === 0) return { output: 'info: usage: info COMMAND' };
    return {
      output: `Info documentation for ${args[0]}\n\nThis is a simulated info page for learning purposes.`,
    };
  },

  whatis: args => {
    if (args.length === 0) return { output: 'whatis: usage: whatis COMMAND' };
    return { output: args.map(a => `${a} (1)  - Linux command`).join('\n') };
  },

  apropos: args => {
    if (args.length === 0) return { output: 'apropos: usage: apropos KEYWORD' };
    return { output: `apropos ${args[0]}: ls (1), find (1), grep (1) - related commands` };
  },

  help: () => ({
    output: `Available commands:
Navigation: cd, pwd
Listing: ls, tree
Files: cat, head, tail, wc, touch, mkdir, rm, cp, mv, ln
Search: find, grep, which, whereis
Text: sort, uniq, diff, cut, sed, awk, rev, nl, tr, paste
Permissions: chmod, chown, chgrp, umask
System: uname, lsb_release, hostname, uptime, date, cal, whoami, id, groups, users, w, lsmod
Processes: ps, top, htop, kill, killall, pkill, jobs, bg, fg
Disk: df, du
Network: ip, ifconfig, ping, nslookup, dig, netstat, ss, curl, wget, ssh, scp, rsync, traceroute, whois
Compression: tar, gzip, gunzip, zip, unzip
Shell: echo, printf, env, export, alias, unalias, history, clear, exit, source
Editors: nano, vim
Help: man, info, whatis, apropos
Package: apt, yum, dnf, pacman
Try: ls, cd Documents, cat hello.txt, tree`,
  }),

  apt: args => {
    if (args[0] === 'update')
      return {
        output:
          'Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nReading package lists... Done',
      };
    if (args[0] === 'upgrade')
      return { output: '0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded' };
    if (args[0] === 'install')
      return {
        output: `Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed:\n  ${args[1] || 'package'}\n0 upgraded, 1 newly installed, 0 to remove.\nNeed to get 0 B/1,024 kB of archives.\nAfter this operation, 2,048 kB of additional disk space will be used.\nGet:1 ${args[1] || 'package'} [1,024 kB]\nFetched 1,024 kB in 0s (10.2 MB/s)\nSelecting previously unselected package ${args[1] || 'package'}.\nPreparing to unpack .../${args[1] || 'package'}.deb ...\nUnpacking ${args[1] || 'package'} ...\nSetting up ${args[1] || 'package'} ...`,
      };
    if (args[0] === 'remove') return { output: `Removing ${args[1] || 'package'} ...` };
    return { output: 'apt: usage: apt [update|upgrade|install|remove]' };
  },

  yum: args => {
    if (args[0] === 'install')
      return {
        output: `Resolving dependencies...\n--> Running transaction check\n---> Package ${args[1] || 'package'}.x86_64 will be installed\n\nInstalled:\n  ${args[1] || 'package'}.x86_64`,
      };
    return { output: 'yum: usage: yum [install|remove|update]' };
  },

  dnf: args => {
    if (args[0] === 'install')
      return {
        output: `Last metadata expiration check: 0:00:00 ago.\nDependencies resolved.\n${args[1] || 'package'}          x86_64          1.0-1          1.0 M\n\nInstalled:\n  ${args[1] || 'package'}.x86_64`,
      };
    return { output: 'dnf: usage: dnf [install|remove|update]' };
  },

  pacman: args => {
    if (args[0] === '-S' || args[0] === 'install')
      return {
        output: `resolving dependencies...\nlooking for conflicting packages...\n\nPackages (1) ${args[1] || 'package'}-1.0-1\n\nTotal Installed Size:  1.0 MiB\n\n:: Proceed with installation? [Y/n]\n(1/1) checking keys in keyring...\n(1/1) checking package integrity...\n(1/1) loading package files...\n(1/1) checking for file conflicts...\n(1/1) checking available disk space...\n:: Processing package changes...\n(1/1) installing ${args[1] || 'package'}...`,
      };
    return { output: 'pacman: usage: pacman -S package' };
  },

  snap: args => {
    if (args[0] === 'install')
      return {
        output: `Download snap "${args[1] || 'package'}" from channel "stable"\n${args[1] || 'package'} 1.0 from Canonical installed`,
      };
    return { output: 'snap: usage: snap [install|remove|list]' };
  },

  nano: (args, ctx) => {
    if (args.length === 0) return { error: 'nano: missing file operand' };
    const filePath = resolvePath(ctx.cwd, args[0]);
    const node = getNode(ctx.fs, filePath);
    let content = '';
    let newFs = ctx.fs;
    if (node) {
      if (node.type === 'dir') return { error: `nano: ${args[0]}: Is a directory` };
      content = node.content || '';
    } else {
      const parent = getParent(ctx.fs, filePath);
      if (!parent) return { error: `nano: cannot open ${args[0]}: Permission denied` };
      newFs = cloneFs(ctx.fs);
      const newParent = getParent(newFs, filePath);
      if (newParent) {
        const name = filePath.substring(filePath.lastIndexOf('/') + 1) || args[0];
        createNode(newParent, name, 'file', '');
      }
    }
    return {
      output: '',
      editorMode: 'nano',
      nanoState: { filePath, content, cursor: content.length },
      newFs,
    };
  },

  vim: (args, ctx) => {
    if (args.length === 0) return { error: 'vim: missing file operand' };
    const filePath = resolvePath(ctx.cwd, args[0]);
    const node = getNode(ctx.fs, filePath);
    let content = '';
    let newFs = ctx.fs;
    if (node) {
      if (node.type === 'dir') return { error: `vim: ${args[0]}: Is a directory` };
      content = node.content || '';
    } else {
      const parent = getParent(ctx.fs, filePath);
      if (!parent) return { error: `vim: cannot open ${args[0]}: Permission denied` };
      newFs = cloneFs(ctx.fs);
      const newParent = getParent(newFs, filePath);
      if (newParent) {
        const name = filePath.substring(filePath.lastIndexOf('/') + 1) || args[0];
        createNode(newParent, name, 'file', '');
      }
    }
    return {
      output: '',
      editorMode: 'vim',
      vimState: { filePath, content, mode: 'normal', message: '' },
      newFs,
    };
  },

  sudo: (args, ctx) => {
    if (args.length === 0) return { error: 'sudo: no command specified' };
    const subCommand = args[0];
    const subArgs = args.slice(1);
    const handler = commands[subCommand];
    if (!handler) return { output: `${subCommand}: command executed with sudo privileges` };
    const result = handler(subArgs, { ...ctx, user: 'root' });
    if (typeof result === 'string') return { output: result };
    return result;
  },

  reboot: () => ({
    output:
      'reboot: This command would restart the system in a real Linux environment.\nIn this simulator, no action is taken.',
  }),
  shutdown: () => ({
    output:
      'shutdown: This command would power off the system in a real Linux environment.\nIn this simulator, no action is taken.',
  }),
  halt: () => ({
    output:
      'halt: This command would halt the system in a real Linux environment.\nIn this simulator, no action is taken.',
  }),
  poweroff: () => ({
    output:
      'poweroff: This command would power off the system in a real Linux environment.\nIn this simulator, no action is taken.',
  }),
  mkfs: () => ({
    output:
      'mkfs: This command would create a filesystem on a device.\nIn this simulator, no device is formatted.',
  }),
  fdisk: () => ({
    output: 'fdisk: This command would partition a disk.\nIn this simulator, no disk is modified.',
  }),
  dd: () => ({
    output:
      'dd: This command would copy and convert data at a low level.\nIn this simulator, no data is written.',
  }),
  rm_rf: () => ({
    output:
      'rm -rf: This would recursively and forcefully delete files.\nIn this simulator, this destructive command is blocked.',
  }),

  cowsay: args => {
    const text = args.join(' ') || 'Linux is awesome!';
    return {
      output: ` __${'_'.repeat(text.length)}__\n< ${text} >\n -${'-'.repeat(text.length)}-\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`,
    };
  },

  fortune: () => {
    const fortunes = [
      'Stay curious, keep learning.',
      'In Linux we trust.',
      'The terminal is your friend.',
      'With great power comes great responsibility.',
      'May your code be bug-free and your commands be sudo-free.',
    ];
    return { output: fortunes[Math.floor(Math.random() * fortunes.length)] };
  },

  matrix: () => ({
    output: 'Wake up, Neo...\nThe Matrix has you...\nFollow the white rabbit.',
  }),

  hello: () => ({ output: 'Hello, future Linux wizard! 🐧' }),
};

export function getCommandNames(): string[] {
  return Object.keys(commands).sort();
}

export function getCommandHandler(name: string): CommandHandler | undefined {
  return commands[name];
}

export function hasCommand(name: string): boolean {
  return name in commands;
}

export { commands };
