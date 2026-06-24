export interface FhsEntry {
  path: string;
  name: string;
  short: string;
  description: string;
  examples: string[];
  danger?: boolean;
  category: 'core' | 'config' | 'data' | 'runtime' | 'user' | 'virtual';
}

export const fhsEntries: FhsEntry[] = [
  {
    path: '/',
    name: 'root',
    short: 'Корень всей файловой системы',
    description:
      'Вершина дерева. Всё в Linux растёт из одного корня «/» — нет отдельных дисков C: и D:, любой накопитель монтируется в подпапку.',
    examples: ['cd /', 'ls /'],
    category: 'core',
  },
  {
    path: '/bin',
    name: 'binaries',
    short: 'Базовые исполняемые команды',
    description:
      'Основные программы, нужные всем пользователям и доступные даже в аварийном режиме: ls, cp, mv, cat, bash. В современных дистрибутивах это симлинк на /usr/bin.',
    examples: ['ls -l /bin', 'which ls'],
    category: 'core',
  },
  {
    path: '/sbin',
    name: 'system binaries',
    short: 'Системные утилиты администратора',
    description:
      'Программы для системного администрирования: fdisk, reboot, ip, mkfs. Обычно требуют прав root.',
    examples: ['ls /sbin', 'sudo reboot'],
    category: 'core',
  },
  {
    path: '/etc',
    name: 'et cetera',
    short: 'Конфигурация всей системы',
    description:
      'Текстовые файлы настроек для системы и сервисов: пользователи (passwd), сеть, расписание cron, конфиги демонов. Здесь нет бинарников — только настройки.',
    examples: ['cat /etc/passwd', 'cat /etc/hostname', 'ls /etc'],
    category: 'config',
  },
  {
    path: '/home',
    name: 'home',
    short: 'Домашние папки пользователей',
    description:
      'Личное пространство каждого пользователя: /home/penguin, /home/alice. Здесь живут документы, загрузки и пользовательские конфиги (dotfiles).',
    examples: ['cd ~', 'ls /home', 'cd /home/penguin'],
    category: 'user',
  },
  {
    path: '/root',
    name: 'root home',
    short: 'Домашняя папка суперпользователя',
    description:
      'Личная папка администратора root. Не путать с корнем «/» — это отдельный каталог, доступный только root.',
    examples: ['sudo ls /root'],
    danger: true,
    category: 'user',
  },
  {
    path: '/var',
    name: 'variable',
    short: 'Изменяемые данные: логи, очереди, кеши',
    description:
      'Данные, которые постоянно меняются во время работы системы: логи (/var/log), почта, очереди печати, кеши пакетов. Растёт со временем.',
    examples: ['ls /var/log', 'tail /var/log/syslog'],
    category: 'data',
  },
  {
    path: '/tmp',
    name: 'temporary',
    short: 'Временные файлы',
    description:
      'Свалка для временных файлов любых программ. Очищается при перезагрузке — не храни здесь ничего важного.',
    examples: ['ls /tmp', 'touch /tmp/scratch'],
    category: 'data',
  },
  {
    path: '/usr',
    name: 'user system resources',
    short: 'Программы и данные, устанавливаемые системой',
    description:
      'Большая часть установленного ПО: /usr/bin (программы), /usr/lib (библиотеки), /usr/share (документация, иконки). Раньше расшифровывалось как «user», теперь — «Unix System Resources».',
    examples: ['ls /usr/bin', 'ls /usr/share'],
    category: 'data',
  },
  {
    path: '/lib',
    name: 'libraries',
    short: 'Разделяемые библиотеки',
    description:
      'Общие библиотеки (.so), нужные программам из /bin и /sbin, а также модули ядра. Аналог DLL в Windows.',
    examples: ['ls /lib', 'ls /lib/modules'],
    category: 'core',
  },
  {
    path: '/opt',
    name: 'optional',
    short: 'Сторонние приложения',
    description:
      'Крупные проприетарные или сторонние пакеты, которые ставятся целиком в свою папку: /opt/google, /opt/zoom.',
    examples: ['ls /opt'],
    category: 'data',
  },
  {
    path: '/dev',
    name: 'devices',
    short: 'Файлы устройств',
    description:
      'В Linux «всё есть файл» — даже железо. Диски (/dev/sda), терминалы, а ещё спецфайлы /dev/null (чёрная дыра) и /dev/random.',
    examples: ['ls /dev', 'echo bye > /dev/null'],
    danger: true,
    category: 'virtual',
  },
  {
    path: '/proc',
    name: 'processes',
    short: 'Виртуальная ФС: процессы и ядро',
    description:
      'Не существует на диске — ядро генерирует её на лету. Каждая папка-число это PID процесса; /proc/cpuinfo и /proc/meminfo показывают состояние железа.',
    examples: ['cat /proc/cpuinfo', 'cat /proc/meminfo', 'ls /proc'],
    category: 'virtual',
  },
  {
    path: '/sys',
    name: 'system',
    short: 'Виртуальная ФС: устройства и ядро',
    description:
      'Ещё одна виртуальная ФС. Даёт структурированный доступ к устройствам, драйверам и параметрам ядра. Используется для управления железом из user-space.',
    examples: ['ls /sys', 'cat /sys/class/net/eth0/address'],
    category: 'virtual',
  },
  {
    path: '/mnt',
    name: 'mount',
    short: 'Точка монтирования (ручная)',
    description:
      'Традиционное место, куда администратор временно монтирует диски и сетевые ресурсы вручную.',
    examples: ['sudo mount /dev/sdb1 /mnt', 'ls /mnt'],
    category: 'runtime',
  },
  {
    path: '/media',
    name: 'media',
    short: 'Автомонтирование съёмных носителей',
    description:
      'Сюда система автоматически монтирует USB-флешки, CD и внешние диски: /media/penguin/USB.',
    examples: ['ls /media'],
    category: 'runtime',
  },
  {
    path: '/boot',
    name: 'boot',
    short: 'Загрузчик и ядро',
    description:
      'Всё необходимое для старта системы: образ ядра (vmlinuz), initramfs и конфигурация загрузчика GRUB. Трогать с осторожностью.',
    examples: ['ls /boot'],
    danger: true,
    category: 'core',
  },
];

export const fhsCategories: Record<
  FhsEntry['category'],
  { label: string; dot: string; bar: string; badge: string }
> = {
  core: {
    label: 'Ядро системы',
    dot: 'bg-terminal-green',
    bar: 'bg-terminal-green',
    badge: 'bg-terminal-green/15 text-terminal-green',
  },
  config: {
    label: 'Конфигурация',
    dot: 'bg-terminal-cyan',
    bar: 'bg-terminal-cyan',
    badge: 'bg-terminal-cyan/15 text-terminal-cyan',
  },
  data: {
    label: 'Данные и ПО',
    dot: 'bg-terminal-purple',
    bar: 'bg-terminal-purple',
    badge: 'bg-terminal-purple/15 text-terminal-purple',
  },
  runtime: {
    label: 'Монтирование',
    dot: 'bg-terminal-yellow',
    bar: 'bg-terminal-yellow',
    badge: 'bg-terminal-yellow/15 text-terminal-yellow',
  },
  user: {
    label: 'Пользователи',
    dot: 'bg-accent',
    bar: 'bg-accent',
    badge: 'bg-accent/15 text-accent',
  },
  virtual: {
    label: 'Виртуальные ФС',
    dot: 'bg-terminal-red',
    bar: 'bg-terminal-red',
    badge: 'bg-terminal-red/15 text-terminal-red',
  },
};
