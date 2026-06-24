import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, X, Loader2, AlertTriangle } from 'lucide-react';
import { fadeIn } from '../../utils/motion';

interface FileEditorProps {
  name: string;
  path: string;
  initialContent: string;
  busy?: boolean;
  error?: string | null;
  status?: string | null;
  onSave: (content: string) => void;
  onClose: () => void;
}

export function FileEditor({
  name,
  path,
  initialContent,
  busy = false,
  error = null,
  status = null,
  onSave,
  onClose,
}: FileEditorProps) {
  const [content, setContent] = useState(initialContent);
  const dirty = content !== initialContent;

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (dirty) onSave(content);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="show"
      className="bg-surface border border-surface-light rounded-xl h-full flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-light gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-terminal-cyan shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{name}</div>
            <div className="text-[11px] text-terminal-dim font-mono truncate">{path}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-terminal-dim hover:text-white hover:bg-surface-light transition-colors shrink-0"
          aria-label="Закрыть редактор"
          title="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoFocus
        aria-label={`Редактор файла ${name}`}
        className="flex-1 w-full bg-terminal-bg outline-none resize-none p-4 font-mono text-sm text-terminal-text leading-relaxed"
        placeholder="Пустой файл — начни печатать…"
      />

      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-surface-light">
        <div className="text-[11px] min-w-0 truncate">
          {error ? (
            <span className="text-terminal-red inline-flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </span>
          ) : status ? (
            <span className="text-terminal-green">{status}</span>
          ) : (
            <span className="text-terminal-dim">
              {dirty ? 'Есть несохранённые правки' : 'Сохранено в реальную ФС'}
              <span className="ml-2 hidden sm:inline text-terminal-dim/70">
                · Ctrl+S сохранить · Esc закрыть
              </span>
            </span>
          )}
        </div>
        <button
          onClick={() => onSave(content)}
          disabled={busy || !dirty}
          className="px-4 py-2 rounded-lg bg-terminal-green/90 text-terminal-bg font-semibold hover:bg-terminal-green disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shrink-0"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Сохранить
        </button>
      </div>
    </motion.div>
  );
}

interface EditorIo {
  read: (path: string) => Promise<string>;
  write: (path: string, content: string) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFileEditor({ read, write }: EditorIo) {
  const readRef = useRef(read);
  const writeRef = useRef(write);
  useEffect(() => {
    readRef.current = read;
    writeRef.current = write;
  });

  const [open, setOpen] = useState<{ name: string; path: string } | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const openFile = useCallback(async (name: string, path: string) => {
    setOpen({ name, path });
    setContent(null);
    setError(null);
    setStatus(null);
    try {
      setContent(await readRef.current(path));
    } catch {
      setError('Не удалось прочитать файл');
      setContent('');
    }
  }, []);

  const save = useCallback(
    async (text: string) => {
      const cur = open;
      if (!cur) return;
      setBusy(true);
      setError(null);
      try {
        await writeRef.current(cur.path, text);
        setStatus('Сохранено ✓');
      } catch {
        setError('Не удалось сохранить');
      } finally {
        setBusy(false);
      }
    },
    [open]
  );

  const close = useCallback(() => {
    setOpen(null);
    setContent(null);
    setError(null);
    setStatus(null);
  }, []);

  return { open, content, busy, error, status, openFile, save, close };
}
