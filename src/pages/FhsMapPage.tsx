import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { AlertTriangle, Cpu, FolderTree, Map, Target, Terminal } from 'lucide-react';
import { fhsEntries, fhsCategories, type FhsEntry } from '../data/fhs';
import { campaign } from '../data/campaign';

function findMissionForCommand(cmdString: string): string | null {
  const primaryCmd = cmdString.trim().split(' ')[0];
  for (const chapter of campaign) {
    for (const step of chapter.steps) {
      if (step.hint?.includes(primaryCmd) || step.builder?.includes(primaryCmd)) {
        return chapter.id;
      }
    }
  }
  return null;
}
import { staggerContainer, staggerItem } from '../utils/motion';

const categoryKeys = Object.keys(fhsCategories) as FhsEntry['category'][];

function tileIcon(node: FhsEntry) {
  if (node.path === '/') return <Map className="w-6 h-6 text-terminal-green" />;
  if (node.category === 'core') return <FolderTree className="w-6 h-6 text-terminal-yellow" />;
  if (node.category === 'config') return <Cpu className="w-6 h-6 text-terminal-cyan" />;
  if (node.category === 'virtual') return <Terminal className="w-6 h-6 text-terminal-red" />;
  return <FolderTree className="w-6 h-6 text-terminal-dim" />;
}

