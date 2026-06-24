export interface Rank {
  title: string;

  tier: number;

  level: 'Новичок' | 'Средний' | 'Продвинутый';

  color: string;

  blurb: string;
}

const RANKS: Omit<Rank, 'tier'>[] = [
  {
    title: 'Новичок',
    level: 'Новичок',
    color: 'text-terminal-dim',
    blurb: 'Первые шаги в терминале.',
  },
  {
    title: 'Ученик',
    level: 'Новичок',
    color: 'text-terminal-cyan',
    blurb: 'Уверенно создаёшь файлы и ходишь по каталогам.',
  },
  {
    title: 'Оператор',
    level: 'Средний',
    color: 'text-terminal-cyan',
    blurb: 'Права, поиск по тексту, перенаправления — освоено.',
  },
  {
    title: 'Администратор',
    level: 'Средний',
    color: 'text-accent',
    blurb: 'Конвейеры и управление процессами тебе по плечу.',
  },
  {
    title: 'Инженер',
    level: 'Продвинутый',
    color: 'text-terminal-green',
    blurb: 'Сеть, диагностика, почти полный контроль над системой.',
  },
  {
    title: 'Linux-мастер',
    level: 'Продвинутый',
    color: 'text-terminal-green',
    blurb: 'Сервер спасён. Ты уверенно владеешь Linux.',
  },
];

export function rankFor(completed: number, total: number): Rank {
  if (total <= 0) return { ...RANKS[0], tier: 0 };
  if (completed >= total) return { ...RANKS[5], tier: 5 };
  const frac = completed / total;

  const tier = Math.min(4, Math.floor(frac * 5));
  return { ...RANKS[tier], tier };
}
