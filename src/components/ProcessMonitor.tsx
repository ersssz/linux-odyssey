import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Plus, Zap, Skull } from 'lucide-react';
import type { ProcInfo } from '../engine/snapshot';
import { easing } from '../utils/motion';

interface ProcessMonitorProps {
  procs: ProcInfo[];
  onSpawn: () => void;
  onKill: (pid: number, signal: 'TERM' | 'KILL') => void;
}

export function ProcessMonitor({ procs, onSpawn, onKill }: ProcessMonitorProps) {
  const [hit, setHit] = useState<{ pid: number; signal: string } | null>(null);

  const fireKill = (pid: number, signal: 'TERM' | 'KILL') => {
    setHit({ pid, signal });
    onKill(pid, signal);
    setTimeout(() => setHit(null), 700);
  };

  const victims = procs.filter(p => p.victim);
  const system = procs.filter(p => !p.victim);

  return (
    <div className="bg-surface border border-surface-light rounded-xl p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-terminal-cyan" />
          Процессы ядра ({procs.length})
        </h3>
        <button
          onClick={onSpawn}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-terminal-green/15 text-terminal-green hover:bg-terminal-green/25 transition-colors"
        >
          <Plus className="w-3 h-3" /> процесс
        </button>
      </div>

      {}
      <div className="mb-4">
        <div className="text-xs text-terminal-dim mb-2">
          Полигон сигналов — запусти процесс и пошли ему сигнал:
        </div>
        {victims.length === 0 ? (
          <div className="text-xs text-terminal-dim italic px-2 py-3 rounded-md bg-surface-light/40">
            Нет запущенных процессов. Нажми «+ процесс» (запустит <code>sleep</code>).
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {victims.map(p => (
                <motion.div
                  key={p.pid}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={
                    hit?.pid === p.pid
                      ? { opacity: [1, 1, 0], scale: [1, 1.05, 0.85], x: [0, -4, 8] }
                      : { opacity: 1, x: 0 }
                  }
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.5, ease: easing.outBack }}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-terminal-bg border border-surface-light"
                >
                  <span className="font-mono text-sm text-terminal-text">
                    <span className="text-terminal-cyan">{p.pid}</span> фоновый процесс
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => fireKill(p.pid, 'TERM')}
                      title="kill -TERM (мягко)"
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-terminal-yellow/15 text-terminal-yellow hover:bg-terminal-yellow/25 transition-colors"
                    >
                      <Zap className="w-3 h-3" /> TERM
                    </button>
                    <button
                      onClick={() => fireKill(p.pid, 'KILL')}
                      title="kill -9 (жёстко)"
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-terminal-red/15 text-terminal-red hover:bg-terminal-red/25 transition-colors"
                    >
                      <Skull className="w-3 h-3" /> KILL
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {}
      <div className="text-xs text-terminal-dim mb-2">Системные процессы (из /proc):</div>
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
  );
}
