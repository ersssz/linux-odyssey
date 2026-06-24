import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Cpu, Loader2, CheckCircle2, Radio, Target, Trophy, Award } from 'lucide-react';
import {
  RealTerminal,
  clearVisualTerminal,
  type BootStatus,
  type V86Emulator,
} from './RealTerminal';
import { ProcessMap } from './viz/ProcessMap';
import { FilesystemCanvas } from './viz/FilesystemCanvas';
import { PermissionConfigurator } from './viz/PermissionConfigurator';
import { PipeFlow } from './viz/PipeFlow';
import { CommandBuilder } from './viz/CommandBuilder';
import { FileEditor, useFileEditor } from './viz/FileEditor';
import { Terminal, type TerminalState, type TerminalHandle } from './Terminal';
import { AiAssistant } from './AiAssistant';
import { useEngine } from '../engine/EngineProvider';
import {
  requestSnapshot,
  runInGuest,
  spawnVictim,
  readGuestFile,
  writeGuestFile,
  readEditRequest,
  execGuestCommand,
} from '../engine/realEngine';
import type { Snapshot } from '../engine/snapshot';
import { cloneFs, getNode, initialFileSystem, type FileNode } from '../utils/fileSystem';
import { useGame } from '../hooks/useGame';
import { soundManager } from '../utils/sound';
import { campaign, stepKey, type CampaignChapter, type CampaignStep } from '../data/campaign';
import { fadeUp, fadeIn, staggerContainer } from '../utils/motion';
import { themes } from './terminal/themes';

const REAL_HOME = '/root';
const SIM_HOME = '/home/penguin';

function simSnapshot(fs: FileNode, cwd: string): Snapshot {
  const home = getNode(fs, SIM_HOME);
  return { cwd, fs: home ?? fs, procs: [] };
}

interface CampaignStepViewProps {
  chapter: CampaignChapter;
  onExit: () => void;
}

