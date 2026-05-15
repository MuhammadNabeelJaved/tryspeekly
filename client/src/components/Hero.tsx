import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star } from '@phosphor-icons/react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const WAVE_BARS = [
  { minH: 3, maxH: 14, dur: 0.6, delay: 0 },
  { minH: 5, maxH: 18, dur: 0.5, delay: 0.1 },
  { minH: 3, maxH: 10, dur: 0.7, delay: 0.05 },
  { minH: 7, maxH: 20, dur: 0.4, delay: 0.15 },
  { minH: 4, maxH: 14, dur: 0.6, delay: 0.2 },
  { minH: 2, maxH: 9, dur: 0.8, delay: 0.08 },
] as const

const LESSONS_LIVE = [
  { label: 'Reading Comprehension', status: 'done'    as const },
  { label: 'Listening Practice',    status: 'done'    as const },
  { label: 'Speaking Module',       status: 'active'  as const },
  { label: 'Writing Task 2',        status: 'pending' as const },
]

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&q=80',
]

function SoundWave() {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-[3px]">
      {WAVE_BARS.map((bar, i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-violet-400 rounded-full"
          style={{ height: bar.minH }}
          animate={{ height: [bar.minH, bar.maxH, bar.minH] }}
          transition={{ duration: bar.dur, delay: bar.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function TimerColon() {
  return (
    <motion.span
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="mx-[1px]"
    >
      :
    </motion.span>
  )
}

function LessonDot({ status }: { status: 'done' | 'active' | 'pending' }) {
  if (status === 'done') {
    return <div className="w-[7px] h-[7px] rounded-full bg-violet-600 flex-shrink-0" />
  }
  if (status === 'active') {
    return (
      <motion.div
        className="w-[7px] h-[7px] rounded-full bg-violet-400 flex-shrink-0"
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    )
  }
  return <div className="w-[7px] h-[7px] rounded-full bg-white/10 flex-shrink-0" />
}

function FloatingBadge({
  children,
  delay,
  floatDur,
  floatDelay,
  className = '',
}: {
  children: ReactNode
  delay: number
  floatDur: number
  floatDelay: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'backOut' }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: floatDur, delay: floatDelay, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl px-3 py-2.5"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        {children}
      </motion.div>
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
        <div className="grid lg:grid-cols-[52%_48%] min-h-[calc(100dvh-80px)] items-center gap-8 lg:gap-0">

          {/* ── LEFT: Text ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="py-16 lg:py-24 lg:pr-12 xl:pr-20 text-center lg:text-left order-2 lg:order-1 space-y-8"
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

          {/* ── RIGHT: Live Classroom Scene ── */}
          <div className="relative flex items-center justify-center order-1 lg:order-2 py-10 lg:py-0 min-h-[500px]">

            {/* Dark scene container — overflow-hidden keeps glow inside */}
            <div className="relative w-full max-w-[300px] mx-auto rounded-3xl bg-neutral-950 overflow-hidden p-6 min-h-[440px] flex items-center justify-center">

              {/* Breathing glow orb */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 65%)' }}
              />

              {/* Dot grid — top right */}
              <div
                className="absolute top-6 right-6 w-24 h-24 opacity-40 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }}
              />
              {/* Dot grid — bottom left */}
              <div
                className="absolute bottom-6 left-6 w-16 h-16 opacity-25 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }}
              />

              {/* ── Main glassmorphism card ── */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                className="relative z-10 w-full"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '24px',
                  padding: '20px',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[9px] text-neutral-400 font-bold tracking-[1.5px] uppercase mb-1">
                      Live Session
                    </p>
                    <h3 className="text-[13px] font-extrabold text-white leading-tight">
                      IELTS Speaking Practice
                    </h3>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] text-red-400 font-bold tracking-wide">REC</span>
                  </div>
                </div>

                {/* Video grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {/* Instructor tile — speaking */}
                  <div
                    className="relative rounded-2xl h-[72px] flex items-center justify-center overflow-hidden"
                    style={{
                      background: 'rgba(124,58,237,0.25)',
                      border: '2px solid rgba(124,58,237,0.6)',
                      boxShadow: '0 0 16px rgba(124,58,237,0.3)',
                    }}
                  >
                    <span className="absolute top-1.5 left-2 text-[8px] text-violet-300 font-bold">
                      Speaking
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                    >
                      S
                    </div>
                    <SoundWave />
                  </div>

                  {/* Student tile — listening */}
                  <div
                    className="relative rounded-2xl h-[72px] flex items-center justify-center"
                    style={{ background: 'rgba(30,27,60,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white"
                      style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}
                    >
                      A
                    </div>
                  </div>
                </div>

                {/* Timer row */}
                <div className="flex justify-center mb-4">
                  <div
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
                  >
                    <span className="text-[12px]">⏱</span>
                    <span className="text-[15px] font-extrabold text-violet-300 tabular-nums flex items-center">
                      12<TimerColon />45
                    </span>
                    <span className="text-[9px] text-neutral-500">remaining</span>
                  </div>
                </div>

                {/* AI Fluency Score */}
                <div
                  className="mb-3 rounded-2xl p-3"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-neutral-400 font-semibold">✦ AI Fluency Score</span>
                    <span className="text-[13px] font-black text-violet-300">8.2 / 9.0</span>
                  </div>
                  <div
                    className="h-[5px] rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '82%' }}
                      transition={{ delay: 1.2, duration: 1.3, ease: 'easeOut' }}
                      className="h-full rounded-full relative overflow-hidden"
                      style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)' }}
                    >
                      {/* Shimmer overlay — translates across after bar fills */}
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, delay: 2.7, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)' }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Lesson list */}
                <div>
                  {LESSONS_LIVE.map((lesson, i) => (
                    <div
                      key={lesson.label}
                      className="flex items-center gap-2 py-2"
                      style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : undefined }}
                    >
                      <LessonDot status={lesson.status} />
                      <span className={`text-[10px] flex-1 leading-tight ${
                        lesson.status === 'done'
                          ? 'line-through text-neutral-600'
                          : lesson.status === 'active'
                          ? 'text-violet-200 font-bold'
                          : 'text-neutral-700'
                      }`}>
                        {lesson.label}
                      </span>
                      {lesson.status === 'active' && (
                        <span
                          className="text-[8px] font-bold text-violet-400 px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(124,58,237,0.2)' }}
                        >
                          TODAY
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── Floating badges — outside the dark container so they can overflow ── */}

            {/* Rating — top right */}
            <FloatingBadge
              delay={0.8}
              floatDur={3.5}
              floatDelay={1.5}
              className="absolute top-[6%] right-[4%] sm:right-[8%] lg:right-[2%] z-20"
            >
              <div className="text-center">
                <p className="text-[8px] text-neutral-400 uppercase tracking-wider mb-0.5">Avg Score</p>
                <p className="text-lg font-black text-yellow-400">4.9 ★</p>
                <p className="text-[8px] text-neutral-500">1,200+ Reviews</p>
              </div>
            </FloatingBadge>

            {/* Learners — bottom left */}
            <FloatingBadge
              delay={1.1}
              floatDur={3.8}
              floatDelay={2.0}
              className="absolute bottom-[6%] left-[4%] sm:left-[8%] lg:left-[2%] z-20"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: 'rgba(124,58,237,0.25)' }}
                >
                  🎓
                </div>
                <div>
                  <p className="text-[13px] font-black text-white">50K+</p>
                  <p className="text-[8px] text-neutral-500 uppercase tracking-wider">Learners</p>
                </div>
              </div>
            </FloatingBadge>

            {/* Certificate — mid right */}
            <FloatingBadge
              delay={1.4}
              floatDur={3.2}
              floatDelay={1.8}
              className="absolute top-[48%] right-[2%] lg:right-[-2%] -translate-y-1/2 z-20 hidden sm:block"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: 'rgba(251,191,36,0.15)' }}
                >
                  🏆
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white">Certificate</p>
                  <p className="text-[8px] text-neutral-500 uppercase tracking-wider">Awarded</p>
                </div>
              </div>
            </FloatingBadge>

            {/* Band score — top left */}
            <FloatingBadge
              delay={1.6}
              floatDur={4.0}
              floatDelay={2.2}
              className="absolute top-[20%] left-[2%] lg:left-[-2%] z-20"
            >
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-emerald-400 font-black text-sm">↑</span>
                  <span className="text-[11px] font-extrabold text-emerald-400">+1.5 Band</span>
                </div>
                <p className="text-[8px] text-neutral-500">Score improved</p>
              </div>
            </FloatingBadge>

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
