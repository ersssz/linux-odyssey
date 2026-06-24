import { canAccess, cloneFs, createNode, getNode, getParent, resolvePath } from '../fileSystem';
import { getCommandHandler, getCommandNames } from './commands';
import { parseShell } from './parser';
import type { CommandResult, TerminalContext } from './types';

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

function suggestCommands(cmd: string): string[] {
  const maxDistance = cmd.length <= 3 ? 1 : 2;
  return getCommandNames()
    .map(name => ({ name, dist: editDistance(cmd, name) }))
    .filter(c => c.dist > 0 && c.dist <= maxDistance)
    .sort((a, b) => a.dist - b.dist || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map(c => c.name);
}

function expandAlias(input: string, aliases: Record<string, string>): string {
  const firstSpace = input.indexOf(' ');
  const firstWord = firstSpace === -1 ? input : input.slice(0, firstSpace);
  const rest = firstSpace === -1 ? '' : input.slice(firstSpace);
  if (aliases[firstWord]) {
    return aliases[firstWord] + rest;
  }
  return input;
}

function executeSingleCommand(input: string, ctx: TerminalContext): CommandResult {
  const expanded = expandAlias(input, ctx.aliases);
  const parsed = parseShell(expanded);
  const cmd = parsed.args[0] || '';
  const args = parsed.args.slice(1);

  if (!cmd) return {};

  const handler = getCommandHandler(cmd);
  if (!handler) {
    const suggestions = suggestCommands(cmd);
    const suggestionText =
      suggestions.length > 0 ? `\nDid you mean: ${suggestions.join(', ')}?` : '';
    return {
      error: `${cmd}: command not found${suggestionText}\nType 'help' to see available commands.`,
    };
  }

  if (parsed.redirectIn) {
    const inputFile = resolvePath(ctx.cwd, parsed.redirectIn);
    const node = getNode(ctx.fs, inputFile);
    if (!node || node.type === 'dir') {
      return { error: `bash: ${parsed.redirectIn}: No such file or directory` };
    }
    if (['cat', 'head', 'tail', 'grep', 'sort', 'uniq', 'wc'].includes(cmd)) {
      args.push(parsed.redirectIn);
    }
  }

  let rawResult: CommandResult | string | undefined;
  try {
    rawResult = handler(args, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `${cmd}: ${message}` };
  }
  const result: CommandResult =
    typeof rawResult === 'string' ? { output: rawResult } : rawResult || {};

  if (result.output && (parsed.redirectOut || parsed.redirectOutAppend)) {
    const target = resolvePath(ctx.cwd, parsed.redirectOut || parsed.redirectOutAppend!);
    const parent = getParent(ctx.fs, target);
    if (!parent || !canAccess(parent, ctx.user, 'w')) {
      return {
        ...result,
        error: `bash: ${parsed.redirectOut || parsed.redirectOutAppend}: Permission denied`,
      };
    }
    const newFs = cloneFs(result.newFs || ctx.fs);
    const newParent = getParent(newFs, target);
    if (!newParent) {
      return {
        ...result,
        error: `bash: ${parsed.redirectOut || parsed.redirectOutAppend}: Permission denied`,
      };
    }
    const name =
      target.substring(target.lastIndexOf('/') + 1) ||
      parsed.redirectOut ||
      parsed.redirectOutAppend!;
    const existing = getNode(newFs, target);
    if (existing && existing.type === 'file') {
      if (!canAccess(existing, ctx.user, 'w')) {
        return {
          ...result,
          error: `bash: ${parsed.redirectOut || parsed.redirectOutAppend}: Permission denied`,
        };
      }
      existing.content = parsed.redirectOutAppend
        ? (existing.content || '') + result.output
        : result.output;
    } else {
      createNode(newParent, name, 'file', result.output);
    }
    return { ...result, newFs, skipOutput: true };
  }

  return result;
}

function parsePipeNumberFlag(args: string[], flag: string, defaultValue: number): number {
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === flag && i + 1 < args.length) {
      return parseInt(args[i + 1], 10) || defaultValue;
    }
    if (arg.startsWith(`${flag}`)) {
      return parseInt(arg.slice(flag.length), 10) || defaultValue;
    }
    i++;
  }
  return defaultValue;
}

