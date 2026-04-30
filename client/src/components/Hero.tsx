import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Play, Sparkle, CheckCircle, CaretDown } from '@phosphor-icons/react'

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
      setTimeout(() => setIsDeleting(true), 2000)
      return
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
    <span className="relative inline-block min-w-[260px] sm:min-w-[360px] lg:min-w-[440px]">
      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400">
        {words[index].substring(0, subIndex)}
        <span className={`inline-block w-[3px] sm:w-[5px] h-[50px] sm:h-[70px] lg:h-[88px] ml-1 bg-violet-600 dark:bg-violet-400 align-middle ${blink ? 'opacity-100' : 'opacity-0'}`} />
      </span>
      <motion.span
        className="absolute -bottom-2 left-0 w-full h-3 sm:h-4 bg-violet-200 dark:bg-violet-900/50 -z-10 rounded-sm"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
        style={{ transformOrigin: 'left' }}
      />
    </span>
  )
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const floatingVariants: Variants = {
  animate: { y: [0, -20, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
}

export default function Hero() {
  return (
    <section className="relative bg-[#fafafa] dark:bg-slate-950 min-h-screen overflow-hidden pt-[72px] md:pt-[80px] transition-colors duration-300">

      {/* Immersive Gradient Orb Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: [0, 90, 0], scale: [1, 1.2, 1], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[15%] -right-[10%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-violet-600 to-purple-700 blur-[120px] mix-blend-multiply dark:mix-blend-screen"
        />
        <motion.div
          animate={{ rotate: [0, -90, 0], scale: [1, 1.3, 1], opacity: [0.3, 0.45, 0.3] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-[15%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-700 to-violet-800 blur-[100px] mix-blend-multiply dark:mix-blend-screen"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-600 to-pink-600 blur-[80px] mix-blend-multiply dark:mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] dark:opacity-[0.06] mix-blend-overlay" />
      </div>

      {/* Floating Accent Card — top left */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-[22%] left-[4%] xl:left-[8%] hidden lg:block bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white dark:border-white/10 p-4 z-20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-inner">
            <CheckCircle size={22} weight="fill" className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">1,000+ Hrs</p>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium uppercase tracking-wider">Course Content</p>
          </div>
        </div>
      </motion.div>

      {/* Floating Accent Card — bottom right */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 1 }}
        className="absolute bottom-[22%] right-[4%] xl:right-[8%] hidden lg:block bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white dark:border-white/10 p-4 z-20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-inner">
            <Sparkle size={22} weight="fill" className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">24/7 AI Tutor</p>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium uppercase tracking-wider">Instant Help</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content — centered single column */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)] md:min-h-[calc(100vh-80px)] flex items-center justify-center py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl w-full text-center space-y-8"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 backdrop-blur-md shadow-sm"
            >
              <motion.span
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400"
              >
                <Sparkle size={14} weight="fill" />
              </motion.span>
              <span className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-bold tracking-wide uppercase">
                Trusted by 50,000+ learners
              </span>
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.div variants={itemVariants} className="space-y-2">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-gray-900 dark:text-white leading-[1.0] tracking-tight">
              Master English
            </h1>
            <div className="flex justify-center pt-2">
              <Typewriter words={WORDS} />
            </div>
          </motion.div>

          {/* Subtext */}
          <motion.div variants={itemVariants}>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl mx-auto">
              AI-powered lessons, expert tutors, and real results — at your pace.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-row gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-8 py-4 rounded-2xl transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.1)] overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">Start Learning Free</span>
              <ArrowRight size={20} weight="bold" className="relative z-10 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center justify-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/50 text-gray-800 dark:text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-sm hover:shadow-md"
            >
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                <Play size={14} weight="fill" className="ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </motion.button>
          </motion.div>

          {/* Social Proof */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
            <div className="flex -space-x-3">
              {[
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80',
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&q=80',
              ].map((src, i) => (
                <motion.img
                  key={i}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                  src={src}
                  alt="Student"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white dark:border-slate-950 object-cover shadow-sm"
                />
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="text-gray-900 dark:text-white font-bold">4.9/5</span> from 10,000+ reviews
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
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
