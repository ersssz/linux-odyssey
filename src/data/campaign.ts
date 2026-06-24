import type { Snapshot } from '../engine/snapshot';
import type { FileNode } from '../utils/fileSystem';

export type VizKind = 'filesystem' | 'permissions' | 'pipe' | 'process' | 'none';

export interface CampaignStep {
  id: string;
  title: string;
  story: string;
  goal: string;
  concept?: string;
  hint?: string;
  xp: number;
  viz: VizKind;
  vizTarget?: string;
  vizGoal?: string;
  builder?: string[];
  realOnly?: boolean;
  setup?: string;
  arm?: (snap: Snapshot) => boolean;
  check?: (snap: Snapshot) => boolean;
  verify?: { file: string; ok: (text: string) => boolean };
}

export interface CampaignChapter {
  skillCategory: 'fs' | 'network' | 'sec' | 'shell';
  id: string;
  title: string;
  subtitle: string;
  intro: string;
  act: number;
  steps: CampaignStep[];
}

export const ACTS: { n: number; title: string; level: string }[] = [
  { n: 1, title: 'Сектор 1: Файловая Система', level: 'Уровень допуска 1' },
  { n: 2, title: 'Сектор 2: Безопасность и Доступ', level: 'Уровень допуска 2' },
  { n: 3, title: 'Сектор 3: Аналитика Текста', level: 'Уровень допуска 3' },
  { n: 4, title: 'Сектор 4: Потоки Данных и Архивы', level: 'Уровень допуска 4' },
  { n: 5, title: 'Сектор 5: Системный Администратор', level: 'Уровень допуска 5' },
  { n: 6, title: 'Сектор 6: Сетевой Сталкер', level: 'Уровень допуска 6' },
];

function findNode(snap: Snapshot, relPath: string): FileNode | null {
  const parts = relPath.split('/').filter(Boolean);
  let cur: FileNode = snap.fs;
  for (const part of parts) {
    const next = cur.children?.find(c => c.name === part);
    if (!next) return null;
    cur = next;
  }
  return cur;
}

function isFile(snap: Snapshot, relPath: string): boolean {
  const n = findNode(snap, relPath);
  return n != null && n.type !== 'dir';
}

function fileBytes(snap: Snapshot, relPath: string): number | null {
  const n = findNode(snap, relPath);
  if (!n || n.type === 'dir') return null;
  if (typeof n.size === 'number') return n.size;
  if (typeof n.content === 'string') return n.content.length;
  return null;
}

function isNonEmptyFile(snap: Snapshot, relPath: string): boolean {
  const b = fileBytes(snap, relPath);
  return b != null && b > 0;
}

function isDir(snap: Snapshot, relPath: string): boolean {
  return findNode(snap, relPath)?.type === 'dir';
}

function isExecutable(snap: Snapshot, relPath: string): boolean {
  const n = findNode(snap, relPath);
  if (!n) return false;
  return n.type === 'exec' || n.permissions?.[3] === 'x';
}

function permBitsAre(snap: Snapshot, relPath: string, expected: string): boolean {
  const perms = findNode(snap, relPath)?.permissions;
  return !!perms && perms.length >= 10 && perms.slice(1, 10) === expected;
}

