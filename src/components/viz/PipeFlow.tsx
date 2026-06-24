import { motion } from 'framer-motion';
import { TerminalSquare, ArrowRight, FileOutput } from 'lucide-react';
import { easing } from '../../utils/motion';

interface PipeFlowProps {
  command?: string;
}

function stageRole(cmd: string): string {
  const name = cmd.trim().split(/\s+/)[0];
  const roles: Record<string, string> = {
    cat: 'читает файл',
    ls: 'список файлов',
    grep: 'фильтрует строки',
    wc: 'считает',
    sort: 'сортирует',
    uniq: 'убирает повторы',
    head: 'первые строки',
    tail: 'последние строки',
    tr: 'заменяет символы',
    sed: 'правит текст',
    awk: 'обрабатывает поля',
    cut: 'вырезает столбцы',
  };
  return roles[name] ?? 'обрабатывает';
}

function parsePipeline(command: string): { stages: string[]; redirect: string | null } {
  let redirect: string | null = null;
  let cmd = command;
  const redir = cmd.match(/>>?\s*(\S+)\s*$/);
  if (redir) {
    redirect = redir[1];
    cmd = cmd.slice(0, redir.index).trim();
  }
  const stages = cmd
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);
  return { stages, redirect };
}

export function PipeFlow({ command }: PipeFlowProps) {
  const { stages, redirect } = command ? parsePipeline(command) : { stages: [], redirect: null };
  const hasPipeline = stages.length >= 2 || (stages.length >= 1 && redirect);

  return (
    <div className="bg-surface border border-surface-light rounded-xl h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-light">
        <TerminalSquare className="w-4 h-4 text-terminal-cyan" />
        <h3 className="text-sm font-semibold text-white">Конвейер (пайплайн)</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!hasPipeline ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-terminal-dim">
            <TerminalSquare className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm text-terminal-text">Запусти команду с пайпом</p>
            <p className="text-xs mt-1 font-mono">cat app.log | grep ERROR | wc -l</p>
            <p className="text-xs mt-2 max-w-xs">
              Каждая команда передаёт свой вывод следующей — увидишь поток данных по стадиям.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {stages.map((stage, i) => (
              <div key={i} className="flex flex-col gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.35, ease: easing.outExpo }}
                  className="rounded-xl border border-terminal-cyan/30 bg-terminal-cyan/5 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-white">{stage}</span>
                    <span className="text-[10px] text-terminal-cyan uppercase tracking-wide">
                      стадия {i + 1}
                    </span>
                  </div>
                  <div className="text-xs text-terminal-dim mt-0.5">{stageRole(stage)}</div>
                </motion.div>

                {}
                {i < stages.length - 1 && (
                  <div className="relative h-7 flex items-center justify-center">
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-terminal-cyan/30 to-terminal-cyan/80" />
                    <motion.div
                      className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-terminal-cyan/90 shadow-[0_0_6px_rgba(86,212,221,0.5)]"
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span className="absolute left-[calc(50%+10px)] text-[9px] text-terminal-cyan font-mono">
                      stdout → stdin
                    </span>
                  </div>
                )}
              </div>
            ))}

            {}
            {redirect && (
              <>
                <div className="relative h-7 flex items-center justify-center">
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-terminal-cyan/30 to-terminal-green/80" />
                  <ArrowRight className="absolute left-1/2 -translate-x-1/2 rotate-90 w-3.5 h-3.5 text-terminal-green" />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stages.length * 0.12, ease: easing.outBack }}
                  className="rounded-xl border border-terminal-green/40 bg-terminal-green/5 p-3 flex items-center gap-2"
                >
                  <FileOutput className="w-4 h-4 text-terminal-green" />
                  <span className="font-mono text-sm text-terminal-green">{redirect}</span>
                  <span className="text-xs text-terminal-dim ml-auto">
                    результат сохранён в файл
                  </span>
                </motion.div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-surface-light text-[11px] text-terminal-dim">
        Поток данных по стадиям реальной команды · вывод одной → вход следующей
      </div>
    </div>
  );
}
