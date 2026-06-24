export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  condition: (state: { completed: Set<string>; xp: number; level: number }) => boolean;
}

const c = (stepId: string) => `campaign:${stepId}`;
const allStepIds = [
  'recon',
  'workspace',
  'gather',
  'lockdown',
  'makeexec',
  'logseed',
  'grepout',
  'pipecount',
  'rogue',
  'netreport',
];

export const achievements: Achievement[] = [
  {
    id: 'first-command',
    title: 'Первый шаг',
    description: 'Выполни первое задание кампании',
    icon: 'Terminal',
    xp: 10,
    condition: ({ completed }) => completed.size >= 1,
  },
  {
    id: 'housekeeper',
    title: 'Наводим порядок',
    description: 'Пройди главу «Файлы и каталоги»',
    icon: 'FolderTree',
    xp: 30,
    condition: ({ completed }) => ['workspace', 'gather'].every(id => completed.has(c(id))),
  },
  {
    id: 'permission-guru',
    title: 'Гуру прав',
    description: 'Пройди главу «chmod и доступ»',
    icon: 'Shield',
    xp: 30,
    condition: ({ completed }) => ['lockdown', 'makeexec'].every(id => completed.has(c(id))),
  },
  {
    id: 'log-hunter',
    title: 'Охотник за логами',
    description: 'Пройди главу «grep и текст»',
    icon: 'FileText',
    xp: 30,
    condition: ({ completed }) => ['logseed', 'grepout'].every(id => completed.has(c(id))),
  },
  {
    id: 'pipe-plumber',
    title: 'Мастер конвейеров',
    description: 'Собери конвейер из команд',
    icon: 'GitBranch',
    xp: 30,
    condition: ({ completed }) => completed.has(c('pipecount')),
  },
  {
    id: 'process-slayer',
    title: 'Укротитель процессов',
    description: 'Заверши чужой процесс сигналом',
    icon: 'Cpu',
    xp: 30,
    condition: ({ completed }) => completed.has(c('rogue')),
  },
  {
    id: 'net-scout',
    title: 'Сетевой разведчик',
    description: 'Сними сетевую конфигурацию сервера',
    icon: 'Globe',
    xp: 25,
    condition: ({ completed }) => completed.has(c('netreport')),
  },
  {
    id: 'server-saved',
    title: 'Сервер спасён',
    description: 'Пройди всю кампанию «Спаси сервер»',
    icon: 'Trophy',
    xp: 100,
    condition: ({ completed }) => allStepIds.every(id => completed.has(c(id))),
  },
  {
    id: 'level-5',
    title: 'Путь линуксоида',
    description: 'Достигни 5 уровня',
    icon: 'Zap',
    xp: 50,
    condition: ({ level }) => level >= 5,
  },
  {
    id: 'level-10',
    title: 'Linux Элита',
    description: 'Достигни 10 уровня',
    icon: 'Crown',
    xp: 100,
    condition: ({ level }) => level >= 10,
  },
];

export function getUnlockedAchievements(
  completed: Set<string>,
  xp: number,
  level: number
): Achievement[] {
  return achievements.filter(a => a.condition({ completed, xp, level }));
}
