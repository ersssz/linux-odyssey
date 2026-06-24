import confetti from 'canvas-confetti';

export function fireConfetti() {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: ReturnType<typeof setInterval> = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#3fb950', '#56d4dd', '#a371f7', '#d29922', '#f85149'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#3fb950', '#56d4dd', '#a371f7', '#d29922', '#f85149'],
    });
  }, 250);
}

export function fireSmallConfetti() {
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#3fb950', '#56d4dd', '#a371f7'],
  });
}
