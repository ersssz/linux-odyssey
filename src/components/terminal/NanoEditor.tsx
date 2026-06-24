import type { KeyboardEvent, RefObject } from 'react';
import { Save, X, TerminalSquare } from 'lucide-react';
import type { Theme } from './themes';
import type { NanoState } from '../../utils/terminal';

interface NanoEditorProps {
  state: NanoState;
  theme: Theme;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  onSave: () => void;
  onExit: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onContentChange: (content: string, cursor: number) => void;
}

export function NanoEditor({
  state,
  theme,
  editorRef,
  onSave,
  onExit,
  onKeyDown,
  onContentChange,
}: NanoEditorProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2" style={{ color: theme.green }}>
          <TerminalSquare className="w-4 h-4" aria-hidden="true" />
          <span className="font-bold">GNU nano 7.2</span>
          <span style={{ color: theme.dim }}>{state.filePath}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs"
            style={{ backgroundColor: theme.green, color: theme.bg }}
          >
            <Save className="w-3 h-3" /> Save (Ctrl+O)
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs"
            style={{ backgroundColor: theme.red, color: theme.bg }}
          >
            <X className="w-3 h-3" /> Exit (Ctrl+X)
          </button>
        </div>
      </div>
      <textarea
        ref={editorRef}
        value={state.content}
        onChange={e => onContentChange(e.target.value, e.target.selectionStart)}
        onKeyDown={onKeyDown}
        className="flex-1 w-full bg-transparent outline-none resize-none p-2 rounded border font-mono text-sm"
        style={{
          borderColor: theme.surfaceLight,
          color: theme.text,
          backgroundColor: theme.surface,
        }}
        autoFocus
        spellCheck={false}
        aria-label={`Редактор nano, файл ${state.filePath}`}
      />
      <div className="mt-2 text-xs" style={{ color: theme.dim }}>
        Ctrl+O Save | Ctrl+X Exit
      </div>
    </div>
  );
}
