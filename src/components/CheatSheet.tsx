import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Terminal } from 'lucide-react';

interface CheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const commands = [
  { cmd: 'pwd', desc: 'Показать текущую директорию', example: 'pwd' },
  { cmd: 'ls', desc: 'Список файлов и папок', example: 'ls -la' },
  { cmd: 'cd', desc: 'Сменить директорию', example: 'cd Documents' },
  { cmd: 'cat', desc: 'Вывести содержимое файла', example: 'cat file.txt' },
  { cmd: 'head', desc: 'Первые строки файла', example: 'head -n 5 file.txt' },
  { cmd: 'tail', desc: 'Последние строки файла', example: 'tail -n 5 file.txt' },
  { cmd: 'wc', desc: 'Подсчет строк, слов, байт', example: 'wc file.txt' },
  { cmd: 'tree', desc: 'Показать дерево файлов', example: 'tree' },
  { cmd: 'mkdir', desc: 'Создать директорию', example: 'mkdir mydir' },
  { cmd: 'touch', desc: 'Создать пустой файл', example: 'touch file.txt' },
  { cmd: 'rm', desc: 'Удалить файл или папку', example: 'rm -r mydir' },
  { cmd: 'cp', desc: 'Копировать файл', example: 'cp file.txt backup.txt' },
  { cmd: 'mv', desc: 'Переместить или переименовать', example: 'mv old.txt new.txt' },
  { cmd: 'ln', desc: 'Создать ссылку', example: 'ln target.txt link.txt' },
  { cmd: 'find', desc: 'Найти файлы', example: 'find . -name "*.txt"' },
  { cmd: 'grep', desc: 'Поиск по шаблону', example: 'grep word file.txt' },
  { cmd: 'which', desc: 'Путь к исполняемому файлу', example: 'which ls' },
  { cmd: 'whereis', desc: 'Расположение файлов команды', example: 'whereis ls' },
  { cmd: 'sort', desc: 'Сортировать строки', example: 'sort file.txt' },
  { cmd: 'uniq', desc: 'Удалить повторяющиеся строки', example: 'uniq file.txt' },
  { cmd: 'diff', desc: 'Сравнить файлы', example: 'diff a.txt b.txt' },
  { cmd: 'cut', desc: 'Вырезать колонки', example: 'cut -d: -f1 file.txt' },
  { cmd: 'sed', desc: 'Потоковый редактор', example: 'sed s/old/new/g file.txt' },
  { cmd: 'awk', desc: 'Обработка текста', example: "awk '{print $1}' file.txt" },
  { cmd: 'rev', desc: 'Развернуть строки', example: 'rev file.txt' },
  { cmd: 'nl', desc: 'Нумеровать строки', example: 'nl file.txt' },
  { cmd: 'chmod', desc: 'Изменить права доступа', example: 'chmod 755 file' },
  { cmd: 'chown', desc: 'Изменить владельца', example: 'chown user file.txt' },
  { cmd: 'chgrp', desc: 'Изменить группу', example: 'chgrp group file.txt' },
  { cmd: 'umask', desc: 'Маска прав по умолчанию', example: 'umask 022' },
  { cmd: 'echo', desc: 'Вывести текст', example: 'echo "Hello"' },
  { cmd: 'printf', desc: 'Форматированный вывод', example: 'printf "%s\\n" hi' },
  { cmd: '>', desc: 'Перенаправить вывод в файл', example: 'echo hi > file.txt' },
  { cmd: '>>', desc: 'Добавить вывод в файл', example: 'echo hi >> file.txt' },
  { cmd: '<', desc: 'Передать файл на ввод', example: 'cat < file.txt' },
  { cmd: '|', desc: 'Передать вывод следующей команде', example: 'ls | grep .txt' },
  { cmd: 'env', desc: 'Переменные окружения', example: 'env' },
  { cmd: 'export', desc: 'Установить переменную', example: 'export NAME=value' },
  { cmd: 'alias', desc: 'Создать алиас', example: 'alias ll="ls -la"' },
  { cmd: 'unalias', desc: 'Удалить алиас', example: 'unalias ll' },
  { cmd: 'history', desc: 'История команд', example: 'history' },
  { cmd: 'source', desc: 'Выполнить файл', example: 'source .bashrc' },
  { cmd: 'clear', desc: 'Очистить экран', example: 'clear' },
  { cmd: 'exit', desc: 'Выйти', example: 'exit' },
  { cmd: 'ps', desc: 'Показать процессы', example: 'ps aux' },
  { cmd: 'top', desc: 'Динамические процессы', example: 'top' },
  { cmd: 'htop', desc: 'Интерактивные процессы', example: 'htop' },
  { cmd: 'kill', desc: 'Отправить сигнал процессу', example: 'kill -9 PID' },
  { cmd: 'killall', desc: 'Убить процессы по имени', example: 'killall firefox' },
  { cmd: 'pkill', desc: 'Убить по шаблону', example: 'pkill python' },
  { cmd: 'jobs', desc: 'Фоновые задачи', example: 'jobs' },
  { cmd: 'bg', desc: 'Фоновый режим', example: 'bg %1' },
  { cmd: 'fg', desc: 'На передний план', example: 'fg %1' },
  { cmd: 'whoami', desc: 'Текущий пользователь', example: 'whoami' },
  { cmd: 'id', desc: 'ID пользователя', example: 'id' },
  { cmd: 'groups', desc: 'Группы пользователя', example: 'groups' },
  { cmd: 'users', desc: 'Активные пользователи', example: 'users' },
  { cmd: 'w', desc: 'Кто работает', example: 'w' },
  { cmd: 'sudo', desc: 'Выполнить от имени root', example: 'sudo apt update' },
  { cmd: 'uname', desc: 'Информация о ядре', example: 'uname -a' },
  { cmd: 'hostname', desc: 'Имя машины', example: 'hostname' },
  { cmd: 'uptime', desc: 'Время работы системы', example: 'uptime' },
  { cmd: 'date', desc: 'Текущая дата', example: 'date' },
  { cmd: 'cal', desc: 'Календарь', example: 'cal' },
  { cmd: 'df', desc: 'Свободное место', example: 'df -h' },
  { cmd: 'du', desc: 'Использование диска', example: 'du -sh .' },
  { cmd: 'ip addr', desc: 'Сетевые интерфейсы', example: 'ip addr' },
  { cmd: 'ifconfig', desc: 'Сетевые интерфейсы (legacy)', example: 'ifconfig' },
  { cmd: 'ping', desc: 'Проверить доступность', example: 'ping -c 1 google.com' },
  { cmd: 'nslookup', desc: 'DNS-запрос', example: 'nslookup google.com' },
  { cmd: 'dig', desc: 'DNS-диагностика', example: 'dig google.com' },
  { cmd: 'netstat', desc: 'Сетевые соединения', example: 'netstat -tlnp' },
  { cmd: 'ss', desc: 'Сокеты', example: 'ss -tlnp' },
  { cmd: 'curl', desc: 'HTTP-запросы', example: 'curl https://example.com' },
  { cmd: 'wget', desc: 'Загрузить файл', example: 'wget https://example.com/file.zip' },
  { cmd: 'ssh', desc: 'Подключиться к серверу', example: 'ssh user@host' },
  { cmd: 'scp', desc: 'Копировать по SSH', example: 'scp file.txt user@host:/tmp' },
  { cmd: 'rsync', desc: 'Синхронизация', example: 'rsync -av src/ dst/' },
  { cmd: 'traceroute', desc: 'Маршрут пакетов', example: 'traceroute google.com' },
  { cmd: 'whois', desc: 'WHOIS-запрос', example: 'whois example.com' },
  { cmd: 'tar', desc: 'Архивирование', example: 'tar -cvf archive.tar files' },
  { cmd: 'gzip', desc: 'Сжать файл', example: 'gzip file.txt' },
  { cmd: 'gunzip', desc: 'Распаковать gzip', example: 'gunzip file.txt.gz' },
  { cmd: 'zip', desc: 'Создать zip', example: 'zip archive.zip files' },
  { cmd: 'unzip', desc: 'Распаковать zip', example: 'unzip archive.zip' },
  { cmd: 'nano', desc: 'Простой редактор', example: 'nano file.txt' },
  { cmd: 'vim', desc: 'Редактор vim', example: 'vim file.txt' },
  { cmd: 'man', desc: 'Справка', example: 'man ls' },
  { cmd: 'info', desc: 'Документация', example: 'info ls' },
  { cmd: 'whatis', desc: 'Краткое описание', example: 'whatis ls' },
  { cmd: 'apropos', desc: 'Поиск по документации', example: 'apropos list' },
  { cmd: 'apt', desc: 'Пакетный менеджер Ubuntu', example: 'apt install package' },
  { cmd: 'yum', desc: 'Пакетный менеджер RHEL', example: 'yum install package' },
  { cmd: 'dnf', desc: 'Пакетный менеджер Fedora', example: 'dnf install package' },
  { cmd: 'pacman', desc: 'Пакетный менеджер Arch', example: 'pacman -S package' },
];

export function CheatSheet({ isOpen, onClose }: CheatSheetProps) {
  const [search, setSearch] = useState('');

  const filtered = commands.filter(
    c =>
      c.cmd.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-surface border-l border-surface-light shadow-2xl z-[101] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cheatsheet-title"
          >
            <div className="p-5 border-b border-surface-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-terminal-green" aria-hidden="true" />
                <h2 id="cheatsheet-title" className="text-lg font-bold text-white">
                  Справочник команд
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Закрыть справочник"
                className="text-terminal-dim hover:text-white transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 border-b border-surface-light">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-dim"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск команд..."
                  aria-label="Поиск команд"
                  className="w-full bg-surface-light rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none border border-transparent focus:border-accent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {filtered.map((command, i) => (
                  <motion.div
                    key={command.cmd}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-3 rounded-lg bg-surface-light border border-surface-light hover:border-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-terminal-green font-mono font-bold">{command.cmd}</code>
                    </div>
                    <p className="text-sm text-terminal-dim mb-2">{command.desc}</p>
                    <code className="text-xs font-mono text-terminal-cyan bg-surface px-2 py-1 rounded">
                      {command.example}
                    </code>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
