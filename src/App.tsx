import { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from './hooks/useGame';
import { Header } from './components/layout/Header';
import { OnboardingModal } from './components/OnboardingModal';
import { CheatSheet } from './components/CheatSheet';
import { CertificateGuard } from './components/RouteGuard';
import { SkipToContent } from './components/SkipToContent';
import { LandingPage } from './pages/LandingPage';
import { AiAssistant } from './components/AiAssistant';
import { soundManager } from './utils/sound';
import { achievements } from './data/achievements';
import { fireConfetti, fireSmallConfetti } from './utils/confetti';
import { pageTransition } from './utils/motion';
import { X, Medal } from 'lucide-react';

const CertificatePage = lazy(() => import('./pages/CertificatePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FhsMapPage = lazy(() => import('./pages/FhsMapPage'));
const RealLinuxPage = lazy(() => import('./pages/RealLinuxPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const { state } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingCompleted =
    typeof window !== 'undefined' &&
    localStorage.getItem('linux-odyssey-onboarding') === 'completed';
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const prevUnlockedRef = useRef(new Set(state.unlockedAchievements));
  const prevLevelRef = useRef(state.level);

  useEffect(() => {
    const newlyUnlocked = achievements.filter(
      a => state.unlockedAchievements.has(a.id) && !prevUnlockedRef.current.has(a.id)
    );
    if (newlyUnlocked.length > 0) {
      const latest = newlyUnlocked[newlyUnlocked.length - 1];
      setNewAchievement(latest.id);
      soundManager.playUnlock();
      fireSmallConfetti();
      setTimeout(() => setNewAchievement(null), 4000);
    }
    prevUnlockedRef.current = new Set(state.unlockedAchievements);
  }, [state.unlockedAchievements]);

  useEffect(() => {
    if (state.level > prevLevelRef.current) {
      setLevelUp(state.level);
      soundManager.playLevelUp();
      fireConfetti();
      setTimeout(() => setLevelUp(null), 4000);
    }
    prevLevelRef.current = state.level;
  }, [state.level]);

  const handleStart = useCallback(() => {
    if (!onboardingCompleted) {
      setShowOnboarding(true);
      return;
    }
    navigate('/learn');
  }, [navigate, onboardingCompleted]);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('linux-odyssey-onboarding', 'completed');
    setShowOnboarding(false);
    navigate('/learn');
  }, [navigate]);

  const handleOnboardingSkip = useCallback(() => {
    localStorage.setItem('linux-odyssey-onboarding', 'completed');
    setShowOnboarding(false);
  }, []);

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text flex flex-col bg-grid">
      <SkipToContent />

      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
      )}

      <Header onCheatSheetOpen={() => setCheatSheetOpen(true)} />

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {newAchievement && achievements.find(a => a.id === newAchievement)?.title}
        {levelUp && `Ты достиг уровня ${levelUp}`}
      </div>

      <CheatSheet isOpen={cheatSheetOpen} onClose={() => setCheatSheetOpen(false)} />

      {}
      <AnimatePresence>
        {newAchievement && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[100] bg-surface border border-terminal-yellow/50 rounded-xl p-4 shadow-2xl flex items-center gap-3 min-w-[320px]"
          >
            <div className="w-10 h-10 rounded-full bg-terminal-yellow flex items-center justify-center text-terminal-bg">
              <Medal className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-terminal-yellow font-semibold uppercase tracking-wide">
                Ачивка разблокирована!
              </div>
              <div className="text-white font-semibold">
                {achievements.find(a => a.id === newAchievement)?.title}
              </div>
              <div className="text-xs text-terminal-dim">
                {achievements.find(a => a.id === newAchievement)?.description}
              </div>
            </div>
            <button
              onClick={() => setNewAchievement(null)}
              className="text-terminal-dim hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-terminal-yellow to-terminal-green text-terminal-bg rounded-xl p-5 shadow-2xl flex items-center gap-4 min-w-[300px]"
          >
            <div className="text-4xl">🎉</div>
            <div className="flex-1">
              <div className="text-sm font-bold uppercase tracking-wide opacity-80">Level Up!</div>
              <div className="text-xl font-extrabold">Ты достиг уровня {levelUp}</div>
            </div>
            <button onClick={() => setLevelUp(null)} className="opacity-70 hover:opacity-100">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 py-6" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-[3px] border-terminal-green/30 border-t-terminal-green rounded-full animate-spin" />
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-terminal-green/20 blur-lg animate-pulse" />
              </div>
              <div className="text-terminal-dim font-mono text-sm">
                <span className="text-terminal-green">penguin@linux-odyssey</span>
                <span className="text-terminal-dim">:~$</span> loading modules...
              </div>
            </div>
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <PageTransition>
                    <LandingPage onStart={handleStart} />
                  </PageTransition>
                }
              />
              <Route
                path="/certificate"
                element={
                  <PageTransition>
                    <CertificateGuard>
                      <CertificatePage />
                    </CertificateGuard>
                  </PageTransition>
                }
              />
              <Route
                path="/profile"
                element={
                  <PageTransition>
                    <ProfilePage />
                  </PageTransition>
                }
              />
              <Route
                path="/fs-map"
                element={
                  <PageTransition>
                    <FhsMapPage />
                  </PageTransition>
                }
              />
              <Route
                path="/linux"
                element={
                  <PageTransition>
                    <RealLinuxPage />
                  </PageTransition>
                }
              />
              <Route
                path="/learn"
                element={
                  <PageTransition>
                    <LearnPage />
                  </PageTransition>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      <AiAssistant />
    </div>
  );
}
