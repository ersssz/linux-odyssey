import { motion } from 'framer-motion';

interface XpProgressProps {
  xp: number;
  level: number;
}

const XP_PER_LEVEL = 100;

export function XpProgress({ xp, level }: XpProgressProps) {
  const xpInLevel = xp % XP_PER_LEVEL;
  const progress = xpInLevel / XP_PER_LEVEL;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#21262d" strokeWidth="4" />
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#3fb950"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDashoffset }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      <motion.span
        key={level}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="absolute text-xs font-bold text-white"
      >
        {level}
      </motion.span>
    </div>
  );
}
