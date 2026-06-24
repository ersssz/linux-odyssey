import { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router';
import { useGame } from '../../hooks/useGame';
import { XpProgress } from '../XpProgress';
import { soundManager } from '../../utils/sound';
import { campaign, totalCampaignSteps, stepKey, isCampaignComplete } from '../../data/campaign';
import { achievements } from '../../data/achievements';
import { rankFor } from '../../utils/rank';
import {
  BookOpen,
  Cpu,
  Crown,
  FolderTree,
  Menu,
  Star,
  Target,
  TerminalSquare,
  Trophy,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

interface HeaderProps {
  onCheatSheetOpen: () => void;
}

export function Header({ onCheatSheetOpen }: HeaderProps) {
  const { state } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCompleted = campaign
    .flatMap(c => c.steps)
    .filter(s => state.completed.has(stepKey(s.id))).length;
  const totalLessons = totalCampaignSteps;
  const totalAchievements = achievements.length;
  const unlockedAchievements = state.unlockedAchievements.size;
  const rank = rankFor(totalCompleted, totalCampaignSteps);

  const toggleSound = () => {
    const newState = !soundEnabled;
    soundManager.setEnabled(newState);
    setSoundEnabled(newState);
  };

  const navItems = [
    { to: '/learn', label: 'Кампания', icon: Target },
    { to: '/linux', label: 'Терминал', icon: Cpu },
    { to: '/fs-map', label: 'Карта системы', icon: FolderTree },
    { to: '/profile', label: 'Профиль', icon: User },
  ];

  const currentPath = location.pathname;
  const isHome = currentPath === '/';
  const showBack = !isHome && !currentPath.startsWith('/learn');

  const handleBack = () => {
    if (currentPath === '/certificate') navigate('/learn');
    else navigate(-1);
  };

  return (
    <header className="border-b border-white/5 bg-[#05080f]/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NavLink
            to="/"
            aria-label="Linux Odyssey, на главную"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-terminal-green to-terminal-cyan flex items-center justify-center text-terminal-bg font-bold">
              <TerminalSquare className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white leading-tight">Linux Odyssey</h1>
              <p className="text-xs text-terminal-dim">Gamified Linux Learning</p>
            </div>
          </NavLink>

          {showBack && (
            <button
              onClick={handleBack}
              className="hidden sm:flex items-center gap-1 text-xs text-terminal-dim hover:text-white transition-colors ml-4"
            >
              ← Назад
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div
            className="flex items-center gap-3 px-3 py-1.5 bg-surface-light/30 rounded-lg border border-white/5"
            aria-label={`Прогресс: ${isCampaignComplete(state.completed) ? 4000 : Math.floor(state.xp / 100) * 100} XP, уровень ${state.level}`}
          >
            <XpProgress xp={state.xp} level={state.level} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {isCampaignComplete(state.completed) ? 4000 : Math.floor(state.xp / 100) * 100} XP
              </span>
              <span className="text-[10px] text-terminal-dim tracking-widest uppercase">
                {rank.title}
              </span>
            </div>
          </div>

          <div
            className="hidden md:flex items-center gap-2"
            aria-label={`Ачивки: ${unlockedAchievements} из ${totalAchievements}`}
          >
            <Trophy className="w-4 h-4 text-terminal-yellow" aria-hidden="true" />
            <span className="text-sm">
              {unlockedAchievements}/{totalAchievements}
            </span>
          </div>

          <div
            className="hidden md:flex items-center gap-2"
            aria-label={`Уроки: ${totalCompleted} из ${totalLessons}`}
          >
            <Star className="w-4 h-4 text-terminal-yellow" aria-hidden="true" />
            <span className="text-sm">
              {totalCompleted}/{totalLessons}
            </span>
          </div>

          <button
            onClick={onCheatSheetOpen}
            className="p-2 rounded-lg bg-surface-light text-terminal-dim hover:text-white transition-colors"
            aria-label="Справочник команд"
            title="Справочник команд"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-surface-light text-terminal-dim hover:text-white transition-colors"
            aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
            title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg bg-surface-light text-terminal-dim hover:text-white transition-colors"
            aria-label="Открыть меню"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <nav aria-label="Основная навигация" className="hidden sm:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'text-terminal-dim hover:text-white hover:bg-surface-light'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden lg:inline">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {}
      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Мобильная навигация"
          className="sm:hidden border-t border-surface-light bg-surface px-4 py-3"
        >
          <div className="flex flex-col gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-terminal-dim hover:text-white hover:bg-surface-light'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-terminal-dim">
              <Crown className="w-4 h-4 text-terminal-yellow" aria-hidden="true" />
              Level {state.level} · {state.xp} XP
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
