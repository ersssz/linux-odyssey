import { parseShell } from './terminal/parser';
import { getNode, resolvePath } from './fileSystem';
import type { TerminalState } from '../components/Terminal';

export function diagnoseCommand(command: string, state: TerminalState): string | null {
  const parsed = parseShell(command);
  const cmd = parsed.args[0] || '';
  const args = parsed.args.slice(1);

  if (cmd === 'mkdir') {
    const target = args[args.length - 1];
    if (!target) return 'После mkdir нужно указать имя папки, например: mkdir mydir';
    const path = resolvePath(state.cwd, target);
    const node = getNode(state.fs, path);
    if (!node) {
      return `Папка «${target}» не создалась. Убедись, что ты в правильной директории (сейчас ${state.cwd}).`;
    }
    if (node.type === 'file') {
      return `«${target}» — это файл, а не папка. Нельзя создать директорию с таким именем.`;
    }
  }

  if (cmd === 'touch') {
    const target = args[args.length - 1];
    if (!target) return 'После touch нужно указать имя файла, например: touch file.txt';
    const path = resolvePath(state.cwd, target);
    const node = getNode(state.fs, path);
    if (!node) {
      return `Файл «${target}» не создался. Убедись, что директория существует (сейчас ${state.cwd}).`;
    }
  }

  if (cmd === 'cd') {
    const target = args[0] || '';
    if (!target) return 'После cd нужно указать путь, например: cd Documents';
    const path = resolvePath(state.cwd, target);
    const node = getNode(state.fs, path);
    if (!node) {
      return `Нет такого пути: ${path}. Проверь, существует ли директория.`;
    }
    if (node.type === 'file') {
      return `Нельзя войти в файл «${target}». cd работает только с директориями.`;
    }
  }

  if (cmd === 'cat') {
    const target = args[0] || '';
    if (!target) return 'У команды cat должен быть аргумент — файл, который нужно вывести.';
    const path = resolvePath(state.cwd, target);
    const node = getNode(state.fs, path);
    if (!node) {
      return `Файл «${target}» не найден. Проверь имя и текущую директорию (${state.cwd}).`;
    }
    if (node.type === 'dir') {
      return `«${target}» — это директория, а не файл. Используй ls для просмотра содержимого.`;
    }
  }

  if (cmd === 'chmod') {
    const target = args[args.length - 1];
    if (!target) return 'После chmod нужны режим и файл, например: chmod 644 file.txt';
    const path = resolvePath(state.cwd, target);
    const node = getNode(state.fs, path);
    if (!node) {
      return `Файл «${target}» не найден. Проверь имя и текущую директорию (${state.cwd}).`;
    }
  }

  if (cmd === 'echo') {
    if (command.includes('>')) {
      const fileMatch = command.match(/>\s*(\S+)/);
      if (fileMatch) {
        const target = fileMatch[1];
        const path = resolvePath(state.cwd, target);
        const node = getNode(state.fs, path);
        if (!node) {
          return `Файл «${target}» не создан. Проверь, правильно ли указан путь.`;
        }
      }
    }
  }

  if (cmd === 'grep' || cmd === 'sed') {
    if (args.length < 2) {
      return `У ${cmd} обычно два аргумента: шаблон и файл. Например: ${cmd} hello message.txt`;
    }
  }

  if (cmd === 'whoami' || cmd === 'id') {
    if (!command.startsWith('sudo') && !state.lastOutput?.includes('root')) {
      return 'Если нужны права root, используй sudo: sudo whoami или sudo id';
    }
  }

  return null;
}