function MapNode({
  entry,
  isSelected,
  onClick,
}: {
  entry: FhsEntry;
  isSelected: boolean;
  onClick: (e: FhsEntry) => void;
}) {
  const cat = fhsCategories[entry.category];
  return (
    <motion.button
      variants={staggerItem}
      onClick={() => onClick(entry)}
      className={`relative group flex items-center gap-3 p-3 rounded-xl border transition-all text-left w-full
        ${
          isSelected
            ? 'border-accent bg-accent/15 shadow-[0_0_25px_rgba(59,130,246,0.25)] z-10'
            : 'border-white/5 bg-surface/40 hover:bg-surface-light hover:border-accent/40'
        }
      `}
    >
      {isSelected && (
        <motion.div
          layoutId="active-node-glow"
          className="absolute inset-0 rounded-xl bg-accent/5"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <div
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors z-10 ${
          isSelected
            ? 'border-accent/60 bg-accent/20 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            : `border-surface-light bg-surface/50 ${cat.badge}`
        }`}
      >
        {tileIcon(entry)}
      </div>
      <div className="min-w-0 flex-1 z-10">
        <div className="flex items-center justify-between gap-2">
          <code
            className={`block truncate font-mono text-sm font-bold ${isSelected ? 'text-accent drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-terminal-green'}`}
          >
            {entry.path}
          </code>
          {entry.danger && (
            <AlertTriangle className="h-3.5 w-3.5 text-terminal-yellow shrink-0 animate-pulse" />
          )}
        </div>
        <p className="text-xs text-white/60 truncate mt-0.5 group-hover:text-white/80 transition-colors">
          {entry.name}
        </p>
      </div>
    </motion.button>
  );
}

export default function FhsMapPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<FhsEntry>(fhsEntries[0]);
  const [activeCategory, setActiveCategory] = useState<FhsEntry['category'] | 'all'>('all');

  const visible =
    activeCategory === 'all'
      ? fhsEntries
      : fhsEntries.filter(entry => entry.category === activeCategory);

  const rootEntry = fhsEntries.find(entry => entry.path === '/') ?? fhsEntries[0];
  const childrenEntries = visible.filter(entry => entry.path !== '/');
  const selectedEntry =
    visible.find(entry => entry.path === selected.path) ?? visible[0] ?? fhsEntries[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[calc(100vh-100px)]"
    >
      {}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-terminal-bg to-terminal-bg" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        <motion.div
          animate={{ y: ['0vh', '100vh'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 right-0 h-[2px] bg-accent/30 shadow-[0_0_20px_rgba(59,130,246,0.6)]"
        />
      </div>

      <div className="mb-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent/40 text-sm text-accent mb-3 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Map className="w-4 h-4 animate-pulse" />
          <span className="font-bold tracking-widest uppercase">Система HUD-радара</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 drop-shadow-lg tracking-tight">
          Голографическая карта системы
        </h2>
        <p className="text-terminal-dim max-w-2xl">
          Это не справочник-стена. Выбирай узлы карты, смотри, как они связаны с корнем `/`, и сразу
          пробуй команды в терминале.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory('all')}
          aria-pressed={activeCategory === 'all'}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            activeCategory === 'all'
              ? 'bg-accent text-white'
              : 'bg-surface border border-surface-light text-terminal-dim hover:text-white'
          }`}
        >
          Все узлы
        </button>
        {categoryKeys.map(key => {
          const cat = fhsCategories[key];
          const active = activeCategory === key;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-surface-light text-terminal-dim hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cat.dot}`} aria-hidden="true" />
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(400px,0.85fr)] gap-8 relative z-10">
        {}
        <div className="glass-panel rounded-3xl border border-white/5 p-4 sm:p-8 overflow-x-auto relative min-h-[60vh] flex flex-col items-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="w-full flex flex-col items-center pt-4"
          >
            {}
            <motion.div
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
              className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none z-0"
            />

            {}
            {(activeCategory === 'all' || rootEntry.category === activeCategory) && (
              <div className="relative inline-block mb-0 z-10 w-full max-w-[280px]">
                <MapNode
                  entry={rootEntry}
                  isSelected={selectedEntry.path === '/'}
                  onClick={setSelected}
                />
              </div>
            )}

            {childrenEntries.length > 0 && (
              <div className="w-full flex flex-col items-center relative z-10">
                {}
                <div className="w-px h-10 bg-gradient-to-b from-accent/50 to-accent/20 relative">
                  <div className="absolute top-0 w-2 h-2 -ml-[3.5px] rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,1)]" />
                </div>

                {}
                <div className="w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent relative mb-0">
                  <motion.div
                    animate={{ scaleX: [0.9, 1.1, 0.9], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-accent shadow-[0_0_15px_rgba(59,130,246,0.6)] blur-[1px]"
                  />
                </div>

                {}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 mt-0 w-full px-2">
                  {categoryKeys.map(catKey => {
                    if (activeCategory !== 'all' && activeCategory !== catKey) return null;
                    const items = childrenEntries.filter(e => e.category === catKey);
                    if (items.length === 0) return null;

                    return (
                      <div
                        key={catKey}
                        className="flex flex-col items-center min-w-[220px] max-w-[260px] flex-1"
                      >
                        {}
                        <div className="w-px h-8 bg-gradient-to-b from-accent/30 to-transparent relative mb-2">
                          <div className="absolute bottom-0 w-1.5 h-1.5 -ml-[2px] rounded-full bg-accent/50" />
                        </div>

                        {}
                        <div className="w-full flex flex-col gap-2 p-3 rounded-2xl border border-white/5 bg-surface/30 backdrop-blur-md relative group hover:border-accent/20 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                          <div className="text-center text-[10px] tracking-[0.2em] uppercase text-terminal-dim mb-1 flex items-center justify-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${fhsCategories[catKey].dot}`}
                            />
                            {fhsCategories[catKey].label}
                          </div>

                          {items.map(entry => (
                            <MapNode
                              key={entry.path}
                              entry={entry}
                              isSelected={selectedEntry.path === entry.path}
                              onClick={setSelected}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="xl:sticky xl:top-24 h-fit">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedEntry.path}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-3xl glass-panel border border-accent/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative"
            >
              <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />
              <div className="border-b border-white/10 bg-accent/5 px-6 py-5 relative overflow-hidden">
                <motion.div
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-accent/20 to-transparent skew-x-12 pointer-events-none"
                />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 border border-accent/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    {tileIcon(selectedEntry)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-widest text-accent font-bold mb-1">
                      Данные узла HUD
                    </div>
                    <code className="block truncate font-mono text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                      {selectedEntry.path}
                    </code>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${fhsCategories[selectedEntry.category].badge}`}
                  >
                    {fhsCategories[selectedEntry.category].label}
                  </span>
                  {selectedEntry.danger && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-terminal-yellow/10 text-terminal-yellow border border-terminal-yellow/30">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Осторожно
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{selectedEntry.name}</h3>
                <p className="text-terminal-text leading-relaxed mb-5">
                  {selectedEntry.description}
                </p>

                {selectedEntry.danger && (
                  <div className="flex items-start gap-2 mb-5 rounded-xl border border-terminal-yellow/30 bg-terminal-yellow/10 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-terminal-yellow" />
                    <span className="text-sm text-terminal-yellow">
                      Системная зона. Изменения здесь могут затронуть работу всей системы.
                    </span>
                  </div>
                )}

                <div className="mb-2 text-xs uppercase tracking-wide text-terminal-dim">
                  Попробуй в терминале
                </div>
                <div className="space-y-2">
                  {selectedEntry.examples.map(example => (
                    <div
                      key={example}
                      className="flex items-center gap-2 rounded-xl border border-surface-light bg-terminal-bg px-3 py-2 font-mono text-sm"
                    >
                      <Terminal className="h-3.5 w-3.5 shrink-0 text-terminal-green" />
                      <span className="text-terminal-dim">$</span>
                      <span className="text-terminal-text flex-1">{example}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate('/linux')}
                    className="inline-flex items-center gap-2 rounded-xl bg-terminal-green px-4 py-2.5 font-medium text-terminal-bg transition-colors hover:bg-terminal-green/90"
                  >
                    <Cpu className="h-4 w-4" /> Попробовать в терминале
                  </button>
                  {(() => {
                    const chapterId = findMissionForCommand(
                      selectedEntry.examples[0] || selectedEntry.path
                    );
                    if (!chapterId) return null;
                    return (
                      <button
                        onClick={() => navigate('/learn', { state: { openChapterId: chapterId } })}
                        className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 font-medium text-accent transition-colors hover:bg-accent hover:text-white"
                      >
                        <Target className="h-4 w-4" /> Пройти миссию
                      </button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
