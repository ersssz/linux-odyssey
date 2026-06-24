import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import {
  ChevronRight,
  ChevronLeft,
  Cpu,
  Eye,
  MousePointerClick,
  Sparkles,
  X,
  Rocket,
  Target,
} from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: 'Добро пожаловать в Linux Odyssey',
    description:
      'Это не учебник, а живой тренажёр. Никаких скучных лекций — ты осваиваешь Linux на практике, а результат каждой команды видно вживую.',
    color: 'from-terminal-green to-terminal-cyan',
  },
  {
    icon: Cpu,
    title: 'Настоящий Linux в браузере',
    description:
      'Под капотом — реальное ядро Linux, загруженное прямо в браузере. Настоящий bash, реальные grep, chmod, процессы из /proc. Это не симуляция.',
    color: 'from-terminal-green to-terminal-cyan',
  },
  {
    icon: Eye,
    title: 'Команды видно',
    description:
      'Каждое действие оживает в большой схеме: файлы появляются плитками, биты прав загораются, чужой процесс исчезает от сигнала. Ты не читаешь про Linux — ты его видишь.',
    color: 'from-terminal-cyan to-accent',
  },
  {
    icon: MousePointerClick,
    title: 'Мышью, без зубрёжки',
    description:
      'Собирай команды кликами по блокам, меняй права кликом по ячейке, редактируй файлы в удобной панели. Готов печатать сам — настоящий терминал всегда рядом.',
    color: 'from-terminal-purple to-terminal-cyan',
  },
  {
    icon: Rocket,
    title: 'Миссия: спаси сервер',
    description:
      'Ночью прод-сервер взломали. Пройди сюжет от первого входа до восстановления сети — от базовых команд к продвинутым. Начинаем с разведки.',
    color: 'from-terminal-green to-terminal-yellow',
  },
];

export function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const { state, setName } = useGame();
  const [nick, setNick] = useState(state.name);

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const isLast = step === steps.length - 1;

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      if (nick.trim()) setName(nick.trim());
      onComplete();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-surface border border-surface-light rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <button
          onClick={onSkip}
          aria-label="Пропустить обучение"
          className="absolute top-4 right-4 text-terminal-dim hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-light" aria-hidden="true">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-gradient-to-r from-terminal-green to-terminal-cyan"
          />
        </div>

        {}
        <div className="min-h-[260px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex justify-center mb-6">
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center text-white shadow-lg`}
                >
                  <Icon className="w-10 h-10" aria-hidden="true" />
                </div>
              </div>

              <h2 id="onboarding-title" className="text-2xl font-bold text-white text-center mb-3">
                {currentStep.title}
              </h2>
              <p className="text-terminal-dim text-center leading-relaxed">
                {currentStep.description}
              </p>
              {isLast && (
                <div className="mt-5 max-w-xs mx-auto">
                  <label className="block text-xs text-terminal-dim mb-1.5 text-center">
                    Как тебя называть? (необязательно)
                  </label>
                  <input
                    value={nick}
                    onChange={e => setNick(e.target.value.slice(0, 24))}
                    onKeyDown={e => e.key === 'Enter' && next()}
                    placeholder="например, penguin"
                    className="w-full text-center bg-terminal-bg border border-surface-light rounded-lg px-3 py-2 text-white outline-none focus:border-accent transition-colors"
                    aria-label="Ваше имя"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {}
        <div
          className="flex justify-center gap-2 my-6"
          aria-label={`Шаг ${step + 1} из ${steps.length}`}
        >
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-terminal-green'
                  : 'w-2.5 bg-surface-light hover:bg-terminal-dim'
              }`}
              aria-label={`Перейти к шагу ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${
              step === 0
                ? 'text-terminal-dim/50 cursor-not-allowed'
                : 'text-terminal-dim hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>

          <button
            onClick={next}
            className={`group flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-colors ${
              isLast
                ? 'bg-terminal-green text-terminal-bg hover:bg-terminal-green/90'
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            {isLast ? (
              <>
                <Target className="w-4 h-4" />
                Начать первую миссию
              </>
            ) : (
              <>
                Дальше
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
