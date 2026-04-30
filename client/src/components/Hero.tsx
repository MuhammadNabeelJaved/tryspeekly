import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Play, Sparkle, CheckCircle, VideoCamera, ChatCircleDots } from '@phosphor-icons/react'

const WORDS = ['Fluency', 'Grammar', 'Vocabulary', 'Confidence']

function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [blink, setBlink] = useState(true)

  // Cursor blinking
  useEffect(() => {
    const timeout2 = setTimeout(() => setBlink((prev) => !prev), 500)
    return () => clearTimeout(timeout2)
  }, [blink])

  // Typing logic
  useEffect(() => {
    if (index === words.length) {
      setIndex(0)
      return
    }

    if (subIndex === words[index].length + 1 && !isDeleting) {
      // Pause at the end of the word
      setTimeout(() => setIsDeleting(true), 2000)
      return
    }

    if (subIndex === 0 && isDeleting) {
      // Move to the next word
      setIsDeleting(false)
      setIndex((prev) => (prev + 1) % words.length)
      return
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1))
    }, Math.max(isDeleting ? 50 : 150, Math.random() * 150)) // Randomize typing speed slightly

    return () => clearTimeout(timeout)
  }, [subIndex, index, isDeleting, words])

  return (
    <span className="relative inline-block mt-2 min-w-[280px] lg:min-w-[420px]">
      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400">
        {words[index].substring(0, subIndex)}
        <span className={`inline-block w-[3px] sm:w-[5px] h-[40px] sm:h-[60px] ml-1 bg-violet-600 dark:bg-violet-400 align-middle ${blink ? 'opacity-100' : 'opacity-0'}`}></span>
      </span>
      <motion.span 
        className="absolute -bottom-2 left-0 w-full h-3 sm:h-4 bg-violet-200 dark:bg-violet-900/50 -z-10 rounded-sm"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
}

const floatingVariants: Variants = {
  animate: {
    y: [0, -20, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  }
}

export default function Hero() {
  return (
    <section className="relative bg-[#fafafa] dark:bg-slate-950 min-h-screen overflow-hidden pt-[72px] md:pt-[80px] transition-colors duration-300">
      
      {/* Abstract Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            rotate: [0, 90, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] rounded-full bg-gradient-to-br from-violet-300/50 to-purple-400/50 dark:from-violet-900/40 dark:to-purple-900/40 blur-[100px] mix-blend-multiply dark:mix-blend-screen"
        />
        <motion.div
          animate={{ 
            rotate: [0, -90, 0],
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] rounded-full bg-gradient-to-tr from-blue-300/40 to-indigo-400/40 dark:from-blue-900/30 dark:to-indigo-900/30 blur-[100px] mix-blend-multiply dark:mix-blend-screen"
        />
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24 min-h-[calc(100vh-72px)] md:min-h-[calc(100vh-80px)] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">

          {/* Left: Enhanced Copy */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Animated Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex"
            >
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

            {/* Dynamic Headline */}
            <motion.div variants={itemVariants}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-black text-gray-900 dark:text-white leading-[1.05] tracking-tight">
                Master English <br />
                With <Typewriter words={WORDS} />
              </h1>
            </motion.div>

            {/* Enhanced Description with features */}
            <motion.div variants={itemVariants} className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300 text-lg lg:text-xl leading-relaxed max-w-xl">
                Achieve fluency faster through interactive lessons, personalized AI learning paths, and 1-on-1 expert guidance designed for every level.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: VideoCamera, text: 'Interactive HD Video Lessons' },
                  { icon: ChatCircleDots, text: 'Real Native Conversations' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-3 bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/5 backdrop-blur-sm p-3 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 flex-shrink-0">
                      <feature.icon size={18} weight="fill" />
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 text-sm font-semibold">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Creative CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-8 py-4 rounded-2xl transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.1)] overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                  Start Learning Free
                </span>
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

            {/* Enhanced Social Proof */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4">
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
                  {[1,2,3,4,5].map(star => (
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

          {/* Right: Creative Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:h-[600px] flex justify-center items-center mt-10 lg:mt-0"
          >
            {/* Background Decorative Shapes */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 90, 180, 270, 360]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full border border-violet-200/50 dark:border-violet-800/30"
              />
              <motion.div
                animate={{ 
                  scale: [1.1, 1, 1.1],
                  rotate: [360, 270, 180, 90, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-[250px] h-[250px] sm:w-[380px] sm:h-[380px] rounded-full border border-dashed border-purple-300/40 dark:border-purple-700/20"
              />
              <div className="absolute w-[200px] h-[200px] sm:w-[320px] sm:h-[320px] bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-60" />
            </div>

            {/* Main Image Container - Transparent PNG */}
            <div className="relative z-10 w-full max-w-[480px] flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(124,58,237,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
              >
                <img
                  src="https://img.magnific.com/free-photo/young-girl-with-book-isolated-white-background_93675-131667.jpg?t=st=1777506436~exp=1777510036~hmac=7eb54c1314017b74e346c9e3ee88fae7cd2f3163e627a4cd126ec99e39b2eded&w=1480"
                  alt="English learner girl"
                  className="w-full h-auto max-h-[500px] lg:max-h-[580px] object-cover mix-blend-darken dark:mix-blend-screen"
                />
              </motion.div>

              {/* Glassmorphism Floating Cards */}
              <motion.div
                variants={floatingVariants}
                animate="animate"
                className="absolute top-10 -left-4 sm:-left-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white dark:border-white/10 p-4 z-20"
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

              <motion.div
                variants={floatingVariants}
                animate="animate"
                transition={{ delay: 1 }}
                className="absolute bottom-10 -right-4 sm:-right-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white dark:border-white/10 p-4 z-20"
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
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
