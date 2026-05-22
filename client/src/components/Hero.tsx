import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star } from '@phosphor-icons/react'

// ─── Variants ──────────────────────────────────────────────────────────────────

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

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=85',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=85',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=85',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&q=85',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1600&q=85',
]

// ─── BackgroundSlideshow ────────────────────────────────────────────────────────

function BackgroundSlideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % BG_IMAGES.length), 5500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="sync">
        <motion.img
          key={current}
          src={BG_IMAGES[current]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1.1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.4, ease: 'easeInOut' },
            scale: { duration: 7, ease: 'linear' },
          }}
        />
      </AnimatePresence>
    </div>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────────

export default function Hero() {
  return (
    <section className="relative bg-white dark:bg-neutral-950 min-h-[100dvh] overflow-hidden transition-colors duration-300">

      {/* ── Full-section background slideshow ── */}
      <BackgroundSlideshow />

      {/* ── Mobile overlay: semi-opaque for readability ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none lg:hidden bg-white/82 dark:bg-neutral-950/88" />

      {/* ── Desktop light mode: white solid left → transparent right ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none hidden lg:block dark:hidden"
        style={{
          background:
            'linear-gradient(to right, white 0%, white 32%, rgba(255,255,255,0.72) 48%, rgba(255,255,255,0.18) 62%, transparent 75%)',
        }}
      />

      {/* ── Desktop dark mode: neutral-950 solid left → transparent right ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none hidden lg:dark:block"
        style={{
          background:
            'linear-gradient(to right, #0a0a0a 0%, #0a0a0a 32%, rgba(10,10,10,0.72) 48%, rgba(10,10,10,0.18) 62%, transparent 75%)',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-[2] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[72px] md:pt-[80px]">
        <div className="grid lg:grid-cols-2 min-h-[calc(100dvh-80px)] items-center">

          {/* ── LEFT: Text ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="py-16 lg:py-24 pr-6 xl:pr-16 text-center lg:text-left space-y-8"
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
                  English.
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-slate-600 dark:text-neutral-300 text-lg leading-relaxed max-w-[420px] mx-auto lg:mx-0"
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
                className="inline-flex items-center justify-center gap-3 text-slate-700 dark:text-neutral-200 font-semibold px-8 py-4 rounded-2xl border border-slate-200 dark:border-neutral-700 hover:border-violet-300 dark:hover:border-violet-600 bg-white/70 dark:bg-white/5 backdrop-blur-sm transition-all"
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
                <p className="text-sm text-slate-600 dark:text-neutral-400">
                  {'4.9 · 10,000+ students'}
                </p>
              </div>

              <div className="hidden sm:block w-px h-10 bg-slate-300 dark:bg-neutral-700" />

              <div className="text-left">
                <p className="text-base font-black text-slate-900 dark:text-white">95%</p>
                <p className="text-sm text-slate-600 dark:text-neutral-400">Success rate</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: empty — image shows through gradient ── */}
          <div />

        </div>
      </div>

      {/* ── Scroll cue ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1.5 z-[2]"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border-2 border-slate-400 dark:border-neutral-600 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-violet-500 dark:bg-violet-400" />
        </motion.div>
      </motion.div>

    </section>
  )
}
