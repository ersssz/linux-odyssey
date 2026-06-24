import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { V86 } from 'v86';
import { v86Assets, v86Cmdline } from './v86';
import { applyGuestSetup } from './guestSetup';
import { themes } from '../components/terminal/themes';

export type V86Emulator = InstanceType<typeof V86>;
export type BootStatus = 'booting' | 'ready';

function getXtermTheme(themeId: string) {
  const t = themes[themeId] || themes.classic;
  return {
    background: t.bg,
    foreground: t.text,
    cursor: t.green,
    black: t.bg,
    red: t.red,
    green: t.green,
    yellow: t.yellow,
    blue: t.text,
    magenta: t.dim,
    cyan: t.text,
    white: t.text,
    brightBlack: t.dim,
  };
}

export interface VmInstance {
  container: HTMLDivElement;
  fit: FitAddon;
  emulator: V86Emulator;
  status: BootStatus;
  bootMs?: number;
  focus(): void;

  onStatus(fn: (s: BootStatus, ms?: number) => void): () => void;

  onReady(fn: (e: V86Emulator) => void): () => void;

  setTheme(themeId: string): void;

  dispose(): void;
}

function createVmInstance(): VmInstance {
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';

  const term = new XTerm({
    cursorBlink: true,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 14,
    lineHeight: 1.2,
    theme: getXtermTheme('classic'),
    convertEol: true,
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(container); // opened on a detached node; fit() after attach sizes it

  const emulator = new V86({
    wasm_path: v86Assets.wasm,
    bios: { url: v86Assets.bios },
    vga_bios: { url: v86Assets.vgaBios },
    bzimage: { url: v86Assets.bzimage },
    cmdline: v86Cmdline,
    autostart: true,
    disable_mouse: true,
    filesystem: {},
  });

  const statusFns = new Set<(s: BootStatus, ms?: number) => void>();
  const readyFns = new Set<(e: V86Emulator) => void>();

  const inst: VmInstance = {
    container,
    fit,
    emulator,
    status: 'booting',
    focus: () => term.focus(),
    onStatus(fn) {
      statusFns.add(fn);
      return () => {
        statusFns.delete(fn);
      };
    },
    onReady(fn) {
      readyFns.add(fn);
      return () => {
        readyFns.delete(fn);
      };
    },
    setTheme(themeId: string) {
      term.options.theme = getXtermTheme(themeId);
    },
    dispose() {
      try {
        void emulator.destroy();
      } catch {
        void 0;
      }
      term.dispose();
      statusFns.clear();
      readyFns.clear();
    },
  };

  let booted = false;
  let serialBuf = '';
  const t0 = performance.now();
  emulator.add_listener('serial0-output-byte', (byte: number) => {
    term.write(Uint8Array.of(byte));
    if (booted) return;
    serialBuf += String.fromCharCode(byte);
    if (serialBuf.length > 4000) serialBuf = serialBuf.slice(-2000);
    const ready =
      serialBuf.includes('appear in /mnt') || /[#$%]\s*$/.test(serialBuf.trimEnd() + ' ');
    if (!ready) return;
    booted = true;

    const initToken = `io_init_${performance.now().toFixed(0)}`;
    const initCmd = `stty -F /dev/ttyS0 cols ${term.cols} rows ${term.rows} 2>/dev/null || true`;
    void emulator.create_file('.io-req', new TextEncoder().encode(`${initToken} EXEC ${initCmd}`));

    const ms = Math.round(performance.now() - t0);

    void applyGuestSetup(emulator)
      .catch(() => {})
      .finally(() => {
        inst.status = 'ready';
        inst.bootMs = ms;
        statusFns.forEach(f => f('ready', ms));
        readyFns.forEach(f => f(emulator));
        term.focus();
      });
  });

  term.onResize(({ cols, rows }) => {
    if (booted) {
      const token = `io_resize_${performance.now().toFixed(0)}`;
      const cmd = `stty -F /dev/ttyS0 cols ${cols} rows ${rows} 2>/dev/null || true`;
      void emulator.create_file('.io-req', new TextEncoder().encode(`${token} EXEC ${cmd}`));
    }
  });

  emulatorToTerm.set(emulator, term);
  term.onData(data => {
    const bytes = new TextEncoder().encode(data);
    for (let i = 0; i < bytes.length; i++) {
      emulator.serial0_send(String.fromCharCode(bytes[i]));
    }
  });
  return inst;
}

const persistentInstances: Record<string, VmInstance> = {};

export function getPersistentVmHost(id: string = 'default'): VmInstance {
  if (!persistentInstances[id]) persistentInstances[id] = createVmInstance();
  return persistentInstances[id];
}

export function createEphemeralVmHost(): VmInstance {
  return createVmInstance();
}

const emulatorToTerm = new WeakMap<V86Emulator, XTerm>();

export function clearVisualTerminal(emulator: V86Emulator) {
  const term = emulatorToTerm.get(emulator);
  if (term) term.clear();
}

export function isPersistentVmReady(id: string = 'default'): boolean {
  return persistentInstances[id]?.status === 'ready';
}

export function getPersistentVmBootMs(id: string = 'default'): number | null {
  return persistentInstances[id]?.bootMs ?? null;
}
