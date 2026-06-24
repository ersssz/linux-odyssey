import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Certificate } from '../components/Certificate';
import { useGame } from '../hooks/useGame';
import { campaign, totalCampaignSteps, stepKey } from '../data/campaign';
import { rankFor } from '../utils/rank';

function downloadCertificatePng(opts: {
  name: string;
  rank: string;
  chapters: string;
  xp: number;
  level: number;
  date: string;
}) {
  const W = 1200;
  const H = 848;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const drawText = () => {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, 12);

    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    ctx.textAlign = 'center';
    const cx = W / 2;

    ctx.fillStyle = '#888888';
    ctx.font = '500 18px monospace';
    ctx.fillText('LINUX ADMINISTRATION CERTIFICATE', cx, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = '300 80px monospace';
    ctx.fillText('LINUX ODYSSEY', cx, 230);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '400 24px monospace';
    ctx.fillText('СЕРВЕР ВОССТАНОВЛЕН И ЗАЩИЩЁН', cx, 290);

    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(cx - 400, 350, 800, 350);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 400, 350, 800, 350);

    ctx.fillStyle = '#666666';
    ctx.font = '16px monospace';
    ctx.fillText('$ whoami', cx, 400);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 50px monospace';
    ctx.fillText(opts.name, cx, 470);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 250, 500, 500, 40);
    ctx.fillStyle = '#000000';
    ctx.font = '500 18px monospace';
    ctx.fillText(`${opts.rank} · УРОВЕНЬ ${opts.level}`, cx, 526);

    const stats = [
      { v: opts.chapters, l: 'ГЛАВ' },
      { v: String(opts.xp), l: 'XP POINTS' },
      { v: String(opts.level), l: 'LEVEL' },
    ];
    const sw = 220;
    const startX = cx - sw;
    stats.forEach((s, i) => {
      const x = startX + i * sw;
      ctx.fillStyle = '#ffffff';
      ctx.font = '300 56px monospace';
      ctx.fillText(s.v, x, 630);
      ctx.fillStyle = '#666666';
      ctx.font = '400 14px monospace';
      ctx.fillText(s.l, x, 660);
    });

    ctx.fillStyle = '#666666';
    ctx.font = '16px monospace';
    ctx.fillText(`ISSUED: ${opts.date}`, cx, 750);

    const imgData = canvas.toDataURL('image/png', 1.0);
    import('jspdf').then(({ jsPDF }) => {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [W, H],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, W, H);
      pdf.save(`linux-odyssey-gigachad-${opts.name.replace(/\s+/g, '-') || 'admin'}.pdf`);
    });
  };

  const img = new Image();
  img.crossOrigin = 'anonymous';
  const base = import.meta.env.BASE_URL;
  img.src = `${base}gigachad.png?v=5`;
  img.onload = () => {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    ctx.filter = 'grayscale(100%) brightness(1.2)';
    ctx.globalAlpha = 0.1;
    ctx.drawImage(img, 0, 0, W, H);
    ctx.filter = 'none';
    ctx.globalAlpha = 1.0;
    drawText();
  };
  img.onerror = () => {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);
    drawText();
  };
  img.src = `${base}gigachad.png`;
}

export default function CertificatePage() {
  const navigate = useNavigate();
  const { state } = useGame();
  const [shared, setShared] = useState(false);

  const chaptersWithSteps = campaign.filter(ch => ch.steps.length > 0);
  const completedChapters = chaptersWithSteps.filter(ch =>
    ch.steps.every(s => state.completed.has(stepKey(s.id)))
  ).length;
  const totalChapters = chaptersWithSteps.length;
  const completedSteps = campaign
    .flatMap(c => c.steps)
    .filter(s => state.completed.has(stepKey(s.id))).length;
  const rank = rankFor(completedSteps, totalCampaignSteps);
  const userName = state.name.trim() || 'Безымянный админ';
  const date = new Date().toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownload = () =>
    downloadCertificatePng({
      name: userName,
      rank: rank.title,
      chapters: `${completedChapters}/${totalChapters}`,
      xp: state.xp,
      level: state.level,
      date,
    });

  const handleShare = () => {
    navigator.clipboard
      ?.writeText(
        `Я спас сервер в Linux Odyssey и получил звание «${rank.title}»! Уровень ${state.level}, ${state.xp} XP. 🐧`
      )
      .catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <motion.div
      key="certificate"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/learn')}
          className="text-sm text-terminal-dim hover:text-white transition-colors"
        >
          ← Назад к кампании
        </button>
      </div>
      <Certificate
        userName={userName}
        rank={rank}
        completedChapters={completedChapters}
        totalChapters={totalChapters}
        xp={state.xp}
        level={state.level}
        date={date}
        onDownload={handleDownload}
        onShare={handleShare}
        shared={shared}
        onClose={() => navigate('/learn')}
      />
    </motion.div>
  );
}
