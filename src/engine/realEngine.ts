import type { V86Emulator } from '../components/RealTerminal';
import { parseLsLaR, parseProcs, parseVictimPids, type Snapshot } from './snapshot';

const TREE_MARKER = '<<<TREE>>>';
const PROCS_MARKER = '<<<PROCS>>>';
const VICTIMS_MARKER = '<<<VICTIMS>>>';
let counter = 0;

export function runInGuest(emulator: V86Emulator, cmd: string): void {
  const bytes = new TextEncoder().encode(cmd + '\n');
  for (let i = 0; i < bytes.length; i++) {
    emulator.serial0_send(String.fromCharCode(bytes[i]));
  }
}

export function spawnVictim(emulator: V86Emulator): void {
  runInGuest(emulator, 'sleep 300 & echo $! >> /mnt/.victims');
}

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function requestSnapshot(
  emulator: V86Emulator,
  homePath = '/root',
  timeoutMs = 4000
): Promise<Snapshot> {
  const token = `t${++counter}_${performance.now().toFixed(0)}`;
  await emulator.create_file('.snap-req', enc(token));

  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    await sleep(250);
    let text: string;
    try {
      text = dec(await emulator.read_file('.snap-out'));
    } catch {
      continue; // not written yet
    }
    const nl = text.indexOf('\n');
    if (nl < 0) continue;
    if (text.slice(0, nl).trim() !== token) continue; // stale / previous answer

    const rest = text.slice(nl + 1);
    const treeAt = rest.indexOf(TREE_MARKER);
    const procsAt = rest.indexOf(PROCS_MARKER);
    const victimsAt = rest.indexOf(VICTIMS_MARKER);
    const cwd = (treeAt >= 0 ? rest.slice(0, treeAt) : '').trim();
    const treeEnd = procsAt >= 0 ? procsAt : rest.length;
    const tree = treeAt >= 0 ? rest.slice(treeAt + TREE_MARKER.length, treeEnd) : '';
    const procsEnd = victimsAt >= 0 ? victimsAt : rest.length;
    const procsText = procsAt >= 0 ? rest.slice(procsAt + PROCS_MARKER.length, procsEnd) : '';
    const victimsText = victimsAt >= 0 ? rest.slice(victimsAt + VICTIMS_MARKER.length) : '';

    const victimPids = parseVictimPids(victimsText);
    const procs = parseProcs(procsText).map(p =>
      victimPids.has(p.pid) || p.pid > 100 ? { ...p, victim: true } : p
    );
    return { cwd: cwd || homePath, fs: parseLsLaR(tree, homePath), procs };
  }
  throw new Error('snapshot timeout');
}

async function awaitIo(emulator: V86Emulator, token: string, timeoutMs: number): Promise<string> {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    await sleep(250);
    let text: string;
    try {
      text = dec(await emulator.read_file('.io-out'));
    } catch {
      continue; // not written yet
    }
    const nl = text.indexOf('\n');
    const head = (nl < 0 ? text : text.slice(0, nl)).trim();
    if (head.split(' ')[0] !== token) continue; // stale / previous answer
    return nl < 0 ? '' : text.slice(nl + 1);
  }
  throw new Error('io timeout');
}

export async function readGuestFile(
  emulator: V86Emulator,
  absPath: string,
  timeoutMs = 4000
): Promise<string> {
  const token = `io${++counter}_${performance.now().toFixed(0)}`;
  await emulator.create_file('.io-req', enc(`${token} READ ${absPath}`));
  return awaitIo(emulator, token, timeoutMs);
}

export async function readEditRequest(emulator: V86Emulator): Promise<string | null> {
  let path: string;
  try {
    path = dec(await emulator.read_file('.edit-req')).trim();
  } catch {
    return null; // file doesn't exist yet
  }
  if (!path) return null;
  await emulator.create_file('.edit-req', enc('')); // consume the request
  return path;
}

export async function writeGuestFile(
  emulator: V86Emulator,
  absPath: string,
  content: string,
  timeoutMs = 4000
): Promise<void> {
  const token = `io${++counter}_${performance.now().toFixed(0)}`;
  await emulator.create_file('.io-data', enc(content));
  await emulator.create_file('.io-req', enc(`${token} WRITE ${absPath}`));
  await awaitIo(emulator, token, timeoutMs);
}

export async function execGuestCommand(
  emulator: V86Emulator,
  cmd: string,
  timeoutMs = 8000
): Promise<string> {
  const token = `io${++counter}_${performance.now().toFixed(0)}`;
  const fullCmd = `cd $(readlink /proc/$ODY_SHELL/cwd 2>/dev/null || pwd) && ${cmd}`;
  await emulator.create_file('.io-req', enc(`${token} EXEC ${fullCmd}`));
  return awaitIo(emulator, token, timeoutMs);
}
