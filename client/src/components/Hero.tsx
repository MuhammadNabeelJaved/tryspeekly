import { motion, useMotionValue, useTransform } from 'framer-motion'
import { ArrowRight, Play } from '@phosphor-icons/react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.45 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { stiffness: 100, damping: 20 },
  },
}

function LessonProgressCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, stiffness: 80, damping: 20 }}
    >
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-white border border-slate-200 rounded-2xl p-5 w-64 shadow-[0_12px_40px_rgba(15,23,42,0.1)]"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 4h10M3 7.5h7M3 11h8" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Active Lesson</p>
            <p className="text-sm text-slate-900 font-semibold mt-0.5">Present Perfect</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Progress</span>
            <span className="text-blue-600 font-bold">73%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '73%' }}
              transition={{ duration: 1.8, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">11 / 15 exercises</span>
          <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
            In progress
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StreakCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.1, stiffness: 80, damping: 20 }}
    >
      <motion.div
        animate={{ y: [0, 10, 0], rotate: [-0.5, 0.5, -0.5] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-white border border-slate-200 rounded-2xl p-4 w-52 shadow-[0_12px_40px_rgba(15,23,42,0.1)]"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2c-.5 2.8-3.2 4.8-3.2 7.5 0 2 1.5 3.3 3.2 3.8 1.7-.5 3.2-1.8 3.2-3.8 0-2.7-2.7-4.7-3.2-7.5z" fill="#f97316" />
              <path d="M10 12.5c-.9 0-1.6-.6-1.6-1.4 0-1.1 1.6-2 1.6-2s1.6.9 1.6 2c0 .8-.7 1.4-1.6 1.4z" fill="#fbbf24" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 leading-none">47</p>
            <p className="text-xs text-slate-400 mt-0.5">Day streak</p>
          </div>
        </div>
        <div className="mt-3.5 flex gap-1">
          {[1, 1, 1, 1, 1, 0, 0].map((active, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full ${active ? 'bg-orange-400' : 'bg-slate-100'}`}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function LiveSessionCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.3, stiffness: 80, damping: 20 }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="bg-white border border-slate-200 rounded-2xl p-4 w-60 shadow-[0_12px_40px_rgba(15,23,42,0.1)]"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
              <img
                src="https://picsum.photos/seed/teacher42/80/80"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"
            />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live now</span>
            <p className="text-sm text-slate-900 font-semibold mt-0.5">Session in 5 min</p>
            <p className="text-xs text-slate-400">Business English</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Hero() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-400, 400], [3, -3])
  const rotateY = useTransform(mouseX, [-400, 400], [-3, 3])

  return (
    <section
      className="relative min-h-[100dvh] bg-white overflow-hidden"
      onMouseMove={(e) => {
        mouseX.set(e.clientX - window.innerWidth / 2)
        mouseY.set(e.clientY - window.innerHeight / 2)
      }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Soft blue ambient glow top-right */}
      <div className="absolute top-0 right-0 w-[700px] h-[500px] bg-blue-100/60 rounded-full blur-[120px] pointer-events-none translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-slate-100/80 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[100dvh] flex items-center pt-20">
        {/* Fixed grid: use fr units so gap doesn't cause overflow */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-10 items-center w-full py-16 lg:py-0">

          {/* Left: Copy */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* Badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/60 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"
                />
                AI-Powered English Learning
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-[68px] font-bold text-slate-900 tracking-tighter leading-[1.04] mb-6"
            >
              Master English.
              <br />
              <span className="text-blue-600">Get the life</span>
              <br />
              you want.
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-slate-600 leading-relaxed max-w-[50ch] mb-10"
            >
              Structured lessons, real conversation practice with AI, and certificates employers recognize. Built for people serious about results.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <motion.a
                href="#"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors shadow-[0_4px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.5)]"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ stiffness: 300, damping: 20 }}
              >
                Start for free
                <ArrowRight size={18} weight="bold" />
              </motion.a>
              <motion.a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2.5 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold text-base px-8 py-4 rounded-xl transition-all bg-white"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ stiffness: 300, damping: 20 }}
              >
                <Play size={16} weight="fill" className="text-blue-600" />
                See how it works
              </motion.a>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {[22, 45, 67, 91].map((seed) => (
                  <img
                    key={seed}
                    src={`https://picsum.photos/seed/student${seed}/64/64`}
                    alt=""
                    className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="#fbbf24" aria-hidden="true">
                      <path d="M6 1l1.3 3.9H11L8.2 7l1 3.9L6 9.1 2.8 11l1-3.9L1 4.9h3.7L6 1z" />
                    </svg>
                  ))}
                  <span className="text-xs text-slate-500 ml-1.5 font-medium">4.9</span>
                </div>
                <p className="text-sm text-slate-500">
                  <span className="text-slate-800 font-semibold">14,832</span> learners enrolled
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Floating cards */}
          <div className="hidden lg:flex items-center justify-center">
            <motion.div
              style={{ rotateX, rotateY, perspective: 1000 }}
              className="relative w-full h-[560px]"
            >
              {/* Soft background shape */}
              <div className="absolute inset-6 bg-gradient-to-br from-blue-50 to-slate-50 rounded-3xl border border-blue-100/60" />

              {/* Lesson progress — top center */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
                <LessonProgressCard />
              </div>

              {/* Streak — middle left */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10">
                <StreakCard />
              </div>

              {/* Live session — bottom right */}
              <div className="absolute bottom-12 right-0 z-10">
                <LiveSessionCard />
              </div>

              {/* Slow orbiting dot */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] pointer-events-none"
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.7)]" />
              </motion.div>

              {/* Counter-orbit */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[170px] h-[170px] pointer-events-none"
              >
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-300 rounded-full" />
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  )
}
