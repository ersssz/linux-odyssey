import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useGame } from '../hooks/useGame';
import { achievements } from '../data/achievements';
import { campaign, totalCampaignSteps, stepKey, isCampaignComplete } from '../data/campaign';
import { rankFor } from '../utils/rank';
import { Award, BookOpen, Map, Pencil, Check, Star, Target, Trophy, Zap } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { state, setName } = useGame();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.name);

  const allSteps = campaign.flatMap(c => c.steps);
  const completedSteps = allSteps.filter(s => state.completed.has(stepKey(s.id))).length;
  const rank = rankFor(completedSteps, totalCampaignSteps);
  const displayName = state.name.trim() || 'Безымянный админ';

  const saveName = () => {
    setName(draft.trim());
    setEditing(false);
  };
  const chaptersWithSteps = campaign.filter(ch => ch.steps.length > 0);
  const completedChapters = chaptersWithSteps.filter(ch =>
    ch.steps.every(s => state.completed.has(stepKey(s.id)))
  ).length;
  const totalChapters = chaptersWithSteps.length;
  const totalAchievements = achievements.length;
  const unlockedAchievements = state.unlockedAchievements.size;
  const campaignProgress =
    totalCampaignSteps > 0 ? Math.round((completedSteps / totalCampaignSteps) * 100) : 0;
  const complete = isCampaignComplete(state.completed);

  const displayXp = complete ? 4000 : Math.floor(state.xp / 100) * 100;

  const stats = [
    { icon: BookOpen, label: 'Миссий', value: `${completedSteps}/${totalCampaignSteps}` },
    { icon: Map, label: 'Секторов', value: `${completedChapters}/${totalChapters}` },
    { icon: Trophy, label: 'Достижений', value: `${unlockedAchievements}/${totalAchievements}` },
    { icon: Zap, label: 'Уровень', value: state.level },
    { icon: Star, label: 'Опыт (XP)', value: displayXp },
    { icon: Target, label: 'Прогресс', value: `${campaignProgress}%` },
  ];

  const skillXP = { fs: 0, network: 0, sec: 0, shell: 0 };
  const skillMaxXP = { fs: 0, network: 0, sec: 0, shell: 0 };
  campaign.forEach(ch => {
    ch.steps.forEach(s => {
      skillMaxXP[ch.skillCategory] += s.xp;
      if (state.completed.has(stepKey(s.id))) {
        skillXP[ch.skillCategory] += s.xp;
      }
    });
  });

  const skills = [
    {
      name: 'Файловые операции',
      xp: skillXP.fs,
      max: skillMaxXP.fs || 1, // Fallback to avoid division by zero
      color: 'from-terminal-green to-emerald-500',
      shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    },
    {
      name: 'Сеть и Инфраструктура',
      xp: skillXP.network,
      max: skillMaxXP.network || 1,
      color: 'from-accent to-blue-500',
      shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    },
    {
      name: 'Администрирование и Безопасность',
      xp: skillXP.sec,
      max: skillMaxXP.sec || 1,
      color: 'from-terminal-yellow to-orange-500',
      shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.4)]',
    },
    {
      name: 'Shell и Утилиты',
      xp: skillXP.shell,
      max: skillMaxXP.shell || 1,
      color: 'from-purple-500 to-pink-500',
      shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/learn')}
          className="text-sm text-terminal-dim hover:text-white transition-colors"
        >
          ← Назад к кампании
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 p-6 rounded-xl bg-surface border border-surface-light flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-terminal-green to-terminal-cyan flex items-center justify-center text-terminal-bg font-bold mb-4">
            <span className="text-4xl">🐧</span>
          </div>

          {editing ? (
            <div className="flex items-center gap-2 mb-1 w-full max-w-[220px]">
              <input
                value={draft}
                autoFocus
                onChange={e => setDraft(e.target.value.slice(0, 24))}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Твоё имя"
                className="flex-1 min-w-0 bg-terminal-bg border border-surface-light rounded-lg px-3 py-1.5 text-white text-center outline-none focus:border-accent"
                aria-label="Изменить имя"
              />
              <button
                onClick={saveName}
                className="p-2 rounded-lg bg-terminal-green text-terminal-bg shrink-0"
                aria-label="Сохранить имя"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setDraft(state.name);
                setEditing(true);
              }}
              className="group inline-flex items-center gap-2 mb-1"
              aria-label="Изменить имя"
            >
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>
              <Pencil className="w-4 h-4 text-terminal-dim group-hover:text-white transition-colors" />
            </button>
          )}

          <p className={`text-sm mb-4 font-medium ${rank.color}`}>
            {rank.title} · {rank.level}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terminal-yellow/10 text-terminal-yellow text-sm">
            <Award className="w-4 h-4" />
            Level {state.level}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 rounded-xl bg-surface border border-surface-light flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-surface-light flex items-center justify-center text-terminal-green">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-terminal-dim">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {}
        <div className="p-6 rounded-2xl glass-panel border border-surface-light relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-xl font-bold text-white">Прогресс кампании «Спаси сервер»</h3>
            <span className="text-2xl font-bold text-terminal-green drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              {campaignProgress}%
            </span>
          </div>
          <div className="h-4 bg-surface/50 rounded-full overflow-hidden mb-2 relative z-10 border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${campaignProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-terminal-green to-terminal-cyan shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            />
          </div>
          {complete && (
            <button
              onClick={() => navigate('/certificate')}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terminal-yellow text-terminal-bg font-bold hover:bg-yellow-400 transition-colors shadow-[0_0_20px_rgba(234,179,8,0.3)] relative z-10"
            >
              <Award className="w-5 h-5" /> Получить сертификат
            </button>
          )}
        </div>

        {}
        <div className="p-6 rounded-2xl glass-panel border border-surface-light relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />
          <h3 className="text-xl font-bold text-white mb-6 relative z-10">Профиль Навыков</h3>
          <div className="space-y-4 relative z-10">
            {skills.map((skill, i) => {
              const pct = Math.min(100, (skill.xp / skill.max) * 100);
              return (
                <div key={skill.name}>
                  <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wider text-terminal-dim">
                    <span>{skill.name}</span>
                    <span className="text-white">
                      {skill.xp}{' '}
                      <span className="text-terminal-dim font-normal">/ {skill.max} XP</span>
                    </span>
                  </div>
                  <div className="h-2 bg-surface/50 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${skill.color} ${skill.shadow}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 p-6 rounded-2xl glass-panel border border-surface-light relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none" />
        <h3 className="text-xl font-bold text-white mb-6 relative z-10">Достижения (Ачивки)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {achievements.map(achievement => {
            const unlocked = state.unlockedAchievements.has(achievement.id);
            return (
              <div
                key={achievement.id}
                className={`p-5 rounded-xl border transition-all ${
                  unlocked
                    ? 'bg-terminal-green/10 border-terminal-green/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'bg-surface-light/30 border-surface-light/50 opacity-40 grayscale'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${unlocked ? 'bg-terminal-green text-terminal-bg' : 'bg-surface text-terminal-dim'}`}
                  >
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-white flex-1 leading-tight">
                    {achievement.title}
                  </div>
                </div>
                <div className="text-[11px] text-terminal-dim mb-3 leading-relaxed min-h-[34px]">
                  {achievement.description}
                </div>
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider ${unlocked ? 'text-terminal-green' : 'text-terminal-dim'}`}
                >
                  +{achievement.xp} XP
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
