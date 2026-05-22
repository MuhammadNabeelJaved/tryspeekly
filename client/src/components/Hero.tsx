import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star } from '@phosphor-icons/react'

// ─── Variants (left side) ──────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&q=80',
]

interface CardData {
  img: string
  label: string
  sub: string
}

const CARDS_COL_A: CardData[] = [
  {
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
    label: 'Speaking',
    sub: 'Fluency Training',
  },
  {
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
    label: 'IELTS Prep',
    sub: 'Band 8+ Guarantee',
  },
  {
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
    label: 'Grammar',
    sub: 'Zero to Hero',
  },
  {
    img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80',
    label: 'Business English',
    sub: 'Professional Track',
  },
  {
    img: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&q=80',
    label: 'Writing',
    sub: 'Academic Level',
  },
]

const CARDS_COL_B: CardData[] = [
  {
    img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80',
    label: 'Vocabulary',
    sub: '5,000+ Words',
  },
  {
    img: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=80',
    label: 'Online Classes',
    sub: 'Live Sessions',
  },
  {
    img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80',
    label: 'Conversation',
    sub: 'Real-world English',
  },
  {
    img: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80',
    label: 'Pronunciation',
    sub: 'Native Accent',
  },
  {
    img: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=400&q=80',
    label: 'Reading',
    sub: 'Speed Reading',
  },
]

// ─── ScrollColumn ───────────────────────────────────────────────────────────────

function ScrollColumn({
  cards,
  direction = 'up',
  duration = 20,
}: {
  cards: CardData[]
  direction?: 'up' | 'down'
  duration?: number
}) {
  const doubled = [...cards, ...cards]
  return (
    <div className="flex-1 overflow-hidden relative">
      <motion.div
        animate={{ y: direction === 'up' ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity, repeatType: 'loop' }}
        className="flex flex-col gap-3"
      >
        {doubled.map((card, i) => (
          <div key={i} className="relative rounded-2xl overflow-hidden flex-shrink-0 w-full">
            <img
              src={card.img}
              alt={card.label}
              className="w-full h-[200px] sm:h-[225px] object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <span className="inline-block bg-violet-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                {card.label}
              </span>
              <p className="text-white/90 text-xs font-semibold leading-tight">{card.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white dark:from-neutral-950 to-transparent pointer-events-none z-10" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent pointer-events-none z-10" />
    </div>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────────

export default function Hero() {
  return (
    <section className="relative bg-white dark:bg-neutral-950 min-h-[100dvh] overflow-hidden transition-colors duration-300">

      {/* ── Ambient background glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-violet-200/40 dark:bg-violet-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-purple-200/30 dark:bg-purple-900/15 rounded-full blur-[80px]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[72px] md:pt-[80px]">
        <div className="grid lg:grid-cols-[52%_48%] min-h-[calc(100dvh-80px)] items-center gap-0">

          {/* ── LEFT: Text ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="py-16 lg:py-24 pr-6 xl:pr-12 text-center lg:text-left order-2 lg:order-1 space-y-8 relative"
          >
            {/* Label */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 justify-center lg:justify-start">
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span className="text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wide uppercase">
                25+ Years of Excellence
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={itemVariants}>
              <h1 className="text-5xl sm:text-6xl xl:text-[68px] font-black text-slate-900 dark:text-white leading-[1.0] tracking-tight">
                The Smarter Way
                <br />
                to Learn{' '}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
                    English.
                  </span>
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-slate-500 dark:text-neutral-400 text-lg leading-relaxed max-w-[420px] mx-auto lg:mx-0"
            >
              Expert-led sessions via Zoom & Google Meet — designed to get you speaking confidently, faster.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.03, boxShadow: '0 16px 40px rgba(124,58,237,0.45)' }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-all"
              >
                Start Learning
                <ArrowRight size={18} weight="bold" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-3 text-slate-700 dark:text-neutral-200 font-semibold px-8 py-4 rounded-2xl border border-slate-200 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-white/5 transition-all"
              >
                <span className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Play size={13} weight="fill" className="ml-0.5" />
                </span>
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-5 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2.5">
                {AVATARS.map(src => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="w-9 h-9 rounded-full border-2 border-white dark:border-neutral-950 object-cover"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={12} weight="fill" className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  {'4.9 · 10,000+ students'}
                </p>
              </div>

              <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-neutral-800" />

              <div className="text-left">
                <p className="text-base font-black text-slate-900 dark:text-white">95%</p>
                <p className="text-sm text-slate-500 dark:text-neutral-400">Success rate</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Infinite Scroll Columns ── */}
          <div className="relative order-1 lg:order-2 min-h-[calc(100dvh-80px)] flex items-center justify-center py-8 lg:py-0">
            <div className="w-full max-w-[440px] h-[340px] sm:h-[460px] lg:h-[560px] flex gap-3">
              <ScrollColumn cards={CARDS_COL_A} direction="up" duration={34} />
              <ScrollColumn cards={CARDS_COL_B} direction="down" duration={27} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Scroll cue ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1.5"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-neutral-600">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border-2 border-slate-300 dark:border-neutral-700 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-violet-500 dark:bg-violet-400" />
        </motion.div>
      </motion.div>

    </section>
  )
}
