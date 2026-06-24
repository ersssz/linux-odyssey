import { motion } from 'framer-motion';
import { Award, Download, Share2, Check } from 'lucide-react';
import type { Rank } from '../utils/rank';

interface CertificateProps {
  userName: string;
  rank: Rank;
  completedChapters: number;
  totalChapters: number;
  xp: number;
  level: number;
  date: string;
  onClose?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  shared?: boolean;
}

export function Certificate({
  userName,
  rank,
  completedChapters,
  totalChapters,
  xp,
  level,
  date,
  onClose,
  onDownload,
  onShare,
  shared = false,
}: CertificateProps) {
  const isComplete = completedChapters === totalChapters;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-3xl mx-auto"
    >
      {}
      <div className="relative overflow-hidden border-[1px] border-[#444] bg-[#0a0a0a] p-8 sm:p-12 shadow-2xl rounded-sm">
        {}
        <div
          className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat opacity-30 mix-blend-lighten"
          style={{
            backgroundImage: `url('${import.meta.env.BASE_URL}gigachad.png?v=5')`,
            filter: 'grayscale(100%) brightness(1.2)',
          }}
        />

        {}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a] opacity-90" />

        <div className="relative z-20 text-center">
          <div className="text-xs uppercase tracking-[0.4em] text-[#888] mb-4 font-medium">
            Linux Administration Certificate
          </div>
          <h2 className="text-4xl sm:text-5xl font-light text-white mb-3 tracking-wide">
            LINUX ODYSSEY
          </h2>
          <p className="text-[#aaa] mb-10 font-mono text-sm">
            {isComplete ? 'СЕРВЕР ВОССТАНОВЛЕН И ЗАЩИЩЁН' : 'ДОСТУП ОТКЛОНЕН: КАМПАНИЯ НЕ ПРОЙДЕНА'}
          </p>

          <div className="backdrop-blur-sm bg-white/[0.02] border-[1px] border-white/10 p-8 mb-10 rounded-sm">
            <div className="text-xs text-[#666] font-mono uppercase tracking-widest mb-2">
              $ whoami
            </div>
            <div className="text-3xl font-semibold text-white mb-6 tracking-wide uppercase">
              {userName}
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-2 border-[1px] text-sm font-medium text-black border-white bg-white uppercase tracking-wider shadow-sm">
              <Award className="w-4 h-4" />
              {rank.title} · УРОВЕНЬ {rank.level}
            </div>
            <p className="text-sm text-[#888] mt-4 font-mono">{rank.blurb}</p>

            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

            <div className="grid grid-cols-3 gap-4 font-mono">
              <div className="text-center">
                <div className="text-4xl font-light text-white">
                  {completedChapters === totalChapters
                    ? '100%'
                    : `${Math.round((completedChapters / totalChapters) * 100)}%`}
                </div>
                <div className="text-[10px] text-[#666] uppercase mt-2 tracking-widest">
                  ПРОЙДЕНО
                </div>
              </div>
              <div className="text-center border-x-[1px] border-white/10">
                <div className="text-4xl font-light text-white">
                  {isComplete ? '4000' : Math.floor(xp / 100) * 100}
                </div>
                <div className="text-[10px] text-[#666] uppercase mt-2 tracking-widest">
                  XP POINTS
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-light text-white">{level}</div>
                <div className="text-[10px] text-[#666] uppercase mt-2 tracking-widest">LEVEL</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-[#666] font-mono mb-10 uppercase tracking-widest flex items-center justify-between border-t border-white/5 pt-4">
            <span>
              ISSUED: <span className="text-white/80">{date}</span>
            </span>
            <span className="text-white/40">_</span>
          </div>

          {isComplete && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center font-mono">
              <button
                onClick={onDownload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold hover:bg-[#e0e0e0] transition-colors uppercase tracking-widest rounded-sm"
              >
                <Download className="w-4 h-4" /> EXPORT PDF
              </button>
              <button
                onClick={onShare}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent border-[1px] border-white/30 text-white text-sm font-bold hover:bg-white/10 transition-colors uppercase tracking-widest rounded-sm"
              >
                {shared ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
                {shared ? 'COPIED' : 'SHARE'}
              </button>
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="mt-8 text-xs font-mono text-[#555] hover:text-white transition-colors uppercase tracking-widest"
            >
              [ EXIT ]
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
