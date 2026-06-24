import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router';
import { ChevronRight, Cpu, ArrowRight, MousePointerClick, Eye, ListChecks } from 'lucide-react';
import { HeroTerminal } from '../components/landing/HeroTerminal';
import { VizShowcase } from '../components/landing/VizShowcase';
import { totalCampaignSteps, campaign } from '../data/campaign';
interface LandingPageProps {
  onStart: () => void;
}

const STATS = [
  { value: String(campaign.length), label: 'глав кампании' },
  { value: String(totalCampaignSteps), label: 'заданий' },
  { value: '4', label: 'живые визуализации' },
  { value: '100%', label: 'настоящий Linux' },
];

const STEPS = [
  {
    icon: ListChecks,
    title: 'Выбери главу',
    desc: 'Сюжет «Спаси сервер»: от первого входа до сети — базовые команды переходят в продвинутые.',
  },
  {
    icon: Cpu,
    title: 'Выполни на настоящем ядре',
    desc: 'Команды исполняются на реальном Linux в браузере. Можно печатать или собирать мышью.',
  },
  {
    icon: Eye,
    title: 'Увидь результат вживую',
    desc: 'Файлы, права и процессы меняются на больших схемах — а задание засчитывается по реальному состоянию.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.1, margin: '0px 0px -50px 0px' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
};

const PARTICLES = [...Array(12)].map(() => ({
  duration: 20 + Math.random() * 30,
  delay: Math.random() * 15,
  left: `${Math.random() * 100}%`,
  symbol: ['{ }', '/>', '[]', '()', '01', '10', '&&', '||', '*', '~/'][
    Math.floor(Math.random() * 10)
  ],
}));

export function LandingPage({ onStart }: LandingPageProps) {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  const yBlob1 = useTransform(scrollYProgress, [0, 1], ['0%', '150%']);
  const yBlob2 = useTransform(scrollYProgress, [0, 1], ['0%', '-150%']);

  return (
    <div className="relative overflow-hidden">
      {}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-[0.15]" />
        <motion.div
          style={{ y: yBlob1 }}
          className="absolute -top-20 left-[6%] w-[38rem] h-[38rem] bg-terminal-green/20 rounded-full blur-[140px] opacity-40 will-change-transform"
        />
        <motion.div
          style={{ y: yBlob2 }}
          className="absolute top-[30%] right-[4%] w-[44rem] h-[44rem] bg-accent/20 rounded-full blur-[160px] opacity-40 will-change-transform"
        />

        {}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              initial={{ y: '110vh', opacity: 0 }}
              animate={{ y: '-10vh', opacity: [0, 1, 1, 0], rotate: [0, 360] }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'linear',
              }}
              className="absolute font-mono text-lg text-terminal-green/50 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] will-change-transform"
              style={{ left: p.left }}
            >
              {p.symbol}
            </motion.div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-terminal-bg/40 to-terminal-bg" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        {}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[88vh] py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-terminal-green/30 text-sm text-terminal-green mb-7 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-terminal-green" />
              </span>
              Настоящее ядро Linux прямо в браузере
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight leading-[1.05]">
              Linux,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-terminal-green via-terminal-cyan to-accent">
                который видно
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-terminal-dim mb-9 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Сюжетный тренажёр «Спаси сервер»: каждая команда выполняется на настоящем Linux, а её
              результат оживает в больших визуализациях. Не учебник — приключение.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <motion.button
                whileHover={{ y: -2, boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-terminal-green text-terminal-bg font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
              >
                Начать миссию
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/linux')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass hover-glow-accent text-white font-medium transition-all"
              >
                <Cpu className="w-5 h-5 text-terminal-green" /> Терминал
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            aria-hidden="true"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-terminal-green/20 to-accent/20 rounded-2xl blur-2xl opacity-60" />
            <div className="relative">
              <HeroTerminal />
            </div>
          </motion.div>
        </section>

        {}
        <motion.section
          {...fadeUp}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 border-y border-white/5 relative z-10"
        >
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tighter drop-shadow-md">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-terminal-dim uppercase tracking-wider font-semibold">
                {s.label}
              </div>
            </div>
          ))}
        </motion.section>

        {}
        <section className="py-20">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Четыре живые визуализации
            </h2>
            <p className="text-terminal-dim max-w-2xl mx-auto">
              Сердце проекта: большие схемы, которые реагируют на твои реальные команды. Не текст
              про Linux — Linux, который видно.
            </p>
          </motion.div>
          <VizShowcase />
        </section>

        {}
        <section className="py-16">
          <motion.h2
            {...fadeUp}
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-12"
          >
            Как это работает
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="relative p-6 rounded-2xl glass-panel hover-glow"
                >
                  <div className="absolute -top-3 -left-3 w-9 h-9 rounded-xl bg-terminal-green text-terminal-bg font-bold flex items-center justify-center shadow-lg">
                    {i + 1}
                  </div>
                  <div className="w-11 h-11 rounded-lg bg-surface-light flex items-center justify-center text-terminal-green mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-terminal-dim leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {}
        <motion.section {...fadeUp} className="py-16">
          <div className="relative overflow-hidden rounded-3xl glass-panel p-10 sm:p-14 text-center">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terminal-red/10 border border-terminal-red/30 text-sm text-terminal-red mb-5">
                <span className="font-mono">[ALERT]</span> прод-сервер взломан
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
                Сервер ждёт спасения
              </h2>
              <p className="text-terminal-dim mb-8 max-w-xl mx-auto text-lg">
                Пройди путь от первого входа до восстановления сети. Каждое задание засчитывается по
                реальному состоянию Linux — в конце ждёт сертификат.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStart}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-terminal-green text-terminal-bg font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
                >
                  Спасти сервер
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/fs-map')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass hover-glow-accent text-white font-medium transition-all"
                >
                  <MousePointerClick className="w-5 h-5 text-terminal-green" /> Карта файловой
                  системы
                </motion.button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
