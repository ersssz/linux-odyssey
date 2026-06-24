import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  cloneFs,
  initialFileSystem,
  getNode,
  getParent,
  createNode,
  resolvePath,
} from '../utils/fileSystem';
import type { FileNode } from '../utils/fileSystem';
import { executeCommand, getCommandNames } from '../utils/terminal';
import type { EditorMode, NanoState, VimState } from '../utils/terminal';
import { parseAnsi } from '../utils/ansi';
import { Palette } from 'lucide-react';
import { PenguinMascot } from './PenguinMascot';
import { themes } from './terminal/themes';
import { NanoEditor } from './terminal/NanoEditor';
import { VimEditor } from './terminal/VimEditor';

export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export interface TerminalState {
  cwd: string;
  fs: FileNode;
  lastOutput?: string;
  lastError?: string;
}

interface TerminalProps {
  fs?: FileNode;
  onFsChange?: (fs: FileNode) => void;
  onCommand?: (command: string, state: TerminalState) => void;
  height?: string;
  mascotMood?: 'idle' | 'happy' | 'sad' | 'excited' | 'thinking';
}

export interface TerminalHandle {
  runCommand: (raw: string) => void;

  readFile: (path: string) => string;

  writeFile: (path: string, content: string) => void;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  {
    fs: externalFs,
    onFsChange,
    onCommand,
    height = '100%',
    mascotMood: externalMascotMood,
  }: TerminalProps,
  ref
) {
  const [internalFs, setInternalFs] = useState(() => cloneFs(initialFileSystem));
  const fs = externalFs ?? internalFs;
  const changeFs = useCallback(
    (newFs: FileNode) => {
      setInternalFs(newFs);
      onFsChange?.(newFs);
    },
    [onFsChange]
  );
  const [cwd, setCwd] = useState('/home/penguin');
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'system', text: 'Linux Odyssey v2.0 — type `help` to begin' },
    { type: 'system', text: 'Last login: Thu Jun 18 10:00:00 2026 from penguin.local' },
  ]);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('normal');
  const [nanoState, setNanoState] = useState<NanoState | null>(null);
  const [vimState, setVimState] = useState<VimState | null>(null);
  const [theme, setTheme] = useState('classic');
  const [mascotMood, setMascotMood] = useState<'idle' | 'happy' | 'sad' | 'excited' | 'thinking'>(
    'idle'
  );
  const [showThemePicker, setShowThemePicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const currentTheme = themes[theme];
  const activeMascotMood =
    externalMascotMood && externalMascotMood !== 'idle' ? externalMascotMood : mascotMood;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, editorMode, nanoState, vimState]);

  useEffect(() => {
    if (mascotMood === 'idle' || mascotMood === 'thinking') return;
    const timer = setTimeout(() => setMascotMood('idle'), 2500);
    return () => clearTimeout(timer);
  }, [mascotMood]);

  const buildContext = useCallback(() => {
    return {
      fs,
      cwd,
      user: 'penguin',
      env: { HOME: '/home/penguin', PATH: '/usr/local/bin:/usr/bin:/bin', USER: 'penguin' },
      aliases: { ll: 'ls -la', la: 'ls -la', l: 'ls -l' },
      commandHistory,
    };
  }, [fs, cwd, commandHistory]);

  const saveFileContent = useCallback(
    (filePath: string, content: string) => {
      const newFs = cloneFs(fs);
      const node = getNode(newFs, filePath);
      if (node && node.type === 'file') {
        node.content = content;
      } else {
        const parent = getParent(newFs, filePath);
        if (parent) {
          const name = filePath.substring(filePath.lastIndexOf('/') + 1) || filePath;
          createNode(parent, name, 'file', content);
        }
      }
      changeFs(newFs);
      return newFs;
    },
    [fs, changeFs]
  );

  const executeRaw = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const context = buildContext();
      const result = executeCommand(trimmed, context);

      if (result.editorMode === 'nano' && result.nanoState) {
        setNanoState(result.nanoState);
        setEditorMode('nano');
        if (result.newFs) changeFs(result.newFs);
        return;
      }
      if (result.editorMode === 'vim' && result.vimState) {
        setVimState(result.vimState);
        setEditorMode('vim');
        if (result.newFs) changeFs(result.newFs);
        return;
      }

      if (result.output === '__CLEAR__') {
        setHistory([]);
      } else {
        const newLines: TerminalLine[] = [
          { type: 'input', text: `penguin@linux-odyssey:${cwd}$ ${trimmed}` },
        ];
        if (result.error) {
          newLines.push({ type: 'error', text: result.error });
        } else if (result.output && !result.skipOutput) {
          newLines.push({ type: 'output', text: result.output });
        }
        setHistory(prev => [...prev, ...newLines]);
      }

      if (result.newFs) changeFs(result.newFs);
      if (result.newCwd) setCwd(result.newCwd);

      setMascotMood(result.error ? 'sad' : 'happy');

      setCommandHistory(prev => [...prev, trimmed]);
      const nextCwd = result.newCwd || cwd;
      const nextFs = result.newFs || fs;
      onCommand?.(trimmed, {
        cwd: nextCwd,
        fs: nextFs,
        lastOutput: result.output,
        lastError: result.error,
      });
    },
    [buildContext, changeFs, cwd, fs, onCommand]
  );

  const readFile = useCallback(
    (path: string) => {
      const node = getNode(fs, resolvePath(cwd, path));
      return node?.type === 'file' ? (node.content ?? '') : '';
    },
    [fs, cwd]
  );
  const writeFile = useCallback(
    (path: string, content: string) => {
      saveFileContent(resolvePath(cwd, path), content);
    },
    [cwd, saveFileContent]
  );

  useImperativeHandle(ref, () => ({ runCommand: executeRaw, readFile, writeFile }), [
    executeRaw,
    readFile,
    writeFile,
  ]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeRaw(input);
      setInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const index = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setInput(commandHistory[index]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const index = Math.min(commandHistory.length - 1, historyIndex + 1);
      setHistoryIndex(index);
      setInput(commandHistory[index]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion();
    }
  };

  const commonPrefix = (strings: string[]): string => {
    if (strings.length === 0) return '';
    let prefix = strings[0];
    for (const s of strings.slice(1)) {
      while (!s.startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
        if (prefix === '') return '';
      }
    }
    return prefix;
  };

  const parseCompletionPath = (arg: string): { dirPath: string; filePrefix: string } => {
    const lastSlash = arg.lastIndexOf('/');
    if (lastSlash === -1) {
      return { dirPath: cwd, filePrefix: arg };
    }
    const dirPart = arg.slice(0, lastSlash);
    const filePrefix = arg.slice(lastSlash + 1);
    return { dirPath: resolvePath(cwd, dirPart || '.'), filePrefix };
  };

  const handleTabCompletion = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) {
      const commands = getCommandNames();
      const matches = commands.filter(c => c.startsWith(trimmed));
      if (matches.length === 1) {
        setInput(matches[0] + ' ');
      } else if (matches.length > 1) {
        const prefix = commonPrefix(matches);
        if (prefix.length > trimmed.length) {
          setInput(prefix);
        }
        setHistory(prev => [...prev, { type: 'system', text: matches.join('  ') }]);
      }
      return;
    }

    const cmd = trimmed.slice(0, spaceIndex);
    const rest = trimmed.slice(spaceIndex + 1);
    const lastArg = rest.split(' ').pop() || '';
    const { dirPath, filePrefix } = parseCompletionPath(lastArg);
    const dirNode = getNode(fs, dirPath);
    if (!dirNode || dirNode.type !== 'dir') return;

    const children = dirNode.children?.map(c => c.name) || [];
    const matches = children.filter(c => c.startsWith(filePrefix) && !c.startsWith('.'));

    if (matches.length === 1) {
      const match = matches[0];
      const suffix = lastArg.endsWith('/')
        ? match
        : lastArg.slice(0, lastArg.length - filePrefix.length) + match;
      const newRest = rest.slice(0, rest.length - lastArg.length) + suffix;
      setInput(`${cmd} ${newRest}`);
    } else if (matches.length > 1) {
      const prefix = commonPrefix(matches);
      if (prefix.length > filePrefix.length) {
        const suffix = lastArg.slice(0, lastArg.length - filePrefix.length) + prefix;
        const newRest = rest.slice(0, rest.length - lastArg.length) + suffix;
        setInput(`${cmd} ${newRest}`);
      }
      setHistory(prev => [...prev, { type: 'system', text: matches.join('  ') }]);
    }
  };

  const handleClick = () => {
    inputRef.current?.focus();
  };

  const handleNanoSave = () => {
    if (!nanoState) return;
    saveFileContent(nanoState.filePath, nanoState.content);
    setNanoState({ ...nanoState, cursor: nanoState.content.length });
  };

  const handleNanoExit = () => {
    setNanoState(null);
    setEditorMode('normal');
  };

  const handleNanoKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      handleNanoSave();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      handleNanoExit();
    }
  };

  const handleVimSave = () => {
    if (!vimState) return;
    saveFileContent(vimState.filePath, vimState.content);
    setVimState({ ...vimState, message: 'saved' });
  };

  const handleVimExit = (save = false) => {
    if (save && vimState) {
      saveFileContent(vimState.filePath, vimState.content);
    }
    setVimState(null);
    setEditorMode('normal');
  };

  const handleVimKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (vimState?.mode === 'normal') {
      if (e.key === 'i') {
        e.preventDefault();
        setVimState({ ...vimState, mode: 'insert' });
      } else if (e.key === 'Escape') {
        setVimState({ ...vimState, mode: 'normal' });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setVimState(prev => (prev ? { ...prev, mode: 'normal' } : null));
    }
  };

  const isCrt = theme === 'crt';
  const crtTextShadow = isCrt ? '0 0 4px currentColor, 0 0 8px currentColor' : undefined;
  const promptStyle = { color: currentTheme.green, textShadow: crtTextShadow };
  const outputStyle = { color: currentTheme.text, textShadow: crtTextShadow };
  const errorStyle = { color: currentTheme.red, textShadow: crtTextShadow };
  const systemStyle = { color: currentTheme.dim, textShadow: crtTextShadow };

  const renderAnsi = (text: string, baseStyle: React.CSSProperties) => {
    return parseAnsi(text).map((seg, i) => (
      <span
        key={i}
        style={{
          ...baseStyle,
          color: seg.color || baseStyle.color,
          fontWeight: seg.bold ? 'bold' : baseStyle.fontWeight,
          fontStyle: seg.italic ? 'italic' : baseStyle.fontStyle,
        }}
      >
        {seg.text}
      </span>
    ));
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-mono text-[15px] relative ${
        isCrt ? 'crt-scanlines crt-flicker' : ''
      }`}
      style={{
        height,
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
        borderColor: currentTheme.surfaceLight,
      }}
      aria-label="Терминал Linux Odyssey"
      role="region"
    >
      {}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/5 glass relative z-10"
        style={{ borderColor: currentTheme.surfaceLight }}
      >
        <div className="flex items-center gap-3">
          <PenguinMascot mood={activeMascotMood} size={40} />
          <div className="flex gap-2" aria-hidden="true">
            <div
              className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: currentTheme.red, color: currentTheme.red }}
            />
            <div
              className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: currentTheme.yellow, color: currentTheme.yellow }}
            />
            <div
              className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: currentTheme.green, color: currentTheme.green }}
            />
          </div>
          <span className="text-xs font-medium opacity-80" style={{ color: currentTheme.dim }}>
            penguin@linux-odyssey: {cwd}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="p-1.5 rounded-md hover:opacity-80 transition-opacity"
            style={{ color: currentTheme.dim }}
            title="Change theme"
            aria-label="Сменить тему терминала"
            aria-expanded={showThemePicker}
          >
            <Palette className="w-4 h-4" aria-hidden="true" />
          </button>
          <AnimatePresence>
            {showThemePicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 rounded-lg border shadow-xl z-50 py-1 min-w-[140px]"
                style={{
                  backgroundColor: currentTheme.surface,
                  borderColor: currentTheme.surfaceLight,
                }}
              >
                {Object.entries(themes).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme(key);
                      setShowThemePicker(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: currentTheme.text }}
                  >
                    {theme === key ? '● ' : '○ '}
                    {t.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {}
      <div
        className="flex-1 p-4 overflow-y-auto cursor-text"
        onClick={handleClick}
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Вывод терминала"
      >
        {editorMode === 'normal' && (
          <>
            {history.map((line, i) => (
              <div key={i} className="mb-1 whitespace-pre-wrap">
                {line.type === 'input' && renderAnsi(line.text, promptStyle)}
                {line.type === 'output' && renderAnsi(line.text, outputStyle)}
                {line.type === 'error' && renderAnsi(line.text, errorStyle)}
                {line.type === 'system' && renderAnsi(line.text, systemStyle)}
              </div>
            ))}

            <div className="flex items-center mt-2" style={promptStyle}>
              <span className="shrink-0" aria-hidden="true">
                penguin@linux-odyssey:{cwd}${' '}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none ml-1 drop-shadow-[0_0_8px_currentColor]"
                style={{
                  color: currentTheme.text,
                  caretColor: currentTheme.green,
                  textShadow: crtTextShadow,
                }}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                aria-label="Введите команду Linux"
              />
            </div>
          </>
        )}

        {editorMode === 'nano' && nanoState && (
          <NanoEditor
            state={nanoState}
            theme={currentTheme}
            editorRef={editorRef}
            onSave={handleNanoSave}
            onExit={handleNanoExit}
            onKeyDown={handleNanoKeyDown}
            onContentChange={(content, cursor) => setNanoState({ ...nanoState, content, cursor })}
          />
        )}

        {editorMode === 'vim' && vimState && (
          <VimEditor
            state={vimState}
            theme={currentTheme}
            editorRef={editorRef}
            onSave={handleVimSave}
            onExitSave={() => handleVimExit(true)}
            onExitDiscard={() => handleVimExit(false)}
            onKeyDown={handleVimKeyDown}
            onContentChange={content => setVimState({ ...vimState, content })}
          />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
});
