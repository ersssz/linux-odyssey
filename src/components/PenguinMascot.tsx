import { motion, AnimatePresence } from 'framer-motion';

type PenguinMood = 'idle' | 'happy' | 'sad' | 'excited' | 'thinking';

interface PenguinMascotProps {
  mood?: PenguinMood;
  size?: number;
}

const messages: Record<PenguinMood, string> = {
  idle: 'Жду команду...',
  happy: 'Отлично!',
  sad: 'Что-то пошло не так',
  excited: 'Уровень пройден!',
  thinking: 'Думаю...',
};

const eyeVariants: Record<PenguinMood, { left: string; right: string }> = {
  idle: { left: '•', right: '•' },
  happy: { left: '^', right: '^' },
  sad: { left: '•', right: '•' },
  excited: { left: '✦', right: '✦' },
  thinking: { left: '•', right: '•' },
};

export function PenguinMascot({ mood = 'idle', size = 48 }: PenguinMascotProps) {
  const eyes = eyeVariants[mood];
  const isExcited = mood === 'excited';
  const isSad = mood === 'sad';
  const isThinking = mood === 'thinking';

  return (
    <div className="flex items-center gap-3 select-none" aria-live="polite" aria-atomic="true">
      <motion.div
        animate={{
          y: isExcited ? [0, -10, 0] : isThinking ? [0, -3, 0] : 0,
          rotate: isSad ? [0, -5, 0] : 0,
        }}
        transition={{
          duration: isExcited ? 0.5 : 1.5,
          repeat: isExcited ? 2 : Infinity,
          ease: 'easeInOut',
        }}
        style={{ width: size, height: size }}
        className="relative"
      >
        <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
          {}
          <ellipse cx="32" cy="36" rx="22" ry="26" fill="#1f2937" />
          {}
          <ellipse cx="32" cy="40" rx="14" ry="18" fill="#f3f4f6" />
          {}
          <ellipse cx="11" cy="34" rx="6" ry="14" fill="#1f2937" transform="rotate(20 11 34)" />
          {}
          <ellipse cx="53" cy="34" rx="6" ry="14" fill="#1f2937" transform="rotate(-20 53 34)" />
          {}
          <ellipse cx="24" cy="60" rx="6" ry="3" fill="#f59e0b" />
          <ellipse cx="40" cy="60" rx="6" ry="3" fill="#f59e0b" />
          {}
          <polygon points="28,26 36,26 32,34" fill="#f59e0b" />
          {}
          <circle cx="25" cy="22" r="5" fill="white" />
          <circle cx="39" cy="22" r="5" fill="white" />
          {}
          <text x="25" y="25" textAnchor="middle" fontSize="8" fill="#1f2937" fontWeight="bold">
            {eyes.left}
          </text>
          <text x="39" y="25" textAnchor="middle" fontSize="8" fill="#1f2937" fontWeight="bold">
            {eyes.right}
          </text>
          {}
          {(mood === 'happy' || mood === 'excited') && (
            <>
              <circle cx="20" cy="32" r="3" fill="#f472b6" opacity="0.6" />
              <circle cx="44" cy="32" r="3" fill="#f472b6" opacity="0.6" />
            </>
          )}
          {}
          {isExcited && (
            <>
              <motion.path
                d="M8 8 L10 14 L16 16 L10 18 L8 24 L6 18 L0 16 L6 14 Z"
                fill="#facc15"
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.path
                d="M56 4 L58 10 L64 12 L58 14 L56 20 L54 14 L48 12 L54 10 Z"
                fill="#facc15"
                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
              />
            </>
          )}
        </svg>
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span
          key={mood}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-terminal-dim font-mono hidden sm:inline"
        >
          {messages[mood]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
