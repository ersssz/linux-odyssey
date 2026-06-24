import { motion } from 'framer-motion';
import { User, Users, Globe, Lock, Check } from 'lucide-react';
import type { FileNode } from '../../utils/fileSystem';
import { easing } from '../../utils/motion';

interface PermissionConfiguratorProps {
  fs: FileNode;

  target?: string;

  goalPerms?: string;

  onChmod?: (command: string) => void;
}

const COLS = [
  { key: 'owner', label: 'Владелец', icon: User, who: 'u' },
  { key: 'group', label: 'Группа', icon: Users, who: 'g' },
  { key: 'others', label: 'Остальные', icon: Globe, who: 'o' },
] as const;

const ROWS = [
  { key: 'r', label: 'Чтение', value: 4 },
  { key: 'w', label: 'Запись', value: 2 },
  { key: 'x', label: 'Выполнение', value: 1 },
] as const;

function findNode(fs: FileNode, relPath: string): FileNode | null {
  const parts = relPath.split('/').filter(Boolean);
  let cur: FileNode = fs;
  for (const part of parts) {
    const next = cur.children?.find(c => c.name === part);
    if (!next) return null;
    cur = next;
  }
  return cur;
}

function splitBits(permissions?: string) {
  const bits = permissions && permissions.length >= 10 ? permissions.slice(1, 10) : '---------';
  return { owner: bits.slice(0, 3), group: bits.slice(3, 6), others: bits.slice(6, 9), bits };
}

function octalOf(bits: string): string {
  const seg = (s: string) =>
    (s[0] === 'r' ? 4 : 0) + (s[1] === 'w' ? 2 : 0) + (s[2] === 'x' ? 1 : 0);
  return `${seg(bits.slice(0, 3))}${seg(bits.slice(3, 6))}${seg(bits.slice(6, 9))}`;
}

export function PermissionConfigurator({
  fs,
  target,
  goalPerms,
  onChmod,
}: PermissionConfiguratorProps) {
  const node = target ? findNode(fs, target) : null;
  const interactive = !!onChmod && !!target;

  if (!node) {
    return (
      <div className="bg-surface border border-surface-light rounded-xl h-full flex flex-col items-center justify-center text-center text-terminal-dim p-6">
        <Lock className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm text-terminal-text">
          Файл <code className="text-terminal-green font-mono">{target}</code> ещё не создан
        </p>
        <p className="text-xs mt-1">Создай его в терминале — права появятся здесь</p>
      </div>
    );
  }

  const { owner, group, others, bits } = splitBits(node.permissions);
  const cells: Record<string, string> = { owner, group, others };
  const matched = goalPerms ? bits === goalPerms : false;

  return (
    <div className="bg-surface border border-surface-light rounded-xl h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-light">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-terminal-cyan" />
          Права: <code className="font-mono text-terminal-green">{node.name}</code>
        </h3>
        <motion.div
          key={bits}
          initial={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: easing.outBack }}
          className={`font-mono text-sm px-3 py-1 rounded-lg ${
            matched
              ? 'bg-terminal-green/20 text-terminal-green'
              : 'bg-surface-light text-terminal-text'
          }`}
        >
          {bits} · {octalOf(bits)}
        </motion.div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-2.5">
          {COLS.map(col => {
            const Icon = col.icon;
            const seg = cells[col.key];
            return (
              <div key={col.key} className="rounded-lg bg-surface-light/40 p-2.5">
                <div className="flex items-center gap-1.5 mb-2 text-xs text-terminal-dim">
                  <Icon className="w-3.5 h-3.5" /> {col.label}
                </div>
                <div className="space-y-1.5">
                  {ROWS.map((row, i) => {
                    const on = seg[i] !== '-';
                    const toggle = () =>
                      onChmod?.(`chmod ${col.who}${on ? '-' : '+'}${row.key} ${target}`);
                    const Cell = interactive ? motion.button : motion.div;
                    return (
                      <Cell
                        key={row.key}
                        onClick={interactive ? toggle : undefined}
                        whileTap={interactive ? { scale: 0.94 } : undefined}
                        animate={{
                          backgroundColor: on ? 'rgba(63,185,80,0.18)' : 'rgba(255,255,255,0.02)',
                        }}
                        transition={{ duration: 0.25 }}
                        title={
                          interactive
                            ? `chmod ${col.who}${on ? '-' : '+'}${row.key} ${target}`
                            : undefined
                        }
                        className={`flex w-full items-center justify-between px-2 py-1.5 rounded-md border text-left ${
                          on ? 'border-terminal-green/30' : 'border-transparent'
                        } ${interactive ? 'cursor-pointer hover:border-terminal-green/50' : ''}`}
                      >
                        <span
                          className={`font-mono text-sm ${on ? 'text-terminal-green' : 'text-terminal-dim'}`}
                        >
                          {row.key}
                        </span>
                        {on ? (
                          <Check className="w-3.5 h-3.5 text-terminal-green" />
                        ) : (
                          <span className="w-3.5 h-3.5 text-terminal-dim text-center leading-none">
                            ·
                          </span>
                        )}
                      </Cell>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-surface-light text-[11px] text-terminal-dim">
        {goalPerms ? (
          matched ? (
            <span className="text-terminal-green">✓ Права совпали с целью {goalPerms}</span>
          ) : (
            <span>
              Цель: <span className="font-mono text-terminal-text">{goalPerms}</span> ·{' '}
              {interactive ? 'клик по ячейке меняет права' : 'меняй права командой chmod'}
            </span>
          )
        ) : interactive ? (
          <span>
            Клик по ячейке rwx запускает реальный <code className="text-terminal-green">chmod</code>
          </span>
        ) : (
          <span>
            Отражает реальные права файла · <code className="text-terminal-green">chmod</code> в
            терминале меняет их вживую
          </span>
        )}
      </div>
    </div>
  );
}