export const campaign: CampaignChapter[] = [
  {
    id: 'intro',
    skillCategory: 'shell',
    title: 'Тревога: сервер не отвечает',
    subtitle: 'Первый вход',
    intro:
      'Ты — новый админ. Ночью прод-сервер слёг. Тебя пустили к настоящему Linux. Осмотрись и закрепись.',
    act: 1,
    steps: [
      {
        id: 'recon',
        title: 'Закрепись на сервере',
        story:
          'Ты впервые в чужой системе. Сначала пойми, где ты находишься, осмотрись — и заведи журнал, куда будешь записывать ход расследования.',
        goal: 'Осмотрись в системе и заведи в своём домашнем каталоге файл journal.txt.',
        hint: 'pwd  ·  ls -la  ·  touch journal.txt',
        xp: 30,
        viz: 'filesystem',
        builder: ['pwd', 'ls', '-la', 'touch', 'journal.txt'],
        check: snap => isFile(snap, 'journal.txt'),
      },
    ],
  },
  {
    id: 'files',
    skillCategory: 'fs',
    title: 'Наводим порядок',
    subtitle: 'Файлы и каталоги',
    intro: 'Логи разбросаны, рабочих папок нет. Создай структуру, чтобы разобрать инцидент.',
    act: 1,
    steps: [
      {
        id: 'workspace',
        title: 'Рабочее место',
        story: 'Заведи отдельную папку под расследование и положи в неё файл для заметок.',
        goal: 'Создай каталог incident, а внутри него — файл notes.txt.',
        hint: 'mkdir incident  ·  touch incident/notes.txt',
        xp: 40,
        viz: 'filesystem',
        builder: ['mkdir', 'touch', 'incident', 'incident/notes.txt'],
        check: snap => isDir(snap, 'incident') && isFile(snap, 'incident/notes.txt'),
      },
      {
        id: 'gather',
        title: 'Собери улики',
        story:
          'Подозрительные записи раскиданы по системе. Собери их копии рядом — заведи три файла-улики в папке расследования.',
        goal: 'Создай в incident три файла: a.log, b.log и c.log.',
        hint: 'cd incident  ·  touch a.log b.log c.log',
        xp: 40,
        viz: 'filesystem',
        builder: ['cd', 'touch', 'incident', 'a.log', 'b.log', 'c.log'],
        check: snap =>
          isFile(snap, 'incident/a.log') &&
          isFile(snap, 'incident/b.log') &&
          isFile(snap, 'incident/c.log'),
      },
      {
        id: 'hidden',
        title: 'Спрячь конфиг',
        story:
          'Конфиги в Linux часто скрытые — их имя начинается с точки, и обычный ls их не показывает. Заведи скрытый файл настроек.',
        goal: 'Создай скрытый файл .env в домашнем каталоге.',
        hint: 'touch .env  ·  потом ls -a',
        xp: 40,
        viz: 'filesystem',
        builder: ['touch', '.env', 'ls', '-a'],
        check: snap => isFile(snap, '.env'),
      },
      {
        id: 'nested',
        title: 'Глубокая структура',
        story:
          'Логи удобно раскладывать по годам и месяцам. Создай вложенную структуру каталогов одной командой — флаг -p создаёт все промежуточные папки.',
        goal: 'Создай вложенные каталоги logs/2026/06 одной командой.',
        hint: 'mkdir -p logs/2026/06',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        builder: ['mkdir', '-p', 'logs/2026/06'],
        check: snap => isDir(snap, 'logs/2026/06'),
      },
    ],
  },
  {
    id: 'filemgmt',
    skillCategory: 'fs',
    title: 'Разбор завалов',
    subtitle: 'Копирование, переименование, уборка, навигация',
    intro:
      'Файлов стало много, среди них есть важные и мусорные. Наведи порядок: делай копии, переименовывай, убирай лишнее и научись ходить по каталогам.',
    act: 1,
    steps: [
      {
        id: 'backup',
        title: 'Сделай резервную копию',
        story:
          'Прежде чем что-то менять — подстрахуйся. Заведи отчёт report.txt и сними с него резервную копию report.bak, чтобы оригинал точно не потерять.',
        goal: 'Создай report.txt и сделай его копию report.bak.',
        hint: 'touch report.txt  ·  cp report.txt report.bak',
        xp: 40,
        viz: 'filesystem',
        builder: ['touch', 'report.txt', 'cp', 'report.bak'],
        check: snap => isFile(snap, 'report.txt') && isFile(snap, 'report.bak'),
      },
      {
        id: 'rename',
        title: 'Дай файлу нормальное имя',
        story: 'Заведи черновик draft.txt и финализируй его — переименуй в final.txt.',
        goal: 'Создай draft.txt и переименуй его в final.txt.',
        hint: 'touch draft.txt  ·  mv draft.txt final.txt',
        xp: 40,
        viz: 'filesystem',
        builder: ['touch', 'draft.txt', 'mv', 'final.txt'],
        check: snap => isFile(snap, 'final.txt') && !isFile(snap, 'draft.txt'),
      },
      {
        id: 'cleanup',
        title: 'Убери за собой',
        story:
          'Временные файлы засоряют систему. Заведи рабочий keep.txt и мусорный junk.tmp, а потом удали только мусор.',
        goal: 'Создай keep.txt и junk.tmp, затем удали junk.tmp.',
        hint: 'touch keep.txt junk.tmp  ·  rm junk.tmp',
        xp: 40,
        viz: 'filesystem',
        builder: ['touch', 'keep.txt', 'junk.tmp', 'rm'],
        check: snap => isFile(snap, 'keep.txt') && !isFile(snap, 'junk.tmp'),
      },
      {
        id: 'navigate',
        title: 'Научись перемещаться',
        story:
          'В Linux ты постоянно ходишь по каталогам. Заведи папку vault и зайди в неё — посмотри, как панель справа следует за тобой.',
        goal: 'Создай каталог vault и перейди в него.',
        hint: 'mkdir vault  ·  cd vault',
        xp: 40,
        viz: 'filesystem',
        builder: ['mkdir', 'vault', 'cd'],
        check: snap => /(^|\/)vault$/.test(snap.cwd),
      },
      {
        id: 'copytree',
        title: 'Скопируй каталог целиком',
        story:
          'Нужна резервная копия всей папки расследования. Каталог data уже создан. Обычный cp копирует только файлы — для каталога нужен флаг -r (рекурсивно).',
        goal: 'Скопируй каталог data целиком в data-backup (cp -r).',
        hint: 'cp -r data data-backup',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        setup: 'mkdir -p data && touch data/a.txt',
        check: snap => isDir(snap, 'data-backup') && isFile(snap, 'data-backup/a.txt'),
      },
      {
        id: 'symlink',
        title: 'Сделай ярлык',
        story:
          'Символическая ссылка — это ярлык на другой файл. Создай быстрый доступ к журналу, не копируя его.',
        goal: 'Создай journal.txt и символическую ссылку jlink на него (ln -s).',
        hint: 'touch journal.txt  ·  ln -s journal.txt jlink',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        builder: ['touch', 'journal.txt', 'ln', '-s', 'jlink'],
        check: snap => isFile(snap, 'jlink'),
      },
    ],
  },
  {
    id: 'permissions',
    skillCategory: 'sec',
    title: 'Кто-то трогал права',
    subtitle: 'chmod и доступ',
    intro: 'Злоумышленник менял права на файлах. Восстанови корректный доступ.',
    act: 2,
    steps: [
      {
        id: 'lockdown',
        title: 'Закрой секрет',
        story: 'Файл с ключами оказался открыт всем. Он должен быть доступен только владельцу.',
        goal: 'Создай secret.key и выставь права 600 (rw-------).',
        concept:
          'Права на файл меняет одна команда из трёх букв. Нужны права «только владелец читает и пишет» — вспомни восьмеричную запись для этого.',
        hint: 'touch secret.key  ·  chmod 600 secret.key',
        xp: 60,
        viz: 'permissions',
        vizTarget: 'secret.key',
        vizGoal: 'rw-------',
        builder: ['touch', 'chmod', '600', 'secret.key'],
        check: snap => isFile(snap, 'secret.key') && permBitsAre(snap, 'secret.key', 'rw-------'),
      },
      {
        id: 'makeexec',
        title: 'Верни скрипт к жизни',
        story:
          'Скрипт восстановления есть, но он потерял право на запуск — система отказывается его выполнять.',
        goal: 'Создай restore.sh и сделай его исполняемым.',
        concept:
          'Скрипт не запускается без бита «исполняемый». Та же команда смены прав, но добавь право на выполнение.',
        hint: 'touch restore.sh  ·  chmod +x restore.sh',
        xp: 50,
        viz: 'permissions',
        vizTarget: 'restore.sh',
        builder: ['touch', 'chmod', '+x', 'restore.sh'],
        check: snap => isExecutable(snap, 'restore.sh'),
      },
      {
        id: 'open755',
        title: 'Открой папку наружу',
        story:
          'Веб-каталог должен быть доступен на чтение и вход всем, но менять — только владельцу. Это классические права 755 (rwxr-xr-x).',
        goal: 'Создай каталог public и выставь ему права 755.',
        concept:
          'Каталог должен быть открыт всем на чтение и вход, но менять — только владельцу. Подумай, какое восьмеричное число это даёт.',
        hint: 'mkdir public  ·  chmod 755 public',
        xp: 60,
        viz: 'permissions',
        vizTarget: 'public',
        vizGoal: 'rwxr-xr-x',
        realOnly: true,
        builder: ['mkdir', 'chmod', '755', 'public'],
        check: snap => isDir(snap, 'public') && permBitsAre(snap, 'public', 'rwxr-xr-x'),
      },
      {
        id: 'readonly',
        title: 'Только для чтения',
        story:
          'Важный файл нельзя случайно перезаписать. Сделай его доступным только на чтение для всех — права 444 (r--r--r--).',
        goal: 'Создай notice.txt и выставь права 444.',
        concept:
          'Файл нужно защитить от перезаписи — всем только чтение. Вспомни восьмеричный код «только чтение для всех».',
        hint: 'touch notice.txt  ·  chmod 444 notice.txt',
        xp: 60,
        viz: 'permissions',
        vizTarget: 'notice.txt',
        vizGoal: 'r--r--r--',
        realOnly: true,
        builder: ['touch', 'chmod', '444', 'notice.txt'],
        check: snap => isFile(snap, 'notice.txt') && permBitsAre(snap, 'notice.txt', 'r--r--r--'),
      },
    ],
  },
  {
    id: 'text',
    skillCategory: 'shell',
    title: 'Следы в логах',
    subtitle: 'grep и текст',
    intro: 'В логах спрятаны следы вторжения. Сначала собери лог, потом выдерни из него ошибки.',
    act: 2,
    steps: [
      {
        id: 'logseed',
        title: 'Зафиксируй лог',
        story:
          'Чтобы искать следы, нужен лог событий. Запиши в файл строку с пометкой ERROR — это след сбоя.',
        goal: 'Создай app.log и запиши в него строку с пометкой ERROR.',
        hint: 'echo ERROR > app.log',
        xp: 40,
        viz: 'filesystem',
        builder: ['echo', 'ERROR', '>', 'app.log'],
        check: snap => isNonEmptyFile(snap, 'app.log'),
      },
      {
        id: 'grepout',
        title: 'Вытащи ошибки',
        story:
          'Теперь выдерни строки с ERROR в отдельный файл — это и есть следы вторжения для отчёта.',
        goal: 'Найди строки ERROR в app.log и сохрани их в отдельный файл errors.txt.',
        concept: 'Нужен инструмент поиска строк по шаблону, а результат — перенаправить в файл.',
        hint: 'grep ERROR app.log > errors.txt',
        xp: 50,
        viz: 'filesystem',
        builder: ['grep', 'ERROR', 'app.log', '>', 'errors.txt'],
        check: snap => isNonEmptyFile(snap, 'errors.txt'),
        verify: {
          file: 'errors.txt',
          ok: t => {
            const lines = t.split('\n').filter(l => l.trim());
            return lines.length > 0 && lines.every(l => l.includes('ERROR'));
          },
        },
      },
      {
        id: 'countlines',
        title: 'Посчитай ошибки',
        story:
          'Сколько всего было сбоев? Флаг -c у grep считает совпадения, а не печатает их. Сохрани число в файл.',
        goal: 'Посчитай строки ERROR в app.log (grep -c) и сохрани число в error-count.txt.',
        concept:
          'Тот же поиск, но тебе нужно не вывести строки, а посчитать их — у команды есть флаг для подсчёта.',
        hint: 'grep -c ERROR app.log > error-count.txt',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        setup: 'printf "ERROR boom\\nINFO ok\\nERROR crash\\n" > app.log',
        builder: ['grep', '-c', 'ERROR', 'app.log', '>', 'error-count.txt'],
        check: snap => isNonEmptyFile(snap, 'error-count.txt'),
        verify: { file: 'error-count.txt', ok: t => t.trim() === '2' },
      },
      {
        id: 'invert',
        title: 'Отсей шум',
        story:
          'Для чистого отчёта нужны строки БЕЗ ERROR. Флаг -v инвертирует поиск — оставляет всё, что не совпало.',
        goal: 'Сохрани все строки app.log, кроме ERROR, в clean.txt (grep -v).',
        concept:
          'Тот же поиск, но наоборот — оставить строки, которые НЕ совпали. У команды есть флаг инверсии.',
        hint: 'grep -v ERROR app.log > clean.txt',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        setup: 'printf "ERROR boom\\nINFO ok\\nERROR crash\\n" > app.log',
        builder: ['grep', '-v', 'ERROR', 'app.log', '>', 'clean.txt'],
        check: snap => isNonEmptyFile(snap, 'clean.txt'),
        verify: {
          file: 'clean.txt',
          ok: t => {
            const lines = t.split('\n').filter(l => l.trim());
            return lines.length > 0 && lines.every(l => !l.includes('ERROR'));
          },
        },
      },
      {
        id: 'findlogs',
        title: 'Найди все логи',
        story:
          'Логи разбросаны по подкаталогам. find рекурсивно ищет файлы по шаблону имени — собери список всех .log в один файл.',
        goal: 'Найди все файлы *.log от текущего каталога и сохрани список в found.txt.',
        concept:
          'Для рекурсивного поиска файлов по имени есть отдельная команда — укажи ей шаблон имени и куда искать.',
        hint: 'find . -name "*.log" > found.txt',
        xp: 60,
        viz: 'filesystem',
        realOnly: true,
        setup: 'mkdir -p logs && touch logs/a.log logs/b.log',
        builder: ['find', '.', '-name', '"*.log"', '>', 'found.txt'],
        check: snap => isNonEmptyFile(snap, 'found.txt'),
        verify: {
          file: 'found.txt',
          ok: t => t.split('\n').some(l => /\.log\s*$/.test(l.trim())),
        },
      },
    ],
  },
  {
    id: 'textproc',
    skillCategory: 'shell',
    title: 'Резка текста',
    subtitle: 'wc · head · sort · uniq',
    intro:
      'Сырые логи бесполезны без обработки. Освой инструменты, которые режут и считают текст: подсчёт строк, первые строки, сортировка, удаление повторов.',
    act: 3,
    steps: [
      {
        id: 'wc',
        title: 'Сосчитай строки',
        story:
          'wc -l считает количество строк в файле. Узнай размер лога в строках и сохрани число.',
        goal: 'Посчитай строки в app.log (wc -l) и сохрани результат в lines.txt.',
        concept: 'Есть команда, считающая строки/слова/байты. Нужен флаг для строк.',
        hint: 'wc -l app.log > lines.txt',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        setup: 'printf "a\\nb\\nc\\nd\\n" > app.log',
        builder: ['wc', '-l', 'app.log', '>', 'lines.txt'],
        check: snap => isNonEmptyFile(snap, 'lines.txt'),
        verify: { file: 'lines.txt', ok: t => /(^|\D)4(\D|$)/.test(t.trim()) },
      },
      {
        id: 'head',
        title: 'Загляни в начало',
        story:
          'Большой файл целиком читать незачем. head -n N показывает первые N строк. Сохрани начало лога.',
        goal: 'Сохрани первые 2 строки app.log в top.txt (head -n 2).',
        concept: 'Команда показывает начало файла. Укажи, сколько первых строк взять.',
        hint: 'head -n 2 app.log > top.txt',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        setup: 'printf "a\\nb\\nc\\nd\\n" > app.log',
        builder: ['head', '-n', '2', 'app.log', '>', 'top.txt'],
        check: snap => isNonEmptyFile(snap, 'top.txt'),
        verify: {
          file: 'top.txt',
          ok: t => {
            const lines = t.split('\n').filter(l => l.trim());
            return (
              lines.length > 0 &&
              lines.length <= 2 &&
              lines.includes('a') &&
              !lines.includes('c') &&
              !lines.includes('d')
            );
          },
        },
      },
      {
        id: 'sortit',
        title: 'Наведи порядок в строках',
        story: 'sort сортирует строки по алфавиту — удобно для имён, IP, любых списков.',
        goal: 'Отсортируй строки names.txt и сохрани в sorted.txt (sort).',
        concept: 'Есть команда, упорядочивающая строки по алфавиту.',
        hint: 'sort names.txt > sorted.txt',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        setup: 'printf "carol\\nalice\\nbob\\nalice\\n" > names.txt',
        builder: ['sort', 'names.txt', '>', 'sorted.txt'],
        check: snap => isNonEmptyFile(snap, 'sorted.txt'),
        verify: {
          file: 'sorted.txt',
          ok: t => {
            const lines = t.split('\n').filter(l => l.trim());
            const sorted = [...lines].sort();
            return lines.length >= 3 && lines.join('\n') === sorted.join('\n');
          },
        },
      },
      {
        id: 'uniqit',
        title: 'Убери повторы',
        story:
          'uniq убирает соседние повторяющиеся строки — поэтому сначала сортируют, потом схлопывают дубликаты конвейером.',
        goal: 'Отсортируй names.txt и оставь уникальные строки в unique.txt (sort | uniq).',
        concept:
          'Повторы убирает отдельная команда, но только у соседних строк — поэтому сначала отсортируй, потом передай результат конвейером.',
        hint: 'sort names.txt | uniq > unique.txt',
        xp: 60,
        viz: 'pipe',
        realOnly: true,
        setup: 'printf "carol\\nalice\\nbob\\nalice\\n" > names.txt',
        builder: ['sort', 'names.txt', '|', 'uniq', '>', 'unique.txt'],
        check: snap => isNonEmptyFile(snap, 'unique.txt'),
        verify: {
          file: 'unique.txt',
          ok: t => {
            const lines = t.split('\n').filter(l => l.trim());
            return (
              lines.length === 3 &&
              lines.includes('alice') &&
              lines.includes('bob') &&
              lines.includes('carol')
            );
          },
        },
      },
    ],
  },
  {
    id: 'pipes',
    skillCategory: 'shell',
    title: 'Конвейер расследования',
    subtitle: 'Пайпы',
    intro:
      'Один инструмент редко решает всё. Соедини команды в конвейер, чтобы выжать из логов число.',
    act: 3,
    steps: [
      {
        id: 'pipecount',
        title: 'Посчитай ошибки конвейером',
        story:
          'Сколько было сбоев? Прогони лог через фильтр и счётчик строк, а результат сохрани в файл-улику.',
        goal: 'Конвейером посчитай строки ERROR в app.log и сохрани полученное число в error-count.txt.',
        concept:
          'Соедини конвейером три шага: прочитать лог → отфильтровать ошибки → посчитать строки. Результат — в файл.',
        hint: 'cat app.log | grep ERROR | wc -l > error-count.txt',
        xp: 70,
        viz: 'pipe',
        realOnly: true,
        builder: ['cat', 'app.log', '|', 'grep', 'ERROR', '|', 'wc', '-l', '>', 'error-count.txt'],
        setup: 'printf "ERROR boom\\nINFO ok\\nERROR crash\\n" > app.log',
        check: snap => isNonEmptyFile(snap, 'error-count.txt'),
        verify: { file: 'error-count.txt', ok: t => t.trim() === '2' },
      },
      {
        id: 'multipipe',
        title: 'Длинный конвейер',
        story:
          'Настоящая сила Linux — в цепочках. Прогони лог через четыре инструмента: фильтр → сортировка → уникальные → счёт. Каждый передаёт результат следующему.',
        goal: 'Собери конвейер из 4 стадий и сохрани число уникальных ошибок в uniq-errors.txt.',
        concept:
          'Конвейер из четырёх инструментов: фильтр → сортировка → уникальные → подсчёт. Каждый передаёт вывод следующему.',
        hint: 'cat app.log | grep ERROR | sort | uniq | wc -l > uniq-errors.txt',
        xp: 90,
        viz: 'pipe',
        realOnly: true,
        setup: 'printf "ERROR boom\\nERROR boom\\nINFO ok\\nERROR crash\\n" > app.log',
        builder: [
          'cat',
          'app.log',
          '|',
          'grep',
          'ERROR',
          '|',
          'sort',
          '|',
          'uniq',
          '|',
          'wc',
          '-l',
          '>',
          'uniq-errors.txt',
        ],
        check: snap => isNonEmptyFile(snap, 'uniq-errors.txt'),
        verify: { file: 'uniq-errors.txt', ok: t => t.trim() === '2' },
      },
    ],
  },
  {
    id: 'dataflow',
    skillCategory: 'shell',
    title: 'Поток данных',
    subtitle: 'sed · awk · cut · tr',
    intro:
      'Высший пилотаж работы с текстом: на лету заменяй, вырезай колонки и поля, меняй регистр. Эти инструменты — хлеб системного администратора.',
    act: 4,
    steps: [
      {
        id: 'sedrepl',
        title: 'Замени на лету',
        story:
          'sed — потоковый редактор. Выражение s/что/на_что/ заменяет текст. Замени все ERROR на FIXED и сохрани результат.',
        goal: 'Заменой sed преврати ERROR в FIXED в app.log и сохрани в fixed.txt.',
        concept: 'Потоковый редактор умеет заменять текст выражением вида «заменить X на Y».',
        hint: "sed 's/ERROR/FIXED/' app.log > fixed.txt",
        xp: 70,
        viz: 'filesystem',
        realOnly: true,
        setup: 'printf "ERROR boom\\nINFO ok\\n" > app.log',
        builder: ['sed', "'s/ERROR/FIXED/'", 'app.log', '>', 'fixed.txt'],
        check: snap => isNonEmptyFile(snap, 'fixed.txt'),
        verify: { file: 'fixed.txt', ok: t => t.includes('FIXED') && !t.includes('ERROR') },
      },
      {
        id: 'awkcol',
        title: 'Выдерни колонку',
        story:
          'awk режет строку на поля по пробелам. $1 — первое поле. Достань первый столбец из лога.',
        goal: "Выведи первое слово каждой строки app.log (awk '{print $1}') в col.txt.",
        concept:
          'Есть инструмент, режущий строку на поля по пробелам. Нужно вывести только первое поле.',
        hint: "awk '{print $1}' app.log > col.txt",
        xp: 70,
        viz: 'filesystem',
        realOnly: true,
        setup: 'printf "ERROR boom\\nINFO ok\\n" > app.log',
        builder: ['awk', "'{print $1}'", 'app.log', '>', 'col.txt'],
        check: snap => isNonEmptyFile(snap, 'col.txt'),
        verify: {
          file: 'col.txt',
          ok: t => t.includes('ERROR') && !t.includes('boom') && !t.includes('ok'),
        },
      },
      {
        id: 'cutfield',
        title: 'Вырежи поле',
        story:
          'cut вырезает поля по разделителю. В /etc/passwd поля разделены двоеточием, первое — имя пользователя. Достань список пользователей.',
        goal: 'Вырежи имена пользователей из /etc/passwd (cut -d: -f1) в users.txt.',
        concept:
          'Есть команда, вырезающая поля по разделителю. В passwd разделитель — двоеточие, имя пользователя — первое поле.',
        hint: 'cut -d: -f1 /etc/passwd > users.txt',
        xp: 70,
        viz: 'filesystem',
        realOnly: true,
        builder: ['cut', '-d:', '-f1', '/etc/passwd', '>', 'users.txt'],
        check: snap => isNonEmptyFile(snap, 'users.txt'),
        verify: {
          file: 'users.txt',
          ok: t => /(^|\n)root\s*($|\n)/.test(t) && !t.includes(':'),
        },
      },
      {
        id: 'trupper',
        title: 'Поменяй регистр',
        story: 'tr заменяет символы по таблице. Переведи весь лог в ВЕРХНИЙ регистр конвейером.',
        goal: 'Переведи app.log в верхний регистр (cat | tr a-z A-Z) и сохрани в upper.txt.',
        concept:
          'Есть команда, заменяющая символы по таблице — задай диапазоны строчных и прописных букв, прогони лог конвейером.',
        hint: 'cat app.log | tr a-z A-Z > upper.txt',
        xp: 70,
        viz: 'pipe',
        realOnly: true,
        setup: 'printf "error boom\\n" > app.log',
        builder: ['cat', 'app.log', '|', 'tr', 'a-z', 'A-Z', '>', 'upper.txt'],
        check: snap => isNonEmptyFile(snap, 'upper.txt'),
        verify: {
          file: 'upper.txt',
          ok: t => t.includes('ERROR') && t.includes('BOOM') && !/[a-z]/.test(t),
        },
      },
    ],
  },
  {
    id: 'archives',
    skillCategory: 'fs',
    title: 'Архивы и упаковка',
    subtitle: 'tar — упаковка каталогов',
    intro:
      'Логи нужно сохранить и передать одним куском. tar собирает целый каталог со всеми файлами в один архив — удобно хранить и переносить. Заодно научишься распаковывать его обратно.',
    act: 4,
    steps: [
      {
        id: 'tarcreate',
        title: 'Упакуй логи',
        story:
          'tar собирает каталог со всеми файлами в один архив. Флаги: c — create (создать), f — file (имя архива). Упакуй всю папку логов в один файл.',
        goal: 'Упакуй каталог logs в архив logs.tar (tar -cf).',
        concept: 'Архиватор собирает каталог в один файл. Нужны флаги «создать» и «имя файла».',
        hint: 'tar -cf logs.tar logs',
        xp: 70,
        viz: 'filesystem',
        realOnly: true,
        setup: 'mkdir -p logs && touch logs/a.log logs/b.log',
        builder: ['tar', '-cf', 'logs.tar', 'logs'],
        check: snap => isNonEmptyFile(snap, 'logs.tar'),
        verify: { file: 'logs.tar', ok: t => t.includes('logs/') && t.includes('a.log') },
      },
      {
        id: 'tarextract',
        title: 'Распакуй обратно',
        story:
          'tar умеет и распаковывать: x — extract (извлечь). Флаг -C задаёт, куда распаковать. Достань логи в отдельную папку.',
        goal: 'Создай каталог out и распакуй в него logs.tar (tar -xf … -C out).',
        concept:
          'Тот же архиватор умеет распаковывать — флаг «извлечь», плюс укажи каталог назначения.',
        hint: 'mkdir out  ·  tar -xf logs.tar -C out',
        xp: 80,
        viz: 'filesystem',
        realOnly: true,
        setup: 'mkdir -p logs && touch logs/a.log && tar -cf logs.tar logs',
        builder: ['mkdir', 'out', 'tar', '-xf', 'logs.tar', '-C', 'out'],
        check: snap => isDir(snap, 'out/logs'),
      },
    ],
  },
  {
    id: 'processes',
    skillCategory: 'sec',
    title: 'Чужой процесс',
    subtitle: 'Процессы и сигналы',
    intro: 'В системе крутится подозрительный фоновый процесс. Найди и заверши его сигналом.',
    act: 5,
    steps: [
      {
        id: 'rogue',
        title: 'Заверши чужой процесс',
        story:
          'Злоумышленник оставил работать фоновый процесс. Он уже запущен — найди его на карте процессов справа и пошли сигнал, чтобы завершить.',
        goal: 'Заверши подозрительный процесс сигналом. Сначала вежливо — SIGTERM; если упрямится — добей SIGKILL.',
        hint: 'SIGTERM (kill -TERM <pid>) — попросить; SIGKILL (kill -9 <pid>) — заставить. Кнопки есть на карте процессов.',
        xp: 70,
        viz: 'process',
        realOnly: true,
        setup: 'sleep 300 & echo $! >> /mnt/.victims',
        arm: snap => snap.procs.some(p => p.victim),
        check: snap => !snap.procs.some(p => p.victim),
      },
    ],
  },
  {
    id: 'network',
    skillCategory: 'network',
    title: 'Восстановление связи',
    subtitle: 'Сеть',
    intro: 'Сервис снова в строю — сними сетевую конфигурацию для финального отчёта.',
    act: 5,
    steps: [
      {
        id: 'netreport',
        title: 'Зафиксируй сеть',
        story:
          'Заверши расследование: сними состояние сетевых интерфейсов сервера и приложи его к отчёту.',
        goal: 'Сними состояние сетевых интерфейсов и сохрани его в файл network.txt.',
        concept:
          'Состояние сетевых интерфейсов показывает команда управления сетью (подкоманда про адреса). Вывод — в файл.',
        hint: 'ip addr > network.txt',
        xp: 60,
        viz: 'filesystem',
        realOnly: true,
        check: snap => isNonEmptyFile(snap, 'network.txt'),
        verify: { file: 'network.txt', ok: t => /lo/.test(t) },
      },
      {
        id: 'hostname',
        title: 'Запиши имя машины',
        story: 'Каждый сервер знает своё имя. Команда hostname печатает его — сохрани в отчёт.',
        goal: 'Сохрани имя машины в host.txt (hostname > host.txt).',
        concept: 'Имя машины печатает одноимённая команда.',
        hint: 'hostname > host.txt',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        builder: ['hostname', '>', 'host.txt'],
        check: snap => isNonEmptyFile(snap, 'host.txt'),
        verify: { file: 'host.txt', ok: t => /\w/.test(t) },
      },
      {
        id: 'routes',
        title: 'Карта маршрутов',
        story:
          'Таблица маршрутизации показывает, куда сервер отправляет пакеты. Сними её для финального отчёта.',
        goal: 'Сохрани таблицу маршрутов в routes.txt (ip route > routes.txt).',
        concept:
          'Таблицу маршрутизации показывает та же сетевая команда, но подкоманда про маршруты.',
        hint: 'ip route > routes.txt',
        xp: 60,
        viz: 'filesystem',
        realOnly: true,
        builder: ['ip', 'route', '>', 'routes.txt'],
        check: snap => isFile(snap, 'routes.txt'),
      },
    ],
  },
  {
    id: 'environment',
    skillCategory: 'shell',
    title: 'Переменные окружения',
    subtitle: 'env · export · $PATH · $HOME',
    intro:
      'Система хранит настройки в переменных окружения. Они определяют, где искать программы, какой язык использовать, и кто ты в системе. Научись читать и менять их.',
    act: 2,
    steps: [
      {
        id: 'envlist',
        title: 'Разведка окружения',
        story:
          'Взломщик мог подменить переменные, чтобы перенаправить команды на свои скрипты. Посмотри все переменные окружения и сохрани их для анализа.',
        goal: 'Сохрани полный список переменных окружения в файл env-dump.txt.',
        hint: 'env > env-dump.txt',
        xp: 40,
        viz: 'filesystem',
        realOnly: true,
        builder: ['env', '>', 'env-dump.txt'],
        check: snap => isNonEmptyFile(snap, 'env-dump.txt'),
      },
      {
        id: 'echohome',
        title: 'Где твой дом?',
        story:
          'Переменная $HOME показывает, где живёт текущий пользователь. Запиши её значение — это пригодится для восстановления.',
        goal: 'Запиши значение $HOME в файл myhome.txt.',
        hint: 'echo $HOME > myhome.txt',
        xp: 40,
        viz: 'filesystem',
        realOnly: true,
        builder: ['echo', '$HOME', '>', 'myhome.txt'],
        check: snap => isNonEmptyFile(snap, 'myhome.txt'),
      },
      {
        id: 'exportvar',
        title: 'Установи маркер',
        story:
          'Создай свою переменную-маркер, чтобы все дочерние процессы знали, что сервер восстанавливается. export делает переменную видимой для подпроцессов.',
        goal: 'Создай переменную RECOVERY=active с помощью export и запиши её в marker.txt.',
        hint: 'export RECOVERY=active && echo $RECOVERY > marker.txt',
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        check: snap => isNonEmptyFile(snap, 'marker.txt'),
        verify: { file: 'marker.txt', ok: t => t.trim() === 'active' },
      },
      {
        id: 'pathcheck',
        title: 'Проверь PATH',
        story:
          '$PATH — это список каталогов, где система ищет команды. Если взломщик добавил туда свою папку — все команды могут быть подменены. Проверь и сохрани.',
        goal: 'Запиши содержимое $PATH в файл path-check.txt.',
        hint: 'echo $PATH > path-check.txt',
        xp: 40,
        viz: 'filesystem',
        realOnly: true,
        builder: ['echo', '$PATH', '>', 'path-check.txt'],
        check: snap => isNonEmptyFile(snap, 'path-check.txt'),
      },
    ],
  },
  {
    id: 'shellscript',
    skillCategory: 'shell',
    title: 'Первый скрипт',
    subtitle: 'bash · chmod +x · скрипты',
    intro:
      'Скрипт — это файл с командами, который можно запустить как программу. Напиши свой первый скрипт для автоматизации рутины на сервере.',
    act: 4,
    steps: [
      {
        id: 'writescript',
        title: 'Напиши скрипт',
        story:
          'Каждый раз запускать одни и те же команды вручную — неэффективно. Создай скрипт cleanup.sh, который выведет дату и список файлов в текущем каталоге.',
        goal: 'Создай файл cleanup.sh с содержимым: shebang (#!/bin/sh), команда date, команда ls.',
        hint: "printf '#!/bin/sh\\ndate\\nls\\n' > cleanup.sh",
        xp: 50,
        viz: 'filesystem',
        realOnly: true,
        check: snap => isNonEmptyFile(snap, 'cleanup.sh'),
        verify: { file: 'cleanup.sh', ok: t => t.includes('#!/bin/sh') && t.includes('date') },
      },
      {
        id: 'makexec',
        title: 'Сделай исполняемым',
        story:
          'Файл есть, но Linux не запустит его без права на выполнение. chmod +x добавляет это право — и скрипт превращается в настоящую программу.',
        goal: 'Добавь право на выполнение файлу cleanup.sh.',
        hint: 'chmod +x cleanup.sh',
        xp: 40,
        viz: 'permissions',
        vizTarget: 'cleanup.sh',
        vizGoal: '--x',
        realOnly: true,
        setup: "printf '#!/bin/sh\\ndate\\nls\\n' > cleanup.sh",
        builder: ['chmod', '+x', 'cleanup.sh'],
        check: snap => {
          const f = findNode(snap, 'cleanup.sh');
          return f != null && f.permissions != null && f.permissions.includes('x');
        },
      },
      {
        id: 'runscript',
        title: 'Запусти скрипт',
        story:
          'Всё готово. Запусти свой скрипт и сохрани его вывод в файл — это доказательство, что автоматизация работает.',
        goal: 'Запусти cleanup.sh и сохрани вывод в result.txt.',
        hint: './cleanup.sh > result.txt',
        xp: 60,
        viz: 'filesystem',
        realOnly: true,
        setup: "printf '#!/bin/sh\\ndate\\nls\\n' > cleanup.sh && chmod +x cleanup.sh",
        builder: ['./cleanup.sh', '>', 'result.txt'],
        check: snap => isNonEmptyFile(snap, 'result.txt'),
      },
    ],
  },
  {
    id: 'users',
    skillCategory: 'sec',
    title: 'Кто в системе?',
    subtitle: 'whoami · id · who · w',
    intro:
      'Linux — многопользовательская система. Кто сейчас залогинен? Какие у тебя права? Эти команды — первый шаг в администрировании пользователей.',
    act: 1,
    steps: [
      {
        id: 'whoami',
        title: 'Кто ты?',
        story:
          'После взлома важно убедиться, что ты работаешь от правильного пользователя. whoami покажет имя текущего юзера.',
        goal: 'Запиши результат whoami в файл user.txt.',
        hint: 'whoami > user.txt',
        xp: 30,
        viz: 'filesystem',
        realOnly: true,
        builder: ['whoami', '>', 'user.txt'],
        check: snap => isNonEmptyFile(snap, 'user.txt'),
      },
      {
        id: 'idcheck',
        title: 'Твой ID и группы',
        story:
          'Команда id показывает UID, GID и все группы пользователя. Это критично для понимания, какие права у тебя есть.',
        goal: 'Сохрани вывод команды id в файл identity.txt.',
        hint: 'id > identity.txt',
        xp: 40,
        viz: 'filesystem',
        realOnly: true,
        builder: ['id', '>', 'identity.txt'],
        check: snap => isNonEmptyFile(snap, 'identity.txt'),
      },
      {
        id: 'diskusage',
        title: 'Проверь диск',
        story:
          'Взломщик мог забить диск мусором. Команда df показывает свободное место на всех разделах. Проверь и сохрани.',
        goal: 'Сохрани информацию о дисках в файл disk.txt.',
        hint: 'df -h > disk.txt',
        xp: 40,
        viz: 'filesystem',
        realOnly: true,
        builder: ['df', '-h', '>', 'disk.txt'],
        check: snap => isNonEmptyFile(snap, 'disk.txt'),
      },
      {
        id: 'uptime',
        title: 'Как давно работает сервер?',
        story:
          'uptime показывает, сколько времени сервер работает без перезагрузки. Если uptime подозрительно маленький — кто-то перезагружал.',
        goal: 'Запиши uptime сервера в файл uptime.txt.',
        hint: 'uptime > uptime.txt',
        xp: 30,
        viz: 'filesystem',
        realOnly: true,
        builder: ['uptime', '>', 'uptime.txt'],
        check: snap => isNonEmptyFile(snap, 'uptime.txt'),
      },
    ],
  },
  {
    id: 'finale',
    skillCategory: 'shell',
    title: 'Сервер восстановлен',
    subtitle: 'Итоговый отчёт',
    intro:
      'Финал. Злоумышленник всё ещё прячется в системе. Это твой выпускной экзамен: найди его, вычисли IP и автоматизируй защиту.',
    act: 6,
    steps: [
      {
        id: 'final_rogue',
        title: 'Устранение угрозы',
        story:
          'Злоумышленник запустил майнер. Найди этот скрытый процесс и уничтожь его без пощады. Никаких подсказок.',
        goal: 'Заверши фоновый процесс (sleep). Используй карту процессов.',
        xp: 150,
        viz: 'process',
        realOnly: true,
        setup: 'sleep 600 & echo $! >> /mnt/.victims',
        arm: snap => snap.procs.some(p => p.victim),
        check: snap => !snap.procs.some(p => p.victim),
      },
      {
        id: 'final_ip',
        title: 'Вычисли хакера',
        story:
          'Процесс убит. Теперь найди, откуда он пришёл. В /var/log/auth.log есть IP-адреса. Найди тот, с которого заходил root.',
        goal: 'С помощью grep и awk найди строку с входом root в /var/log/auth.log и выведи только IP-адрес в файл hacker_ip.txt.',
        xp: 150,
        viz: 'filesystem',
        realOnly: true,
        setup:
          'mkdir -p /var/log && printf "Jan 12 04:02:11 server sshd: Accepted password for root from 192.168.1.104 port 22\\nJan 12 04:03:00 server sshd: Accepted password for user from 10.0.0.5 port 22\\n" > /var/log/auth.log',
        check: snap => isNonEmptyFile(snap, 'hacker_ip.txt'),
        verify: { file: 'hacker_ip.txt', ok: t => t.trim() === '192.168.1.104' },
      },
      {
        id: 'final_archive',
        title: 'Сбор улик',
        story:
          'Упакуй логи и файл с IP-адресом в один архив, чтобы отправить в отдел безопасности.',
        goal: 'Создай архив evidence.tar, содержащий файлы hacker_ip.txt и /var/log/auth.log.',
        xp: 150,
        viz: 'filesystem',
        realOnly: true,
        setup:
          'mkdir -p /var/log && printf "Jan 12 ssh log" > /var/log/auth.log && echo "192.168.1.104" > hacker_ip.txt',
        check: snap => isNonEmptyFile(snap, 'evidence.tar'),
        verify: {
          file: 'evidence.tar',
          ok: t => t.includes('hacker_ip.txt') && t.includes('auth.log'),
        },
      },
      {
        id: 'final_script',
        title: 'Автоматизируй защиту',
        story:
          'Ты победил. Напиши скрипт lockdown.sh, который закроет доступ к логам. Сделай его исполняемым.',
        goal: 'Создай скрипт lockdown.sh, в котором будет команда: chmod 600 /var/log/auth.log. Добавь шебанг и право на выполнение.',
        xp: 200,
        viz: 'filesystem',
        realOnly: true,
        setup: 'mkdir -p /var/log && touch /var/log/auth.log',
        check: snap => isExecutable(snap, 'lockdown.sh'),
        verify: { file: 'lockdown.sh', ok: t => t.includes('chmod 600 /var/log/auth.log') },
      },
    ],
  },
];

export const totalCampaignSteps = campaign.reduce((n, c) => n + c.steps.length, 0);

export const stepKey = (stepId: string) => `campaign:${stepId}`;

export const campaignStepIds = campaign.flatMap(c => c.steps.map(s => s.id));

export function isCampaignComplete(completed: Set<string>): boolean {
  return totalCampaignSteps > 0 && campaignStepIds.every(id => completed.has(stepKey(id)));
}
