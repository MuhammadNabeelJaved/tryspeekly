import type { ReactNode } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star } from '@phosphor-icons/react'

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

const SLIDE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80', title: 'Live Classes', subtitle: 'Interactive sessions' },
  { url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80', title: 'Student Success', subtitle: '95% pass rate' },
  { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80', title: 'Expert Tutors', subtitle: 'Native speakers' },
  { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80', title: 'Flexible Learning', subtitle: 'Anytime, anywhere' },
]

function FloatingElement({ delay, y }: { delay: number; y: number }) {
  return (
    <motion.div
      animate={{ y: [0, y, 0] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute w-2 h-2 rounded-full"
      style={{ background: 'rgba(124,58,237,0.4)' }}
    />
  )
}

function AnimatedWord({ word, delay }: { word: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="inline-block mx-1"
    >
      {word}
    </motion.span>
  )
}

function ProgressRing({ progress, delay }: { progress: number; delay: number }) {
  const circumference = 2 * Math.PI * 18
  return (
    <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
      <motion.circle
        cx="20" cy="20" r="18"
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress / 100)}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
        transition={{ delay, duration: 1.5, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function FloatingBadge({
  children,
  delay,
  floatDur = 3,
  floatDelay = 0,
  className = '',
}: {
  children: ReactNode
  delay: number
  floatDur?: number
  floatDelay?: number
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

function QuizCard() {
  const words = ['The', 'quick', 'brown', 'fox', 'jumps']
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -15 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="relative rounded-2xl p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(168,85,247,0.2) 100%)',
        border: '1px solid rgba(124,58,237,0.4)',
      }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-[30px]" style={{ background: 'rgba(124,58,237,0.3)' }} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Fill in the Blank</span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => (
              <motion.div 
                key={i}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="w-5 h-1 rounded-full bg-violet-500/50"
                style={{ transformOrigin: 'left' }}
              />
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {words.map((word, i) => (
            <motion.button
              key={word + i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-violet-500/50 transition-colors"
            >
              {word}
            </motion.button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <span className="text-white text-xs">✓</span>
          </motion.div>
          <span className="text-[10px] text-emerald-400 font-medium">Correct!</span>
        </div>
      </div>
    </motion.div>
  )
}

function AchievementCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
      className="relative rounded-2xl p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.15) 100%)',
        border: '1px solid rgba(251,191,36,0.3)',
      }}
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-[25px]" style={{ background: 'rgba(251,191,36,0.25)' }} />
      
      <div className="relative z-10 flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
        >
          🏆
        </motion.div>
        <div>
          <p className="text-xs font-bold text-yellow-300">Achievement Unlocked!</p>
          <p className="text-[10px] text-yellow-200/70">7-Day Streak • Speaking Master</p>
        </div>
      </div>
    </motion.div>
  )
}

function AvatarStack() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className="flex items-center gap-2"
    >
      <div className="flex -space-x-2">
        {AVATARS.map((src, i) => (
          <motion.div
            key={src}
            initial={{ scale: 0, x: -10 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: 1.3 + i * 0.1 }}
            className="w-7 h-7 rounded-full border-2 border-neutral-900 overflow-hidden"
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </div>
      <span className="text-[10px] text-white/60">+2,341 online</span>
    </motion.div>
  )
}

function SpeakingWave() {
  const bars = [3, 8, 5, 12, 7, 4, 10, 6]
  return (
    <div className="flex items-end gap-[2px] h-6">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1 bg-violet-400 rounded-full"
          animate={{ height: [3, height, 3] }}
          transition={{ duration: 0.5, delay: i * 0.05, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

import { useState, useEffect } from 'react'

function ImageSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDE_IMAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      {/* Main slider container */}
      <div className="relative rounded-3xl overflow-hidden h-[380px] bg-neutral-900">
        
        {/* Slides */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img 
              src={SLIDE_IMAGES[current].url} 
              alt={SLIDE_IMAGES[current].title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/40 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-2"
              >
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/80 text-white">
                  {SLIDE_IMAGES[current].subtitle}
                </span>
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-white"
              >
                {SLIDE_IMAGES[current].title}
              </motion.h3>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <span className="text-xl">🎓</span>
        </div>
        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm" />
        
        {/* Corner decorations */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-30" style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.5), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 opacity-20" style={{ background: 'radial-gradient(circle at bottom left, rgba(168,85,247,0.5), transparent 70%)' }} />
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {SLIDE_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="relative"
          >
            <motion.div
              animate={{ scale: current === i ? 1.3 : 1 }}
              className={`w-2 h-2 rounded-full transition-colors ${current === i ? 'bg-violet-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
            />
            {current === i && (
              <motion.div
                layoutId="dot"
                className="absolute -inset-1 rounded-full border-2 border-violet-500"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-neutral-400 font-medium">
        {current + 1} / {SLIDE_IMAGES.length}
      </div>
    </div>
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

          {/* ── RIGHT: Image Slider ── */}
          <div className="relative flex items-center justify-center order-1 lg:order-2 py-10 lg:py-0 min-h-[480px]">
            
            {/* Background glows */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)' }}
              />
              <div className="absolute top-10 right-10 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)' }} />
              <div className="absolute bottom-20 left-10 w-24 h-24 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
            </div>

            <ImageSlider />

            {/* Floating badges above slider */}
            <div className="absolute -top-6 left-0 right-0 flex justify-between px-4 z-20">
              <FloatingBadge delay={0.6}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(251,191,36,0.2)' }}>
                    ⭐
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white">4.9</p>
                    <p className="text-[8px] text-white/50">Rating</p>
                  </div>
                </div>
              </FloatingBadge>

              <FloatingBadge delay={0.8}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(59,130,246,0.2)' }}>
                    👥
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white">50K+</p>
                    <p className="text-[8px] text-white/50">Students</p>
                  </div>
                </div>
              </FloatingBadge>
            </div>

            <div className="absolute -bottom-4 left-0 right-0 flex justify-between px-4 z-20">
              <FloatingBadge delay={1}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(124,58,237,0.3)' }}>
                    🏆
                  </div>
                  <p className="text-[10px] font-bold text-white">Certificate</p>
                </div>
              </FloatingBadge>

              <FloatingBadge delay={1.2}>
                <div className="text-center">
                  <p className="text-xs font-black text-emerald-400">+1.5</p>
                  <p className="text-[8px] text-white/50">Band Score</p>
                </div>
              </FloatingBadge>
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