function applyPipeGrep(stdin: string, args: string[]): string {
  let pattern = '';
  let caseInsensitive = false;
  let invert = false;
  let lineNumbers = false;
  let count = false;
  for (const arg of args) {
    if (arg === '-i') caseInsensitive = true;
    else if (arg === '-v') invert = true;
    else if (arg === '-n') lineNumbers = true;
    else if (arg === '-c') count = true;
    else if (!arg.startsWith('-') && !pattern) pattern = arg;
  }
  if (!pattern) return '';
  const regex = new RegExp(pattern, caseInsensitive ? 'i' : '');
  const lines = stdin.split('\n');
  const matches: { line: string; index: number }[] = [];
  lines.forEach((line, index) => {
    const matched = regex.test(line);
    if ((matched && !invert) || (!matched && invert)) {
      matches.push({ line, index });
    }
  });
  if (count) return String(matches.length);
  if (lineNumbers) return matches.map(m => `${m.index + 1}:${m.line}`).join('\n');
  return matches.map(m => m.line).join('\n');
}

function applyPipeWc(stdin: string, args: string[]): string {
  const lines = stdin.split('\n').length;
  const words = stdin.split(/\s+/).filter(Boolean).length;
  const bytes = stdin.length;
  if (args.includes('-l')) return String(lines);
  if (args.includes('-w')) return String(words);
  if (args.includes('-c')) return String(bytes);
  return `${lines} ${words} ${bytes}`;
}

function applyPipeHead(stdin: string, args: string[]): string {
  const n = parsePipeNumberFlag(args, '-n', 10);
  return stdin.split('\n').slice(0, n).join('\n');
}

function applyPipeTail(stdin: string, args: string[]): string {
  const n = parsePipeNumberFlag(args, '-n', 10);
  return stdin.split('\n').slice(-n).join('\n');
}

function applyPipeSort(stdin: string): string {
  return stdin.split('\n').sort().join('\n');
}

function applyPipeUniq(stdin: string): string {
  const lines = stdin.split('\n');
  return lines.filter((line, i) => i === 0 || line !== lines[i - 1]).join('\n');
}

function applyPipeTr(stdin: string, args: string[]): string {
  if (args.length < 2) return stdin;
  const from = args[0];
  const to = args[1];
  return stdin
    .split('')
    .map(ch => {
      const idx = from.indexOf(ch);
      return idx >= 0 && idx < to.length ? to[idx] : ch;
    })
    .join('');
}

function applyPipeSed(stdin: string, args: string[]): string {
  if (args.length < 1) return stdin;
  const script = args[0];
  const match = script.match(/^s\/(.+?)\/(.+?)\/(g?)$/);
  if (!match) return stdin;
  const [, oldStr, newStr, global] = match;
  const flags = global ? 'g' : '';
  const regex = new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
  return stdin.replace(regex, newStr);
}

function executePipeStage(stdin: string, command: string): CommandResult {
  const parsed = parseShell(command);
  const cmd = parsed.args[0] || '';
  const args = parsed.args.slice(1);

  switch (cmd) {
    case 'grep':
      return { output: applyPipeGrep(stdin, args) };
    case 'wc':
      return { output: applyPipeWc(stdin, args) };
    case 'head':
      return { output: applyPipeHead(stdin, args) };
    case 'tail':
      return { output: applyPipeTail(stdin, args) };
    case 'sort':
      return { output: applyPipeSort(stdin) };
    case 'uniq':
      return { output: applyPipeUniq(stdin) };
    case 'cat':
    case 'tee':
      return { output: stdin };
    case 'tr':
      return { output: applyPipeTr(stdin, args) };
    case 'sed':
      return { output: applyPipeSed(stdin, args) };
    default:
      return { error: `bash: pipe to ${cmd} is not supported` };
  }
}

export function executeCommand(input: string, ctx: TerminalContext): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return {};

  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map(p => p.trim());
    if (parts.length < 2) return executeSingleCommand(trimmed, ctx);

    let currentFs = ctx.fs;
    let stdin = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === 0) {
        const result = executeSingleCommand(part, { ...ctx, fs: currentFs });
        if (result.error) return result;
        if (result.newFs) currentFs = result.newFs;
        stdin = result.output || '';
      } else {
        const result = executePipeStage(stdin, part);
        if (result.error) return result;
        if (result.newFs) currentFs = result.newFs;
        stdin = result.output || '';
      }
    }

    return { output: stdin, newFs: currentFs === ctx.fs ? undefined : currentFs };
  }

  return executeSingleCommand(trimmed, ctx);
}

export { parseShell };
