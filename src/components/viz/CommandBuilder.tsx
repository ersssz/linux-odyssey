import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Play, Delete, Eraser } from 'lucide-react';
import { soundManager } from '../../utils/sound';
import { easing } from '../../utils/motion';

interface CommandBuilderProps {
  blocks: string[];
  onRun: (command: string) => void;
  disabled?: boolean;
}

export function CommandBuilder({ blocks, onRun, disabled = false }: CommandBuilderProps) {
  const [tokens, setTokens] = useState<string[]>([]);

  const add = (b: string) => {
    if (disabled) return;
    soundManager.playClick();
    setTokens(prev => [...prev, b]);
  };
  const backspace = () => setTokens(prev => prev.slice(0, -1));
  const clear = () => setTokens([]);
  const run = () => {
    if (disabled || tokens.length === 0) return;
    onRun(tokens.join(' '));
    setTokens([]);
  };

  return (
    <div className="rounded-xl border border-surface-light bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="w-4 h-4 text-terminal-purple" />
        <h4 className="text-sm font-semibold text-white">Конструктор команд</h4>
        <span className="text-[11px] text-terminal-dim">собери мышью, без печати</span>
      </div>

      {}
      <div className="bg-terminal-bg rounded-lg px-3 py-2.5 mb-3 min-h-[44px] font-mono text-sm border border-surface-light flex flex-wrap items-center gap-1.5">
        <span className="text-terminal-green select-none">$</span>
        {tokens.length === 0 ? (
          <span className="text-terminal-dim italic">кликай блоки ниже…</span>
        ) : (
          <AnimatePresence mode="popLayout">
            {tokens.map((t, i) => (
              <motion.span
                key={`${t}-${i}`}
                layout
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.18, ease: easing.outBack }}
                className="px-2 py-0.5 rounded bg-surface-light text-terminal-green"
              >
                {t}
              </motion.span>
            ))}
          </AnimatePresence>
        )}
      </div>

      {}
      <div className="flex flex-wrap gap-2 mb-3">
        {blocks.map((b, i) => (
          <motion.button
            key={`${b}-${i}`}
            whileHover={disabled ? undefined : { scale: 1.05, y: -1 }}
            whileTap={disabled ? undefined : { scale: 0.95 }}
            onClick={() => add(b)}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg font-mono text-sm border border-surface-light bg-terminal-bg text-terminal-text hover:border-accent hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {b}
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={backspace}
          disabled={tokens.length === 0}
          className="px-3 py-2 rounded-lg bg-surface-light text-terminal-dim text-sm hover:text-white disabled:opacity-40 flex items-center gap-1.5"
        >
          <Delete className="w-4 h-4" /> Стереть
        </button>
        <button
          onClick={clear}
          disabled={tokens.length === 0}
          className="px-3 py-2 rounded-lg bg-surface-light text-terminal-dim text-sm hover:text-white disabled:opacity-40 flex items-center gap-1.5"
        >
          <Eraser className="w-4 h-4" /> Сброс
        </button>
        <button
          onClick={run}
          disabled={disabled || tokens.length === 0}
          className="ml-auto px-5 py-2 rounded-lg bg-terminal-green/90 text-terminal-bg font-semibold hover:bg-terminal-green disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
        >
          <Play className="w-4 h-4" /> Запустить
        </button>
      </div>
    </div>
  );
}
