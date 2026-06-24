import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Plus, Zap, Skull, AlertTriangle } from 'lucide-react';
import type { ProcInfo } from '../../engine/snapshot';
import { easing } from '../../utils/motion';

interface ProcessMapProps {
  procs: ProcInfo[];
  onSpawn: () => void;
  onKill: (pid: number, signal: 'TERM' | 'KILL') => void;
}

export function ProcessMap({ procs, onSpawn, onKill }: ProcessMapProps) {
  const [hit, setHit] = useState<{ pid: number; signal: 'TERM' | 'KILL' } | null>(null);

  const fireKill = (pid: number, signal: 'TERM' | 'KILL') => {
    setHit({ pid, signal });
    onKill(pid, signal);
    setTimeout(() => setHit(null), 800);
  };

  const victims = procs.filter(p => p.victim);
  const system = procs.filter(p => !p.victim);

  return (
    <div className="bg-surface border border-surface-light rounded-xl h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-light">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-terminal-cyan" />
          Карта процессов ядра ({procs.length})
        </h3>
        <button
          onClick={onSpawn}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-terminal-green/15 text-terminal-green hover:bg-terminal-green/25 transition-colors"
        >
          <Plus className="w-3 h-3" /> процесс
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {}
        <div className="text-xs text-terminal-dim mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-terminal-red" />
          Подозрительные процессы — пошли сигнал, чтобы завершить:
        </div>
        {victims.length === 0 ? (
          <div className="text-xs text-terminal-dim italic px-3 py-4 rounded-lg bg-surface-light/40 text-center">
            Нет чужих процессов. Нажми «+ процесс» (запустит фоновый <code>sleep</code>).
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 mb-4">
            <AnimatePresence mode="popLayout">
              {victims.map(p => {
                const struck = hit?.pid === p.pid;
                return (
                  <motion.div
                    key={p.pid}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={
                      struck
                        ? { opacity: [1, 1, 0], scale: [1, 1.06, 0.7] }
                        : { opacity: 1, scale: 1 }
                    }
                    exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.25 } }}
                    transition={{ duration: 0.4, ease: easing.outExpo }}
                    className="relative overflow-hidden rounded-xl border border-terminal-red/30 bg-terminal-red/5 p-3"
                  >
                    {}
                    {!struck && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-xl border border-terminal-red/35"
                        animate={{ opacity: [0.35, 0, 0.35] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    {}
                    {struck && (
                      <motion.span
                        aria-hidden
                        className={`absolute left-1/2 top-1/2 rounded-full ${
                          hit?.signal === 'KILL' ? 'bg-terminal-red/40' : 'bg-terminal-yellow/40'
                        }`}
                        style={{ translateX: '-50%', translateY: '-50%' }}
                        initial={{ width: 0, height: 0, opacity: 0.8 }}
                        animate={{ width: 360, height: 360, opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      />
                    )}
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="font-mono text-sm">
                        <span className="text-terminal-red">PID {p.pid}</span>{' '}
                        <span className="text-terminal-text">фоновый процесс</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => fireKill(p.pid, 'TERM')}
                          title="kill -TERM (мягко завершить)"
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-terminal-yellow/15 text-terminal-yellow hover:bg-terminal-yellow/25 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" /> SIGTERM
                        </button>
                        <button
                          onClick={() => fireKill(p.pid, 'KILL')}
                          title="kill -9 (немедленно убить)"
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-terminal-red/15 text-terminal-red hover:bg-terminal-red/25 transition-colors"
                        >
                          <Skull className="w-3.5 h-3.5" /> SIGKILL
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {}
        <div className="text-xs text-terminal-dim mb-1.5">Таблица процессов (из /proc):</div>
        <div className="space-y-0.5">
          {system.map(p => (
            <div
              key={p.pid}
              className="flex items-center gap-2 px-2 py-1 rounded text-xs font-mono hover:bg-surface-light/40"
            >
              <span className="text-terminal-cyan w-10 text-right shrink-0">{p.pid}</span>
              <span className="text-terminal-text truncate">{p.comm}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 border-t border-surface-light text-[11px] text-terminal-dim">
        SIGTERM — вежливо завершить · SIGKILL — убить немедленно · данные из настоящего ядра
      </div>
    </div>
  );
}