export function CampaignStepView({ chapter, onExit }: CampaignStepViewProps) {
  const { kind } = useEngine();
  const isReal = kind === 'real';
  const { state, completeLesson } = useGame();
  const done = state.completed;

  const firstOpen = Math.max(
    0,
    chapter.steps.findIndex(s => !done.has(stepKey(s.id)))
  );
  const [idx, setIdx] = useState(firstOpen === -1 ? chapter.steps.length : firstOpen);

  const [status, setStatus] = useState<BootStatus>(isReal ? 'booting' : 'ready');

  const [snap, setSnap] = useState<Snapshot | null>(() =>
    isReal ? null : simSnapshot(cloneFs(initialFileSystem), SIM_HOME)
  );
  const [theme, setTheme] = useState('classic');
  const [justCompleted, setJustCompleted] = useState(false);

  const [hintTier, setHintTier] = useState(0);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const emulatorRef = useRef<V86Emulator | null>(null);
  const simTermRef = useRef<TerminalHandle>(null);

  const openEditorRef = useRef<((name: string, path: string) => void) | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const [bootArmed, setBootArmed] = useState(!isReal);
  useEffect(() => {
    if (bootArmed) return;
    const id = setTimeout(() => setBootArmed(true), 450);
    return () => clearTimeout(id);
  }, [bootArmed]);

  const allDone = idx >= chapter.steps.length;
  const step: CampaignStep | undefined = chapter.steps[idx];

  const stepRef = useRef(step);
  const armedRef = useRef(false);
  const creditedRef = useRef(false);
  const completeRef = useRef(completeLesson);
  useEffect(() => {
    completeRef.current = completeLesson;
  });
  useEffect(() => {
    stepRef.current = step;
    armedRef.current = false;
    creditedRef.current = step ? done.has(stepKey(step.id)) : true;
  }, [idx, step, done]);

  const handleStatus = useCallback((s: BootStatus) => setStatus(s), []);
  const handleReady = useCallback((emulator: V86Emulator) => {
    emulatorRef.current = emulator;
  }, []);

  const setupDoneRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (status !== 'ready' || !step) return;
    if (setupDoneRef.current.has(step.id)) return;
    const id = setTimeout(
      () => {
        const cur = stepRef.current;
        if (!cur || setupDoneRef.current.has(cur.id)) return;

        if (isReal) {
          if (emulatorRef.current) {
            emulatorRef.current.serial0_send('\x15 cd ~\n\x0c');
            clearVisualTerminal(emulatorRef.current);

            if (cur.setup) {
              execGuestCommand(emulatorRef.current, `cd ~ && ${cur.setup}`).catch(console.error);
            }
            setupDoneRef.current.add(cur.id);
          }
        } else if (simTermRef.current) {
          simTermRef.current.runCommand('cd');
          simTermRef.current.runCommand('clear');
          if (cur.setup) simTermRef.current.runCommand(cur.setup); // SIM terminal can echo setup for now, or just leave it.
          setupDoneRef.current.add(cur.id);
        }
      },
      isReal ? 3500 : 350
    );
    return () => clearTimeout(id);
  }, [status, step, isReal]);

  const readFileText = useCallback(
    async (relPath: string): Promise<string> => {
      if (isReal) {
        if (!emulatorRef.current) return '';
        return readGuestFile(emulatorRef.current, `${REAL_HOME}/${relPath}`);
      }
      return simTermRef.current?.readFile(`${SIM_HOME}/${relPath}`) ?? '';
    },
    [isReal]
  );

  const verifyingRef = useRef(false);
  const creditIfDone = useCallback(
    async (s: Snapshot) => {
      const cur = stepRef.current;
      if (!cur || creditedRef.current || verifyingRef.current) return;
      if (cur.arm && !armedRef.current) armedRef.current = cur.arm(s);
      const armOk = !cur.arm || armedRef.current;
      if (!armOk || !cur.check?.(s)) return;

      if (cur.verify) {
        verifyingRef.current = true;
        try {
          const text = await readFileText(cur.verify.file);
          if (creditedRef.current) return; // credited elsewhere while we read
          if (!cur.verify.ok(text)) return; // file exists but content is wrong
        } catch {
          return; // couldn't read — try again next tick
        } finally {
          verifyingRef.current = false;
        }
      }

      creditedRef.current = true;
      completeRef.current('campaign', cur.id, cur.xp);

      setJustCompleted(true);
      try {
        soundManager.playSuccess();
        const isLast = cur.id === campaign[campaign.length - 1]?.id;
        if (isLast) {
          setTimeout(() => {
            // Need to import fireConfetti at the top if not already done, but it should be since it's used elsewhere
            import('../utils/confetti').then(m => m.fireConfetti());
          }, 200);
        } else {
          setTimeout(() => {
            import('../utils/confetti').then(m => m.fireSmallConfetti());
          }, 180);
        }
      } catch {
        void 0;
      }
    },
    [readFileText]
  );

  useEffect(() => {
    if (!isReal || status !== 'ready') return;
    let cancelled = false;
    let inFlight = false;
    const tick = async () => {
      if (inFlight || !emulatorRef.current) return;
      inFlight = true;
      try {
        const s = await requestSnapshot(emulatorRef.current, REAL_HOME);
        if (cancelled) return;
        (window as unknown as { __campaignSnap?: Snapshot }).__campaignSnap = s;
        setSnap(s);
        await creditIfDone(s);

        const editPath = await readEditRequest(emulatorRef.current);
        if (editPath && !cancelled) {
          const name = editPath.split('/').pop() || editPath;
          openEditorRef.current?.(name, editPath);
        }
      } catch {
        void 0;
      } finally {
        inFlight = false;
      }
    };
    void tick();
    const timer = setInterval(tick, 1500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [status, isReal, creditIfDone]);

  const handleSimCommand = useCallback(
    (cmd: string, st: TerminalState) => {
      setLastCommand(cmd);
      const s = simSnapshot(st.fs, st.cwd);
      setSnap(s);
      void creditIfDone(s);
    },
    [creditIfDone]
  );

  const spawnProc = useCallback(() => {
    if (emulatorRef.current) spawnVictim(emulatorRef.current);
  }, []);
  const killProc = useCallback((pid: number, signal: 'TERM' | 'KILL') => {
    if (emulatorRef.current) runInGuest(emulatorRef.current, `kill -${signal} ${pid}`);
  }, []);

  const runBuilt = useCallback(
    (cmd: string) => {
      setLastCommand(cmd);
      if (isReal) {
        if (emulatorRef.current) runInGuest(emulatorRef.current, cmd);
      } else {
        simTermRef.current?.runCommand(cmd);
      }
    },
    [isReal]
  );

  const handleCd = useCallback(
    (target: string) => {
      if (isReal) {
        if (emulatorRef.current) runInGuest(emulatorRef.current, `cd ${target}`);
      } else {
        simTermRef.current?.runCommand(`cd ${target}`);
      }
    },
    [isReal]
  );

  const editor = useFileEditor({
    read: useCallback(
      async (path: string) => {
        if (isReal) {
          if (!emulatorRef.current) throw new Error('no kernel');
          return readGuestFile(emulatorRef.current, path);
        }
        return simTermRef.current?.readFile(path) ?? '';
      },
      [isReal]
    ),
    write: useCallback(
      async (path: string, content: string) => {
        if (isReal) {
          if (!emulatorRef.current) throw new Error('no kernel');
          await writeGuestFile(emulatorRef.current, path, content);
        } else {
          simTermRef.current?.writeFile(path, content);
        }
      },
      [isReal]
    ),
  });

  const handleOpenFile = useCallback(
    (name: string) => {
      const base = snap?.cwd ?? (isReal ? REAL_HOME : SIM_HOME);
      void editor.openFile(name, `${base.replace(/\/$/, '')}/${name}`);
    },
    [editor, snap, isReal]
  );

  const openFile = editor.openFile;
  useEffect(() => {
    openEditorRef.current = (name, path) => void openFile(name, path);
  }, [openFile]);

  const goNext = useCallback(() => {
    setJustCompleted(false);
    setHintTier(0);
    setLastCommand(null);
    editor.close();
    setIdx(i => i + 1);
  }, [editor]);

  if (allDone) {
    const isLastChapter = campaign[campaign.length - 1]?.id === chapter.id;

    if (isLastChapter) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="relative max-w-2xl w-full rounded-2xl border-[1px] border-[#3fb950]/30 bg-[#0a0a0a] p-10 text-center shadow-[0_0_100px_rgba(63,185,80,0.2)] overflow-hidden"
          >
            <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-[#3fb950]/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 5 }}
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#3fb950]/10 border border-[#3fb950]/30 flex items-center justify-center shadow-[0_0_30px_rgba(63,185,80,0.3)]"
              >
                <Trophy className="w-12 h-12 text-[#3fb950]" />
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
                СИСТЕМА ВОССТАНОВЛЕНА
              </h2>

              <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#3fb950] to-transparent mx-auto mb-6" />

              <p className="text-lg md:text-xl text-[#aaaaaa] mb-10 max-w-lg mx-auto font-light leading-relaxed">
                От первого входа до полного контроля над сервером — ты прошел этот путь блестяще.
                Сеть защищена, сервисы работают стабильно.
                <br />
                <br />
                <span className="text-white font-medium">
                  Добро пожаловать в элиту Linux-администраторов.
                </span>
              </p>

              <button
                onClick={onExit}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-sm bg-[#3fb950] text-black text-lg font-bold hover:bg-[#3fb950]/90 transition-all uppercase tracking-widest overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Award className="w-5 h-5" /> ПОЛУЧИТЬ СЕРТИФИКАТ
                </span>
                <div className="absolute inset-0 h-full w-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      );
    }

    return (
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="max-w-xl mx-auto">
        <div className="rounded-2xl bg-surface border border-[#3fb950]/30 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#3fb950]/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-[#3fb950]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Глава пройдена!</h2>
          <p className="text-[#aaaaaa] mb-6">
            «{chapter.title}» — задания засчитаны по реальному состоянию сервера.
          </p>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3fb950] text-black font-bold hover:bg-[#3fb950]/90 transition-colors"
          >
            К карте глав
          </button>
        </div>
      </motion.div>
    );
  }

  if (step.realOnly && !isReal) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="max-w-2xl mx-auto">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm text-terminal-dim hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> К карте глав
        </button>
        <div className="rounded-2xl bg-surface border border-terminal-yellow/30 p-8 text-center">
          <div className="w-14 h-14 rounded-xl bg-terminal-yellow/10 flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-7 h-7 text-terminal-yellow" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Эта глава — на настоящем ядре</h2>
          <p className="text-terminal-dim">
            Этот шаг (процессы и сигналы, пайпы с записью в файл, сеть) работает только на реальном
            Linux — в симуляции таких возможностей нет. Открой платформу в браузере с поддержкой
            SharedArrayBuffer, чтобы пройти его по-настоящему.
          </p>
        </div>
      </motion.div>
    );
  }

  const stepNo = idx + 1;
  const vizRoot = isReal ? REAL_HOME : SIM_HOME;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm text-terminal-dim hover:text-white transition-colors self-start mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к карте глав
        </button>

        <motion.div
          variants={fadeIn}
          className="rounded-2xl glass-panel border border-white/5 p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-terminal-cyan to-transparent opacity-50" />

          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-xs text-accent font-mono uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Входящее сообщение
            </span>
            <span className="text-xs text-terminal-dim font-mono">
              {stepNo} / {chapter.steps.length}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{step.title}</h2>
          <p className="text-terminal-dim text-sm leading-relaxed mb-6">{step.story}</p>

          <div className="space-y-4">
            <div className="flex items-start gap-2 text-sm text-terminal-text">
              <Target className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>
                <span className="text-accent font-semibold">Цель:</span> {step.goal}
              </span>
            </div>

            {}
            <AnimatePresence>
              {hintTier > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 rounded-xl bg-terminal-yellow/5 border border-terminal-yellow/20 relative"
                >
                  <div className="absolute -top-2.5 left-4 px-2 bg-surface text-[10px] uppercase tracking-wider text-terminal-yellow font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Расшифровка
                  </div>
                  <p className="text-sm text-terminal-yellow/90 font-mono mt-1">
                    {hintTier === 1 ? step.concept : step.hint}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {hintTier < 2 && (
              <button
                onClick={() => setHintTier(t => (step.concept ? t + 1 : 2))}
                className="w-full text-xs text-terminal-dim hover:text-terminal-yellow transition-colors border border-dashed border-terminal-dim/30 py-2 rounded-lg"
              >
                {hintTier === 0
                  ? step.concept
                    ? 'Подсказать идею'
                    : 'Показать подсказку'
                  : 'Показать команду'}
              </button>
            )}
          </div>
        </motion.div>

        {}
        {chapter.act === 1 && step.builder && step.builder.length > 0 && (
          <CommandBuilder
            blocks={step.builder}
            onRun={runBuilt}
            disabled={isReal && status !== 'ready'}
          />
        )}
      </div>

      {}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4 h-[65vh] min-h-[400px]">
          {}
          {isReal ? (
            <motion.div
              variants={fadeIn}
              className={`relative rounded-xl border border-surface-light bg-terminal-bg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] glass-panel transition-all duration-300 theme-${theme}`}
            >
              <div className="terminal-header-bar flex items-center gap-2 px-4 py-2.5 bg-surface/50 border-b border-surface-light backdrop-blur-md transition-colors">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-terminal-red shadow-[0_0_8px_currentColor]" />
                  <span className="w-3 h-3 rounded-full bg-terminal-yellow shadow-[0_0_8px_currentColor]" />
                  <span className="w-3 h-3 rounded-full bg-terminal-green shadow-[0_0_8px_currentColor]" />
                </div>
                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-mono uppercase tracking-wider border border-accent/30">
                  Кампания
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
              {bootArmed ? (
                <RealTerminal
                  persist={true}
                  vmId="campaign"
                  themeId={theme}
                  onStatus={handleStatus}
                  onReady={handleReady}
                  className="h-[calc(65vh-44px)] min-h-[356px] p-2"
                />
              ) : (
                <div className="h-[calc(65vh-44px)] min-h-[356px] flex flex-col items-center justify-center gap-3 text-terminal-dim">
                  <Loader2 className="w-5 h-5 animate-spin text-terminal-green/70" />
                  <span className="text-sm">Готовим окружение…</span>
                </div>
              )}
              {theme === 'crt' && (
                <div className="crt-scanlines pointer-events-none absolute inset-0 z-10" />
              )}
            </motion.div>
          ) : (
            <motion.div variants={fadeIn} className="min-h-[380px]">
              <Terminal ref={simTermRef} onCommand={handleSimCommand} height="100%" />
            </motion.div>
          )}

          {}
          <motion.div
            variants={fadeIn}
            className="h-full overflow-auto rounded-xl border border-surface-light bg-surface/30"
          >
            {editor.open ? (
              editor.content === null ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-terminal-dim text-sm">
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
              step.viz === 'process' ? (
                <ProcessMap procs={snap.procs} onSpawn={spawnProc} onKill={killProc} />
              ) : step.viz === 'permissions' ? (
                <PermissionConfigurator
                  fs={snap.fs}
                  target={step.vizTarget}
                  goalPerms={step.vizGoal}
                  onChmod={runBuilt}
                />
              ) : step.viz === 'pipe' ? (
                <PipeFlow command={lastCommand ?? step.builder?.join(' ')} />
              ) : (
                <FilesystemCanvas
                  fs={snap.fs}
                  cwd={snap.cwd}
                  rootName={vizRoot}
                  onCd={handleCd}
                  onOpenFile={handleOpenFile}
                />
              )
            ) : (
              <div className="h-full flex items-center justify-center text-terminal-dim text-sm">
                {status === 'ready' ? 'Чтение состояния…' : 'Ожидание загрузки ядра…'}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-terminal-green/40 bg-terminal-green/10 p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-terminal-green shrink-0" />
              <div>
                <div className="text-white font-semibold">Задание выполнено!</div>
                <div className="text-xs text-terminal-dim">
                  {isReal
                    ? 'Засчитано по реальному состоянию сервера'
                    : 'Засчитано по состоянию файловой системы'}{' '}
                  · +{step.xp} XP
                </div>
              </div>
            </div>
            <button
              onClick={goNext}
              className="px-5 py-2.5 rounded-lg bg-terminal-green text-terminal-bg font-bold hover:bg-terminal-green/90 transition-colors whitespace-nowrap"
            >
              {idx + 1 < chapter.steps.length ? 'Следующий шаг' : 'Завершить главу'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AiAssistant
        missionTitle={step.title}
        missionGoal={step.goal}
        lastCommand={lastCommand ?? undefined}
      />
    </motion.div>
  );
}
