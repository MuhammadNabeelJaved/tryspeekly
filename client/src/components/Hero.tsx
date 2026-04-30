import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Play, Sparkle, Users, ChartLineUp, CaretDown } from '@phosphor-icons/react'

const WORDS = ['Fluency', 'Grammar', 'Vocabulary', 'Confidence']

function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setBlink((prev) => !prev), 500)
    return () => clearTimeout(t)
  }, [blink])

  useEffect(() => {
    if (index === words.length) { setIndex(0); return }
    if (subIndex === words[index].length + 1 && !isDeleting) {
      const t = setTimeout(() => setIsDeleting(true), 2000)
      return () => clearTimeout(t)
    }
    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false)
      setIndex((prev) => (prev + 1) % words.length)
      return
    }
    const t = setTimeout(
      () => setSubIndex((prev) => prev + (isDeleting ? -1 : 1)),
      Math.max(isDeleting ? 50 : 150, Math.random() * 150)
    )
    return () => clearTimeout(t)
  }, [subIndex, index, isDeleting, words])

  return (
    <span className="relative inline-block min-w-[130px] sm:min-w-[170px]">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 drop-shadow-[0_0_8px_rgba(124,58,237,0.2)] dark:drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]">
        {words[index].substring(0, subIndex)}
        <span
          className={`inline-block w-[2px] h-[28px] sm:h-[34px] ml-0.5 bg-violet-600 dark:bg-violet-400 align-middle ${blink ? 'opacity-100' : 'opacity-0'}`}
        />
      </span>
      <motion.span
        className="absolute -bottom-1 left-0 w-full h-[6px] bg-violet-100 dark:bg-violet-800/50 -z-10 rounded-sm"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 0.7, ease: 'easeOut' }}
        style={{ transformOrigin: 'left' }}
      />
    </span>
  )
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const floatingVariants: Variants = {
  animate: { y: [0, -10, 0], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } },
}

export default function Hero() {
  return (
    <section className="relative bg-white dark:bg-slate-950 min-h-[100dvh] overflow-hidden pt-[72px] md:pt-[80px] transition-colors duration-300">

      {/* Subtle right-panel background wash */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-violet-50/80 via-violet-50/30 to-transparent dark:from-violet-950/20 dark:via-violet-950/10 dark:to-transparent" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" />
      </div>

      {/* Main two-column grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100dvh-72px)] md:min-h-[calc(100dvh-80px)] flex items-center py-14 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 items-center w-full">

          {/* ── LEFT: text content ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-7 order-2 lg:order-1 text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-800/30 border border-violet-100 dark:border-violet-600/50">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  className="flex"
                >
                  <Sparkle size={14} weight="fill" className="text-violet-600 dark:text-violet-200" />
                </motion.span>
                <span className="text-violet-700 dark:text-violet-200 text-sm font-semibold tracking-wide">
                  25+ Years of Teaching Experience
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                The Effective Solutions
                <br />
                To Grow Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 drop-shadow-[0_0_8px_rgba(124,58,237,0.2)] dark:drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]">
                  English
                </span>
              </h1>
              <div className="flex items-center gap-2.5 justify-center lg:justify-start pt-1">
                <span className="text-xl sm:text-2xl font-black text-gray-400 dark:text-gray-500">
                  Build your
                </span>
                <span className="text-xl sm:text-2xl font-black">
                  <Typewriter words={WORDS} />
                </span>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div variants={itemVariants}>
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto lg:mx-0">
                Live sessions via Zoom & Google Meet with expert trainers — real results,
                from anywhere in the world.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_24px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.45)] transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <span className="relative z-10">Start Learning Free</span>
                <ArrowRight
                  size={18}
                  weight="bold"
                  className="relative z-10 group-hover:translate-x-1 transition-transform duration-200"
                />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center justify-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 text-gray-800 dark:text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-sm hover:shadow-md"
              >
                <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-800/50 flex items-center justify-center text-violet-600 dark:text-violet-200 group-hover:scale-110 group-hover:bg-violet-100 dark:group-hover:bg-violet-800/40 transition-all">
                  <Play size={13} weight="fill" className="ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </motion.button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-4 sm:gap-5 justify-center lg:justify-start pt-1"
            >
              <div className="flex -space-x-2.5">
                {[
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&q=80',
                ].map((src) => (
                  <motion.img
                    key={src}
                    whileHover={{ scale: 1.15, zIndex: 10 }}
                    src={src}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  <span className="text-gray-900 dark:text-white font-bold">4.9/5</span>
                  {' '}· 10,000+ reviews
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: hero image ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.15, ease: 'easeOut' }}
            className="relative flex items-center justify-center order-1 lg:order-2 min-h-[360px] sm:min-h-[460px] lg:min-h-0"
          >
            {/* Soft background blob */}
            <div className="absolute w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[460px] lg:h-[460px] rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 blur-3xl" />

            {/* Decorative rings */}
            <div className="absolute w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] lg:w-[440px] lg:h-[440px] rounded-full border border-violet-200/50 dark:border-violet-600/30" />
            <div className="absolute w-[250px] h-[250px] sm:w-[310px] sm:h-[310px] lg:w-[360px] lg:h-[360px] rounded-full border border-violet-200/30 dark:border-violet-600/20" />

            {/* Girl image */}
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80"
              alt="English learner"
              className="relative z-10 h-[300px] sm:h-[380px] lg:h-[460px] w-auto object-cover rounded-[2rem] shadow-2xl ring-4 ring-white/60 dark:ring-slate-800/60"
            />

            {/* Floating card — top right */}
            <motion.div
              variants={floatingVariants}
              animate="animate"
              className="absolute top-[5%] right-0 lg:right-[-6%] z-20 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700/60 p-3 sm:p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <ChartLineUp size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">100% Growth</p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium uppercase tracking-wider">In Fluency</p>
                </div>
              </div>
            </motion.div>

            {/* Floating card — bottom left */}
            <motion.div
              variants={floatingVariants}
              animate="animate"
              transition={{ delay: 1.4 }}
              className="absolute bottom-[5%] left-0 lg:left-[-6%] z-20 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700/60 p-3 sm:p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <Users size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">50K+ Learners</p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium uppercase tracking-wider">Active Students</p>
                </div>
              </div>
            </motion.div>

            {/* Dot-grid decoration */}
            <div
              className="absolute bottom-0 right-0 w-28 h-28 opacity-20 dark:opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)',
                backgroundSize: '10px 10px',
              }}
            />
          </motion.div>

        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 text-gray-400 dark:text-gray-600"
      >
        <span className="text-[10px] font-medium uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CaretDown size={16} weight="bold" />
        </motion.div>
      </motion.div>
    </section>
  )
}
