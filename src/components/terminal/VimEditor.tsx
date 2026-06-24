import type { KeyboardEvent, RefObject } from 'react';
import { Save, X } from 'lucide-react';
import type { Theme } from './themes';
import type { VimState } from '../../utils/terminal';

interface VimEditorProps {
  state: VimState;
  theme: Theme;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  onSave: () => void;
  onExitSave: () => void;
  onExitDiscard: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onContentChange: (content: string) => void;
}

export function VimEditor({
  state,
  theme,
  editorRef,
  onSave,
  onExitSave,
  onExitDiscard,
  onKeyDown,
  onContentChange,
}: VimEditorProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold" style={{ color: theme.green }}>
            VIM
          </span>
          <span style={{ color: theme.dim }}>{state.filePath}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-bold"
            style={{
              backgroundColor: state.mode === 'insert' ? theme.green : theme.yellow,
              color: theme.bg,
            }}
          >
            {state.mode === 'insert' ? 'INSERT' : 'NORMAL'}
          </span>
          {state.message && <span style={{ color: theme.green }}>{state.message}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs"
            style={{ backgroundColor: theme.green, color: theme.bg }}
          >
            <Save className="w-3 h-3" /> Save (:w)
          </button>
          <button
            onClick={onExitSave}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs"
            style={{ backgroundColor: theme.yellow, color: theme.bg }}
          >
            Save & Exit (:wq)
          </button>
          <button
            onClick={onExitDiscard}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs"
            style={{ backgroundColor: theme.red, color: theme.bg }}
          >
            <X className="w-3 h-3" /> Exit (:q!)
          </button>
        </div>
      </div>
      <textarea
        ref={editorRef}
        value={state.content}
        onChange={e => onContentChange(e.target.value)}
        onKeyDown={onKeyDown}
        readOnly={state.mode === 'normal'}
        className="flex-1 w-full bg-transparent outline-none resize-none p-2 rounded border font-mono text-sm"
        style={{
          borderColor: theme.surfaceLight,
          color: theme.text,
          backgroundColor: theme.surface,
        }}
        autoFocus
        spellCheck={false}
        aria-label={`Редактор vim, файл ${state.filePath}`}
      />
      <div className="mt-2 text-xs" style={{ color: theme.dim }}>
        i = insert | Esc = normal | :w save | :wq save & exit | :q! exit without save
      </div>
    </div>
  );
}
