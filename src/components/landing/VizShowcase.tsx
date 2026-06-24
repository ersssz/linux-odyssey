import { motion } from 'framer-motion';
import { Folder, FileText, FileCog, Check, ArrowDown, Skull } from 'lucide-react';

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-surface-light bg-surface overflow-hidden flex flex-col"
    >
      <div className="h-44 bg-terminal-bg/60 border-b border-surface-light p-4 flex items-center justify-center">
        {children}
      </div>
      <div className="p-5">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-sm text-terminal-dim leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function FilesMini() {
  const tiles = [
    { icon: <Folder className="w-5 h-5 text-terminal-yellow" />, dir: true },
    { icon: <FileText className="w-5 h-5 text-terminal-cyan" />, dir: false },
    { icon: <FileCog className="w-5 h-5 text-terminal-green" />, dir: false },
    { icon: <FileText className="w-5 h-5 text-terminal-cyan" />, dir: false },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-[180px]">
      {tiles.map((t, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
          className={`flex flex-col gap-1.5 p-2.5 rounded-lg border ${
            t.dir
              ? 'bg-terminal-yellow/[0.06] border-terminal-yellow/20'
              : 'bg-terminal-bg border-surface-light'
          }`}
        >
          {t.icon}
          <span className="h-1.5 w-3/4 rounded bg-surface-light" />
        </motion.div>
      ))}
    </div>
  );
}

function PermsMini() {
  const grid = [
    [true, true, false],
    [true, false, false],
    [false, false, false],
  ];
  const labels = ['u', 'g', 'o'];
  return (
    <div className="flex gap-2">
      {grid.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-1.5">
          <span className="text-[10px] text-terminal-dim text-center">{labels[ci]}</span>
          {col.map((on, ri) => (
            <div
              key={ri}
              className={`w-9 h-7 rounded-md border flex items-center justify-center ${
                on
                  ? 'bg-terminal-green/20 border-terminal-green/40'
                  : 'bg-surface-light/40 border-transparent'
              }`}
            >
              {on ? (
                <Check className="w-3.5 h-3.5 text-terminal-green" />
              ) : (
                <span className="text-terminal-dim text-xs">·</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PipeMini() {
  const stages = ['cat app.log', 'grep ERROR', 'wc -l'];
  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px]">
      {stages.map((s, i) => (
        <div key={i} className="w-full flex flex-col items-center gap-1.5">
          <div className="w-full rounded-lg border border-terminal-cyan/30 bg-terminal-cyan/5 px-3 py-1.5 font-mono text-xs text-white text-center">
            {s}
          </div>
          {i < stages.length - 1 && (
            <motion.div
              animate={{ y: [0, 4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            >
              <ArrowDown className="w-4 h-4 text-terminal-cyan" />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProcMini() {
  return (
    <div className="flex flex-col gap-2 w-full max-w-[200px]">
      <div className="relative rounded-lg border border-terminal-red/40 bg-terminal-red/5 px-3 py-2 flex items-center justify-between">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-lg border border-terminal-red/40"
          animate={{ opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="relative font-mono text-xs text-terminal-red">PID 118 · rogue</span>
        <Skull className="relative w-4 h-4 text-terminal-red" />
      </div>
      {['PID 1 · init', 'PID 42 · sh'].map(p => (
        <div
          key={p}
          className="rounded-lg border border-surface-light px-3 py-2 font-mono text-xs text-terminal-dim"
        >
          {p}
        </div>
      ))}
    </div>
  );
}

export function VizShowcase() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <Card
        title="Живая карта файлов"
        desc="Плитки появляются, когда ты создаёшь файлы в терминале."
      >
        <FilesMini />
      </Card>
      <Card
        title="Права наглядно"
        desc="Клик по ячейке rwx запускает настоящий chmod — биты меняются вживую."
      >
        <PermsMini />
      </Card>
      <Card
        title="Конвейеры (пайпы)"
        desc="Видно, как вывод одной команды течёт во вход следующей."
      >
        <PipeMini />
      </Card>
      <Card
        title="Процессы и сигналы"
        desc="Подозрительный процесс пульсирует и исчезает от сигнала."
      >
        <ProcMini />
      </Card>
    </div>
  );
}
