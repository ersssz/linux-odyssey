import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface Line {
  cmd: string;
  typed: string;
  out: string | null;
  glow?: boolean;
  done: boolean;
}

const SCRIPT = [
  { cmd: 'uname -sr', out: 'Linux 6.8.12 — настоящее ядро в браузере', glow: false },
  { cmd: 'ls /root', out: 'journal.txt  incident/  secret.key', glow: false },
  {
    cmd: 'chmod 600 secret.key',
    out: 'Доступ восстановлен ✓  задание засчитано  +60 XP',
    glow: true,
  },
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function HeroTerminal() {
  const prefersReduced = useReducedMotion();
  const [lines, setLines] = useState<Line[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (prefersReduced) return; // static fallback computed in render
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        setLines([]);
        for (let i = 0; i < SCRIPT.length; i++) {
          const s = SCRIPT[i];
          if (cancelled) return;
          setActive(i);
          setLines(prev => [
            ...prev,
            { cmd: s.cmd, typed: '', out: null, glow: s.glow, done: false },
          ]);
          for (let c = 1; c <= s.cmd.length; c++) {
            if (cancelled) return;
            await sleep(34 + Math.random() * 46);
            setLines(prev => {
              const n = [...prev];
              n[i] = { ...n[i], typed: s.cmd.slice(0, c) };
              return n;
            });
          }
          await sleep(420);
          if (cancelled) return;
          setLines(prev => {
            const n = [...prev];
            n[i] = { ...n[i], out: s.out, done: true };
            return n;
          });
          await sleep(750);
        }
        setActive(SCRIPT.length);
        await sleep(2600);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [prefersReduced]);

  const rows: Line[] = prefersReduced
    ? SCRIPT.map(s => ({ cmd: s.cmd, typed: s.cmd, out: s.out, glow: s.glow, done: true }))
    : lines;
  const activeIdx = prefersReduced ? -1 : active;

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#05080f]/80 backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="relative flex items-center gap-2 px-4 py-3 border-b border-white/5 glass">
        <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_rgba(255,95,86,0.6)]" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_rgba(255,189,46,0.6)]" />
        <span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_rgba(39,201,63,0.6)]" />
        <span className="ml-2 text-xs text-terminal-dim font-mono font-medium flex-1 text-center pr-12 opacity-70">
          root@linux-odyssey: ~
        </span>
      </div>
      <div className="relative p-6 font-mono text-[15px] min-h-[250px] leading-relaxed">
        {rows.map((line, i) => (
          <div key={i} className="mb-1.5 whitespace-pre-wrap break-words">
            <div>
              <span className="text-terminal-dim">root@linux-odyssey:~#</span>{' '}
              <span className="text-terminal-green">{line.typed}</span>
              {activeIdx === i && !line.done && (
                <span className="inline-block w-2 h-4 bg-terminal-green ml-0.5 align-middle animate-pulse" />
              )}
            </div>
            {line.out && (
              <div
                className={
                  line.glow
                    ? 'text-terminal-green drop-shadow-[0_0_8px_rgba(63,185,80,0.7)]'
                    : 'text-terminal-text'
                }
              >
                {line.out}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
