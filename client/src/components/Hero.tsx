import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star, GraduationCap, Trophy } from '@phosphor-icons/react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&q=80',
]

const LESSONS = [
  { label: 'Reading Comprehension', done: true },
  { label: 'Listening Practice', done: true },
  { label: 'Writing Task 2', active: true },
  { label: 'Speaking Module', upcoming: true },
]

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

          {/* ── RIGHT: Dashboard card composition ── */}
          <div className="relative flex items-center justify-center order-1 lg:order-2 py-10 lg:py-24 min-h-[480px]">

            {/* Dot grid decoration */}
            <div
              className="absolute top-8 right-6 w-28 h-28 opacity-[0.15] dark:opacity-[0.08] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }}
            />
            <div
              className="absolute bottom-8 left-6 w-20 h-20 opacity-[0.1] dark:opacity-[0.06] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }}
            />

            {/* ── Main card: Course progress ── */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
              className="relative z-10 bg-white dark:bg-neutral-900 rounded-[28px] shadow-2xl shadow-slate-200/80 dark:shadow-black/40 border border-slate-100 dark:border-neutral-800 p-6 w-[300px] sm:w-[320px]"
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-0.5">Current Course</p>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">IELTS Academic Success</h3>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wide flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>

              {/* Instructor chip */}
              <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-950/40 rounded-2xl px-3 py-2.5 mb-5">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80"
                  alt="Sarah"
                  className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Sarah Johnson</p>
                  <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">IELTS Expert & Trainer</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500 dark:text-neutral-500 font-medium">Week 6 of 8</span>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">72% done</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '72%' }}
                    transition={{ delay: 1.1, duration: 1.3, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                  />
                </div>
              </div>

              {/* Lesson list */}
              <div className="space-y-3">
                {LESSONS.map((lesson, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {/* Status icon */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      lesson.done
                        ? 'bg-violet-600'
                        : lesson.active
                        ? 'ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-slate-900 bg-white dark:bg-neutral-900'
                        : 'bg-slate-100 dark:bg-neutral-800'
                    }`}>
                      {lesson.done && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {lesson.active && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                    </div>

                    <span className={`text-xs leading-tight flex-1 ${
                      lesson.done
                        ? 'line-through text-slate-400 dark:text-neutral-600'
                        : lesson.active
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-neutral-600'
                    }`}>
                      {lesson.label}
                    </span>

                    {lesson.active && (
                      <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold py-3 rounded-2xl">
                  Continue Learning
                  <ArrowRight size={15} weight="bold" />
                </button>
              </div>
            </motion.div>

            {/* ── Floating card: Rating ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5, ease: 'backOut' }}
              className="absolute top-[6%] right-[4%] sm:right-[8%] lg:right-0 z-20"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/30 border border-slate-100 dark:border-neutral-800 px-4 py-3.5"
              >
                <div className="flex items-center gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={13} weight="fill" className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">4.9</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">1,200+ Reviews</p>
              </motion.div>
            </motion.div>

            {/* ── Floating card: Students enrolled ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5, ease: 'backOut' }}
              className="absolute bottom-[6%] left-[4%] sm:left-[8%] lg:left-0 z-20"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/30 border border-slate-100 dark:border-neutral-800 px-4 py-3.5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={20} weight="fill" className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">50K+ Learners</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Globally Enrolled</p>
                </div>
              </motion.div>
            </motion.div>

            {/* ── Floating card: Achievement ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3, duration: 0.5, ease: 'backOut' }}
              className="absolute top-[50%] right-[2%] lg:right-[-4%] -translate-y-1/2 z-20 hidden sm:block"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/30 border border-slate-100 dark:border-neutral-800 px-4 py-3.5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Trophy size={20} weight="fill" className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Certificate</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Awarded</p>
                </div>
              </motion.div>
            </motion.div>

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
