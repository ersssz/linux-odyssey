import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router';
import {
  Activity,
  Archive,
  Award,
  Check,
  ChevronRight,
  Copy,
  Cpu,
  FileCode,
  FolderTree,
  GitBranch,
  Globe,
  Flag,
  Lock,
  Play,
  Scissors,
  Search,
  Settings,
  Shield,
  AlertTriangle,
  Users,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import { campaign, totalCampaignSteps, ACTS } from '../data/campaign';
import { CampaignStepView } from '../components/CampaignStepView';
import { useGame } from '../hooks/useGame';
import { rankFor } from '../utils/rank';

const CHAPTER_ICON: Record<string, LucideIcon> = {
  intro: AlertTriangle,
  files: FolderTree,
  filemgmt: Copy,
  permissions: Shield,
  text: Search,
  textproc: Scissors,
  pipes: GitBranch,
  dataflow: Wand2,
  archives: Archive,
  environment: Settings,
  shellscript: FileCode,
  users: Users,
  processes: Cpu,
  network: Globe,
  finale: Flag,
};

export default function LearnPage() {
  const { state } = useGame();
  const navigate = useNavigate();
  const done = state.completed;
  const location = useLocation();
  const stateOpenChapterId = location.state?.openChapterId as string | undefined;

  const [openChapter, setOpenChapter] = useState<number | null>(() => {
    if (stateOpenChapterId) {
      const idx = campaign.findIndex(c => c.id === stateOpenChapterId);
      return idx >= 0 ? idx : null;
    }
    return null;
  });

  if (openChapter != null && campaign[openChapter]?.steps.length) {
    return <CampaignStepView chapter={campaign[openChapter]} onExit={() => setOpenChapter(null)} />;
  }

  const completedSteps = campaign
    .flatMap(c => c.steps)
    .filter(s => done.has(`campaign:${s.id}`)).length;
  const progress =
    totalCampaignSteps > 0 ? Math.round((completedSteps / totalCampaignSteps) * 100) : 0;
  const rank = rankFor(completedSteps, totalCampaignSteps);
  const allDone = completedSteps === totalCampaignSteps && totalCampaignSteps > 0;

  const activeIndex = campaign.findIndex(
    c => c.steps.length > 0 && c.steps.some(s => !done.has(`campaign:${s.id}`))
  );

  const chapterState = (i: number): 'done' | 'active' | 'locked' => {
    const ch = campaign[i];
    const chDone = ch.steps.length > 0 && ch.steps.every(s => done.has(`campaign:${s.id}`));
    if (chDone) return 'done';
    if (i === activeIndex) return 'active';
    return 'locked';
  };

  const healthColor =
    progress >= 100
      ? 'from-terminal-green to-terminal-cyan'
      : progress >= 50
        ? 'from-terminal-yellow to-terminal-green'
        : 'from-terminal-red to-terminal-yellow';

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/3 w-[34rem] h-[34rem] bg-terminal-green/[0.07] rounded-full blur-[150px]" />
      </div>

      <div className="relative">
        {}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-7 mb-8"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.08]" />
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terminal-bg/60 border border-terminal-green/30 text-xs text-terminal-green mb-3 font-mono">
                <Cpu className="w-3.5 h-3.5" /> mission: спаси сервер
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-3">Восстановление сервера</h2>
              <div className="flex items-center justify-between text-xs mb-1.5 max-w-md">
                <span className="inline-flex items-center gap-1.5 text-terminal-dim">
                  <Activity
                    className={`w-3.5 h-3.5 ${progress >= 100 ? 'text-terminal-green' : progress >= 50 ? 'text-terminal-yellow' : 'text-terminal-red'}`}
                  />
                  Здоровье сервера
                </span>
                <span className="font-mono text-terminal-dim">
                  {completedSteps}/{totalCampaignSteps} · {progress}%
                </span>
              </div>
              <div className="h-2.5 max-w-md bg-surface-light rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(progress, 3)}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${healthColor}`}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 lg:flex-col lg:items-end lg:text-right">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-terminal-dim">Звание</div>
                <div className={`text-xl font-bold ${rank.color}`}>{rank.title}</div>
                <div className="text-xs text-terminal-dim">{rank.level}</div>
              </div>
              {!allDone && activeIndex >= 0 && (
                <button
                  onClick={() => setOpenChapter(activeIndex)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terminal-green text-terminal-bg font-bold hover:bg-terminal-green/90 transition-colors whitespace-nowrap"
                >
                  <Play className="w-4 h-4" /> Продолжить
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {}
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden mb-8 rounded-2xl glass-panel border-terminal-green/30 p-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          >
            <div className="pointer-events-none absolute -top-16 right-0 w-64 h-64 bg-terminal-green/10 rounded-full blur-[100px]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">Сервер спасён! 🎉</h3>
                <p className="text-terminal-dim text-sm">
                  Все {totalCampaignSteps} заданий пройдены. Ты достиг звания{' '}
                  <span className={`font-semibold ${rank.color}`}>{rank.title}</span>.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/certificate')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-terminal-green text-terminal-bg font-bold hover:bg-terminal-green/90 transition-colors"
                >
                  <Award className="w-4 h-4" /> Сертификат
                </button>
                <button
                  onClick={() => navigate('/linux')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-surface-light text-white hover:border-accent transition-colors"
                >
                  <Cpu className="w-4 h-4 text-terminal-green" /> Терминал
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {}
        {ACTS.map(act => {
          const chapters = campaign.map((c, i) => ({ c, i })).filter(x => x.c.act === act.n);
          const actSteps = chapters.flatMap(x => x.c.steps);
          const actDone = actSteps.filter(s => done.has(`campaign:${s.id}`)).length;
          const actComplete = actSteps.length > 0 && actDone === actSteps.length;
          return (
            <section key={act.n} className="mb-8">
              <div className="flex items-center gap-3 mb-5 mt-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${actComplete ? 'bg-terminal-green text-terminal-bg shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-surface-light text-terminal-dim'}`}
                >
                  {act.n}
                </div>
                <div>
                  <span className="text-sm font-bold text-white">{act.title}</span>
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-surface-light text-terminal-dim uppercase tracking-wider font-mono">
                    {act.level}
                  </span>
                </div>
                <span className="text-xs text-terminal-dim font-mono ml-auto">
                  {actDone}/{actSteps.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapters.map(({ c, i }) => {
                  const st = chapterState(i);
                  const Icon = CHAPTER_ICON[c.id] ?? FolderTree;
                  const chDone = c.steps.filter(s => done.has(`campaign:${s.id}`)).length;
                  const chPct =
                    c.steps.length > 0 ? Math.round((chDone / c.steps.length) * 100) : 0;
                  const playable = st !== 'locked';
                  return (
                    <motion.button
                      key={c.id}
                      type="button"
                      disabled={!playable}
                      onClick={() => playable && setOpenChapter(i)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className={`relative text-left p-5 rounded-2xl border transition-all group overflow-hidden ${
                        st === 'active'
                          ? 'glass-panel border-accent/50 shadow-[0_8px_25px_rgba(59,130,246,0.2)] hover:shadow-[0_12px_35px_rgba(59,130,246,0.35)] hover:border-accent'
                          : st === 'done'
                            ? 'glass border-terminal-green/30 hover:border-terminal-green/60 hover:shadow-[0_8px_20px_rgba(16,185,129,0.15)]'
                            : 'bg-surface/20 border-surface-light/50 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      {}
                      <div
                        className={`absolute top-0 left-0 right-0 h-0.5 ${
                          st === 'done'
                            ? 'bg-terminal-green'
                            : st === 'active'
                              ? 'bg-accent'
                              : 'bg-surface-light/30'
                        }`}
                      />

                      {}
                      {st === 'active' && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}

                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            st === 'done'
                              ? 'bg-terminal-green/15 text-terminal-green'
                              : st === 'active'
                                ? 'bg-accent/15 text-accent'
                                : 'bg-surface-light text-terminal-dim'
                          }`}
                        >
                          {st === 'done' ? (
                            <Check className="w-5 h-5" />
                          ) : st === 'locked' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-white font-semibold text-sm truncate">{c.title}</h3>
                            {st === 'active' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-mono uppercase tracking-wider shrink-0">
                                live
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-terminal-dim truncate">{c.subtitle}</p>
                        </div>
                      </div>

                      {}
                      <div className="h-1 bg-surface-light/50 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${chPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${st === 'done' ? 'bg-terminal-green' : 'bg-accent'}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-terminal-dim">
                        <span>
                          {chDone}/{c.steps.length} миссий
                        </span>
                        {playable && (
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
