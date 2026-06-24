import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FileText, FileImage, FileCog, File as FileIcon, ChevronRight } from 'lucide-react';
import type { FileNode } from '../../utils/fileSystem';
import { easing, springSoft } from '../../utils/motion';

interface FilesystemCanvasProps {
  fs: FileNode;
  cwd: string;

  rootName?: string;

  onCd?: (target: string) => void;

  onOpenFile?: (name: string) => void;
}

function resolveDir(fs: FileNode, cwd: string, rootName: string): FileNode {
  if (cwd === rootName) return fs;
  const rel = cwd.startsWith(rootName) ? cwd.slice(rootName.length) : '';
  const parts = rel.split('/').filter(Boolean);
  let cur = fs;
  for (const part of parts) {
    const next = cur.children?.find(c => c.name === part && c.type === 'dir');
    if (!next) return fs; // cwd outside the captured subtree → show the root
    cur = next;
  }
  return cur;
}

function tileIcon(node: FileNode) {
  if (node.type === 'dir') return <Folder className="w-6 h-6 text-terminal-yellow" />;
  if (/\.(png|jpe?g|gif|svg|bmp)$/i.test(node.name))
    return <FileImage className="w-6 h-6 text-terminal-purple" />;
  if (/\.(sh|bin|run)$/i.test(node.name) || node.type === 'exec')
    return <FileCog className="w-6 h-6 text-terminal-green" />;
  if (/\.(txt|md|log|conf|cfg|json)$/i.test(node.name))
    return <FileText className="w-6 h-6 text-terminal-cyan" />;
  return <FileIcon className="w-6 h-6 text-terminal-dim" />;
}

export function FilesystemCanvas({
  fs,
  cwd,
  rootName = '/',
  onCd,
  onOpenFile,
}: FilesystemCanvasProps) {
  const dir = resolveDir(fs, cwd, rootName);
  const children = [
    ...(dir.children?.filter(c => c.type === 'dir') ?? []),
    ...(dir.children?.filter(c => c.type !== 'dir') ?? []),
  ];

  const rel = cwd.startsWith(rootName) ? cwd.slice(rootName.length) : '';
  const segments = rel.split('/').filter(Boolean);

  return (
    <div className="bg-surface border border-surface-light rounded-xl h-full flex flex-col overflow-hidden">
      {}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-surface-light flex-wrap">
        <Folder className="w-4 h-4 text-terminal-yellow shrink-0" />
        <button
          type="button"
          disabled={!onCd || segments.length === 0}
          onClick={() => onCd?.(rootName)}
          className={`font-mono text-sm text-terminal-yellow ${
            onCd && segments.length > 0 ? 'hover:underline cursor-pointer' : 'cursor-default'
          }`}
        >
          {rootName}
        </button>
        {segments.map((seg, i) => {
          const last = i === segments.length - 1;
          const abs = `${rootName}/${segments.slice(0, i + 1).join('/')}`;
          return (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-terminal-dim" />
              <button
                type="button"
                disabled={!onCd || last}
                onClick={() => onCd?.(abs)}
                className={`font-mono text-sm ${
                  last ? 'text-terminal-green font-semibold cursor-default' : 'text-terminal-dim'
                } ${onCd && !last ? 'hover:text-white hover:underline cursor-pointer' : ''}`}
              >
                {seg}
              </button>
            </span>
          );
        })}
        <span className="ml-auto text-[10px] uppercase tracking-wide text-terminal-dim">
          вы здесь
        </span>
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-3">
        {children.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center text-terminal-dim">
            <Folder className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Каталог пуст</p>
            <p className="text-xs mt-1">Создай файл — он появится здесь вживую</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <AnimatePresence mode="popLayout">
              {children.map(node => {
                const isDirNode = node.type === 'dir';
                const clickable = isDirNode ? !!onCd : !!onOpenFile;
                const Tile = clickable ? motion.button : motion.div;
                return (
                  <Tile
                    key={node.name}
                    layout
                    type={clickable ? 'button' : undefined}
                    onClick={
                      clickable
                        ? () => (isDirNode ? onCd?.(node.name) : onOpenFile?.(node.name))
                        : undefined
                    }
                    title={
                      clickable
                        ? isDirNode
                          ? `Открыть ${node.name}`
                          : `Редактировать ${node.name}`
                        : node.name
                    }
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.3, ease: easing.outExpo }}
                    whileHover={{ y: -2, transition: springSoft }}
                    whileTap={clickable ? { scale: 0.96 } : undefined}
                    className={`relative flex flex-col gap-1.5 p-3 rounded-lg border text-left w-full ${
                      isDirNode
                        ? 'bg-terminal-yellow/[0.06] border-terminal-yellow/20'
                        : 'bg-terminal-bg border-surface-light'
                    } ${clickable ? 'cursor-pointer hover:border-accent/60' : ''}`}
                  >
                    <div className="flex items-start justify-between">{tileIcon(node)}</div>
                    <span
                      className="font-mono text-xs text-terminal-text truncate"
                      title={node.name}
                    >
                      {node.name}
                    </span>
                  </Tile>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-surface-light text-[11px] text-terminal-dim">
        {children.length} {children.length === 1 ? 'объект' : 'объектов'} в каталоге · обновляется в
        реальном времени
      </div>
    </div>
  );
}
