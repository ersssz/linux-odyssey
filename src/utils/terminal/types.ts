import type { FileNode } from '../fileSystem';

export type EditorMode = 'normal' | 'nano' | 'vim';

export interface NanoState {
  filePath: string;
  content: string;
  cursor: number;
}

export interface VimState {
  filePath: string;
  content: string;
  mode: 'normal' | 'insert';
  message: string;
}

export interface TerminalContext {
  fs: FileNode;
  cwd: string;
  user: string;
  env: Record<string, string>;
  aliases: Record<string, string>;
  commandHistory: string[];
}

export interface CommandResult {
  output?: string;
  error?: string;
  newFs?: FileNode;
  newCwd?: string;
  newEnv?: Record<string, string>;
  newAliases?: Record<string, string>;
  skipOutput?: boolean;
  editorMode?: EditorMode;
  nanoState?: NanoState;
  vimState?: VimState;
  appendHistory?: boolean;
}

export interface CommandHandler {
  (args: string[], ctx: TerminalContext): CommandResult | string | undefined;
}

export interface CommandRegistry {
  [name: string]: CommandHandler;
}
