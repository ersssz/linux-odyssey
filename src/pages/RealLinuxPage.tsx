import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import {
  Cpu,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TerminalSquare,
  Radio,
  FolderTree,
  RefreshCw,
} from 'lucide-react';
import { RealTerminal, type BootStatus, type V86Emulator } from '../components/RealTerminal';
import { isPersistentVmReady, getPersistentVmBootMs } from '../engine/realVmHost';
import { FilesystemCanvas } from '../components/viz/FilesystemCanvas';
import { FileEditor, useFileEditor } from '../components/viz/FileEditor';
import { ProcessMonitor } from '../components/ProcessMonitor';
import { isRealLinuxSupported, realLinuxUnsupportedReason } from '../engine/v86';
import {
  requestSnapshot,
  runInGuest,
  spawnVictim,
  readGuestFile,
  writeGuestFile,
  readEditRequest,
} from '../engine/realEngine';
import type { Snapshot } from '../engine/snapshot';
import { fadeUp } from '../utils/motion';
import { themes } from '../components/terminal/themes';

const REAL_HOME = '/root';

export default function RealLinuxPage() {
  const navigate = useNavigate();
  const supported = isRealLinuxSupported();

  const [status, setStatus] = useState<BootStatus>(() =>
    isPersistentVmReady() ? 'ready' : 'booting'
  );
  const [bootMs, setBootMs] = useState<number | null>(() => getPersistentVmBootMs());
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [tab, setTab] = useState<'files' | 'procs'>('files');
  const [theme, setTheme] = useState('classic');
  const emulatorRef = useRef<V86Emulator | null>(null);

  const spawnProc = useCallback(() => {
    if (emulatorRef.current) spawnVictim(emulatorRef.current);
  }, []);
  const killProc = useCallback((pid: number, signal: 'TERM' | 'KILL') => {
    if (emulatorRef.current) runInGuest(emulatorRef.current, `kill -${signal} ${pid}`);
  }, []);

  const handleCd = useCallback((target: string) => {
    if (emulatorRef.current) runInGuest(emulatorRef.current, `cd ${target}`);
  }, []);

  const editor = useFileEditor({
    read: useCallback(async (path: string) => {
      if (!emulatorRef.current) throw new Error('no kernel');
      return readGuestFile(emulatorRef.current, path);
    }, []),
    write: useCallback(async (path: string, content: string) => {
      if (!emulatorRef.current) throw new Error('no kernel');
      await writeGuestFile(emulatorRef.current, path, content);
    }, []),
  });
  const handleOpenFile = useCallback(
    (name: string) => {
      const base = (snap?.cwd ?? REAL_HOME).replace(/\/$/, '');
      void editor.openFile(name, `${base}/${name}`);
    },
    [editor, snap]
  );

  const handleStatus = useCallback((s: BootStatus, ms?: number) => {
    setStatus(s);
    if (ms != null) setBootMs(ms);
  }, []);

  const handleReady = useCallback((emulator: V86Emulator) => {
    emulatorRef.current = emulator;
    (window as unknown as { linuxVm?: V86Emulator }).linuxVm = emulator;
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    let cancelled = false;
    let inFlight = false;
    const tick = async () => {
      if (inFlight || !emulatorRef.current) return;
      inFlight = true;
      try {
        const s = await requestSnapshot(emulatorRef.current, REAL_HOME);
        if (!cancelled) setSnap(s);

        const editPath = await readEditRequest(emulatorRef.current);
        if (editPath && !cancelled) {
          const name = editPath.split('/').pop() || editPath;
          void editor.openFile(name, editPath);
        }
      } catch {
        void 0;
      } finally {
        inFlight = false;
      }
    };
    void tick();
    const id = setInterval(tick, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (!supported) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-surface border border-terminal-yellow/30 p-8 text-center">
          <div className="w-14 h-14 rounded-xl bg-terminal-yellow/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-terminal-yellow" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Терминал недоступна здесь</h2>
          <p className="text-terminal-dim mb-2">
            Настоящее ядро Linux требует SharedArrayBuffer и cross-origin isolation.
          </p>
          <p className="text-xs text-terminal-dim font-mono mb-6">
            Причина: {realLinuxUnsupportedReason()}
          </p>
          <p className="text-terminal-text mb-6">
            Чаще всего помогает перезагрузка — изоляция включается сервис-воркером со второго
            захода. Если не помогло, кампания и симулированный терминал работают в любом браузере.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-terminal-green text-terminal-bg font-bold hover:bg-terminal-green/90 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Перезагрузить и включить ядро
            </button>
            <button
              onClick={() => navigate('/learn')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface border border-surface-light text-white font-medium hover:border-accent transition-colors"
            >
              <TerminalSquare className="w-5 h-5 text-terminal-green" />
              Перейти к кампании
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-terminal-green/30 text-sm text-terminal-green mb-2">
            <Cpu className="w-4 h-4" />
            <span>Настоящее ядро Linux · v86 WASM</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Терминал</h2>
          <p className="text-terminal-dim max-w-2xl">
            Это не симуляция. Под капотом — настоящий x86-Linux, загруженный прямо в браузере.
            Реальный bash, реальные <code className="text-terminal-green">grep</code>,{' '}
            <code className="text-terminal-green">awk</code>,{' '}
            <code className="text-terminal-green">vim</code> — всё работает по-настоящему.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === 'booting' ? (
            <motion.div
              key="booting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-surface-light text-terminal-yellow"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Загрузка ядра…</span>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-terminal-green/10 border border-terminal-green/30 text-terminal-green"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                Ядро загружено{bootMs != null ? ` за ${(bootMs / 1000).toFixed(1)} c` : ''}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className={`lg:col-span-2 relative rounded-xl border border-surface-light bg-terminal-bg overflow-hidden shadow-2xl transition-all duration-300 theme-${theme}`}
        >
          {}
          <div className="terminal-header-bar flex items-center gap-2 px-4 py-2.5 bg-surface/50 border-b border-surface-light backdrop-blur-md transition-colors">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-terminal-red" />
              <span className="w-3 h-3 rounded-full bg-terminal-yellow" />
              <span className="w-3 h-3 rounded-full bg-terminal-green" />
            </div>
            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-terminal-green/20 text-terminal-green font-mono uppercase tracking-wider border border-terminal-green/30">
              Терминал
            </span>
            <span className="text-xs text-terminal-dim font-mono flex-1">
              root@linux-odyssey: ~
            </span>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="bg-transparent text-xs text-terminal-dim outline-none cursor-pointer"
            >
              {Object.keys(themes).map(t => (
                <option key={t} value={t} className="bg-surface text-white">
                  {themes[t].name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <RealTerminal
              persist={true}
              vmId="sandbox"
              themeId={theme}
              onStatus={handleStatus}
              onReady={handleReady}
              className="h-[60vh] min-h-[380px] p-2"
            />

            {}
            <AnimatePresence>
              {status === 'booting' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden"
                >
                  <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-terminal-green to-transparent animate-[shine_1.2s_linear_infinite]" />
                </motion.div>
              )}
            </AnimatePresence>
            {theme === 'crt' && (
              <div className="crt-scanlines pointer-events-none absolute inset-0 z-10" />
            )}
          </div>
        </div>

        {}
        <div className="lg:col-span-1 flex flex-col gap-2 h-[60vh] min-h-[380px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-terminal-dim">
              <Radio
                className={`w-3.5 h-3.5 ${snap ? 'text-terminal-green animate-pulse' : 'text-terminal-dim'}`}
              />
              <span>Живой снимок из настоящего Linux</span>
            </div>
            <div className="flex bg-surface-light rounded-lg p-0.5">
              <button
                onClick={() => setTab('files')}
                aria-pressed={tab === 'files'}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  tab === 'files' ? 'bg-accent text-white' : 'text-terminal-dim hover:text-white'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" /> Файлы
              </button>
              <button
                onClick={() => setTab('procs')}
                aria-pressed={tab === 'procs'}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  tab === 'procs' ? 'bg-accent text-white' : 'text-terminal-dim hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" /> Процессы
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {editor.open ? (
              editor.content === null ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 rounded-xl bg-surface border border-surface-light text-terminal-dim text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-terminal-cyan/70" />
                  Читаю {editor.open.name}…
                </div>
              ) : (
                <FileEditor
                  key={editor.open.path}
                  name={editor.open.name}
                  path={editor.open.path}
                  initialContent={editor.content}
                  busy={editor.busy}
                  error={editor.error}
                  status={editor.status}
                  onSave={editor.save}
                  onClose={editor.close}
                />
              )
            ) : snap ? (
              tab === 'files' ? (
                <FilesystemCanvas
                  fs={snap.fs}
                  cwd={snap.cwd}
                  rootName={REAL_HOME}
                  onCd={handleCd}
                  onOpenFile={handleOpenFile}
                />
              ) : (
                <ProcessMonitor procs={snap.procs} onSpawn={spawnProc} onKill={killProc} />
              )
            ) : (
              <div className="h-full flex items-center justify-center rounded-xl bg-surface border border-surface-light text-terminal-dim text-sm">
                {status === 'ready' ? 'Чтение состояния…' : 'Ожидание загрузки ядра…'}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-terminal-dim">
        Создай файл — <code className="text-terminal-green">touch hello.txt</code> или{' '}
        <code className="text-terminal-green">mkdir demo</code> — и панель справа обновит реальное
        состояние ФС. Это не симуляция: данные читаются прямо из работающего Linux.
      </p>
    </motion.div>
  );
}
