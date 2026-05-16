import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'

// ─── Variants (left side — unchanged) ─────────────────────────────────────────

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
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
]

const CARD_STYLE: CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.11)',
}

const pad = (n: number) => String(n).padStart(2, '0')

// ─── Countdown utility ──────────────────────────────────────────────────────────

export function getTimeUntilNextClass(): { h: number; m: number; s: number } {
  const now = new Date()
  const target = new Date()
  target.setHours(18, 0, 0, 0)
  if (now > target) target.setDate(target.getDate() + 1)
  const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
  return {
    h: Math.floor(diff / 3600),
    m: Math.floor((diff % 3600) / 60),
    s: diff % 60,
  }
}

// ─── BackgroundSlideshow ────────────────────────────────────────────────────────

function BackgroundSlideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent(prev => (prev + 1) % BG_IMAGES.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl">
      <AnimatePresence mode="sync">
        <motion.img
          key={current}
          src={BG_IMAGES[current]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.08 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.8 },
            scale: { duration: 5, ease: 'linear' },
          }}
        />
      </AnimatePresence>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.62) 50%, rgba(10,10,10,0.80) 100%)',
        }}
      />
    </div>
  )
}

// ─── NextClassCard ─────────────────────────────────────────────────────────────

function NextClassCard() {
  const [time, setTime] = useState(getTimeUntilNextClass())

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeUntilNextClass()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
      className="col-start-1 col-end-3 row-start-1 row-end-3 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
      style={CARD_STYLE}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col h-full gap-3"
      >
        {/* LIVE badge */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live</span>
        </div>

        {/* Class info */}
        <div className="flex-1 flex flex-col justify-end gap-2">
          <p className="text-[10px] text-white/50 uppercase tracking-wider">📅 Next Live Class</p>
          <p className="text-lg font-black text-white leading-tight">IELTS Speaking Practice</p>
          <p className="text-[11px] text-white/60">Today · 6:00 PM</p>

          {/* Countdown */}
          <div
            className="rounded-xl px-3 py-2.5 mt-1"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <p className="text-[9px] text-violet-300 uppercase tracking-wider mb-1">Starts in</p>
            <div className="flex items-center gap-0.5 font-mono text-2xl font-black text-white">
              <span>{pad(time.h)}</span>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-violet-400"
              >:</motion.span>
              <span>{pad(time.m)}</span>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-violet-400"
              >:</motion.span>
              <span>{pad(time.s)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Small bento cards ──────────────────────────────────────────────────────────

function RatingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
      className="col-start-3 row-start-1 rounded-2xl p-4 flex flex-col justify-center gap-1"
      style={CARD_STYLE}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={10} weight="fill" className="text-yellow-400" />
          ))}
        </div>
        <p className="text-xl font-black text-white">4.9</p>
        <p className="text-[10px] text-white/50">1,200+ Reviews</p>
      </motion.div>
    </motion.div>
  )
}

function StreakCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
      className="col-start-3 row-start-2 rounded-2xl p-4 flex flex-col justify-center gap-1"
      style={CARD_STYLE}
    >
      <span className="text-xl">🏆</span>
      <p className="text-sm font-bold text-white leading-tight">7-Day Streak</p>
      <p className="text-[10px] text-white/50">Speaking Master</p>
    </motion.div>
  )
}

function CertificateCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.5, ease: 'easeOut' }}
      className="col-start-3 row-start-3 rounded-2xl p-4 flex flex-col justify-center gap-1"
      style={CARD_STYLE}
    >
      <span className="text-xl">✦</span>
      <p className="text-sm font-bold text-white leading-tight">Certificate</p>
      <p className="text-[10px] text-white/50">Awarded</p>
    </motion.div>
  )
}

function LearnersCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.95, duration: 0.5, ease: 'easeOut' }}
      className="col-start-2 row-start-3 rounded-2xl p-4 flex flex-col justify-center gap-1"
      style={CARD_STYLE}
    >
      <span className="text-xl">🎓</span>
      <p className="text-xl font-black text-white">50K+</p>
      <p className="text-[10px] text-white/50">Learners</p>
    </motion.div>
  )
}

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
            {/* Gradient fade on right edge to connect with slider */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/90 dark:from-neutral-950/90 to-transparent pointer-events-none" />
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
              Expert-led live sessions via Zoom & Google Meet — designed to get you speaking confidently, faster.
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
                  <img key={src} src={src} alt="" className="w-9 h-9 rounded-full border-2 border-white dark:border-neutral-950 object-cover" />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={12} weight="fill" className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  <span className="font-bold text-slate-900 dark:text-white">4.9</span> · 10,000+ students
                </p>
              </div>

              <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-neutral-800" />

              <div className="text-left">
                <p className="text-base font-black text-slate-900 dark:text-white">95%</p>
                <p className="text-sm text-slate-500 dark:text-neutral-400">Success rate</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Bento Grid (wired in Task 7) ── */}
          <div className="relative flex items-center justify-center order-1 lg:order-2 min-h-[calc(100dvh-80px)] py-8 lg:py-0">
            <div className="w-full max-w-[440px] h-[520px] rounded-3xl bg-neutral-900/20" />
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
