import type { Variants, Transition } from 'framer-motion';

export const easing = {
  outExpo: [0.16, 1, 0.3, 1] as const,

  outBack: [0.34, 1.56, 0.64, 1] as const,

  inOut: [0.65, 0, 0.35, 1] as const,
};

export const duration = {
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
};

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 24,
  mass: 0.6,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easing.outExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: duration.base, ease: easing.outExpo },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easing.outExpo },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: duration.base, ease: easing.outExpo },
};

export const springHover = {
  whileHover: { scale: 1.02, y: -4, transition: springSoft },
  whileTap: { scale: 0.98, transition: springSoft },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.base, ease: easing.outBack },
  },
};
