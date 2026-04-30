import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import { VideoCamera, Trophy, Briefcase, Certificate, ArrowUpRight, Sparkle } from '@phosphor-icons/react'

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.13 } },
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative overflow-hidden bg-[#f5f4ff] dark:bg-slate-950 py-20 md:py-28 lg:py-32 transition-colors duration-300">

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-200/40 dark:bg-violet-800/30 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-200/30 dark:bg-purple-900/15 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-14 md:mb-18">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-800/40 border border-violet-200 dark:border-violet-600/55 mb-5"
          >
            <Sparkle size={14} weight="fill" className="text-violet-600 dark:text-violet-200" />
            <span className="text-violet-700 dark:text-violet-200 text-sm font-bold tracking-wide uppercase">
              Our Features
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight max-w-3xl mx-auto"
          >
            Speak Fluently.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 drop-shadow-[0_0_8px_rgba(124,58,237,0.2)] dark:drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]">
              Score Higher.
            </span>{' '}
            Get Hired.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="mt-4 text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto"
          >
            Everything you need — live classes, expert trainers, certified results.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >

          {/* ── Card 1: Live Training — image bg, wide ── */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.04 }}
            className="md:col-span-2 relative rounded-3xl overflow-hidden h-[340px] cursor-pointer group"
          >
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=80"
              alt="Live training session"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-900/40 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-6 left-6 right-6 flex items-start justify-between">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-white text-xs font-bold tracking-wider uppercase">Live</span>
              </div>
              <div className="flex gap-2">
                <span className="bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-xs font-semibold">
                  Zoom
                </span>
                <span className="bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-xs font-semibold">
                  Google Meet
                </span>
              </div>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <div className="flex items-center gap-3 mb-1">
                <VideoCamera size={22} weight="fill" className="text-violet-300" />
                <span className="text-violet-300 text-xs font-semibold uppercase tracking-widest">Live Training</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
                Real Classes.<br />Real Trainers.
              </h3>
              <p className="text-white/65 text-sm max-w-sm">
                Interactive live sessions with expert trainers — real-time feedback,
                structured lessons, and a class that fits your schedule.
              </p>
            </div>

            {/* Arrow */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: -45 }}
              className="absolute top-6 right-6 w-10 h-10 bg-white/15 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ArrowUpRight size={18} className="text-white" />
            </motion.div>
          </motion.div>

          {/* ── Card 2: IELTS 8+ — bold gradient stat ── */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.04 }}
            className="relative rounded-3xl overflow-hidden h-[340px] cursor-pointer group bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-7 flex flex-col justify-between"
          >
            {/* Decorative large number */}
            <span
              className="absolute -top-4 -right-2 text-[140px] font-black text-white/10 leading-none select-none pointer-events-none"
              aria-hidden="true"
            >
              8+
            </span>

            <div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-5">
                <Trophy size={26} weight="fill" className="text-yellow-300" />
              </div>
              <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-1">IELTS Score</p>
              <h3 className="text-4xl font-black text-white leading-tight">
                Band 8+<br />Guaranteed
              </h3>
            </div>

            <div>
              <p className="text-violet-200/80 text-sm leading-relaxed mb-5">
                Targeted strategies and mock tests to hit band 8 or above — or we train you again.
              </p>
              {/* Mini stat pills */}
              <div className="flex gap-2 flex-wrap">
                <span className="bg-white/15 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Speaking
                </span>
                <span className="bg-white/15 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Writing
                </span>
                <span className="bg-white/15 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Reading
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Card 3: Job Interview — image + dark overlay ── */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.04 }}
            className="relative rounded-3xl overflow-hidden h-[320px] cursor-pointer group"
          >
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80"
              alt="Job interview preparation"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-slate-900/20" />

            <div className="absolute inset-0 p-7 flex flex-col justify-between">
              <div className="w-11 h-11 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
                <Briefcase size={22} weight="fill" className="text-white" />
              </div>

              <div>
                <span className="text-violet-300 text-[10px] font-bold uppercase tracking-widest block mb-1.5">
                  Career Ready
                </span>
                <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                  Job Interview<br />English Prep
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Nail your interviews with confident, professional English that impresses every hiring manager.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Card 4: Shareable Certificate — dark premium card ── */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.04 }}
            className="md:col-span-2 relative rounded-3xl overflow-hidden h-[320px] cursor-pointer group bg-slate-900 dark:bg-slate-800 p-7 sm:p-8 flex flex-col sm:flex-row items-center gap-8"
          >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />

            {/* Left: content */}
            <div className="relative z-10 flex-1">
              <div className="w-12 h-12 bg-violet-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mb-5">
                <Certificate size={26} weight="fill" className="text-violet-400" />
              </div>
              <h3 className="text-3xl font-black text-white mb-3 leading-tight">
                Earn a Certificate<br />Worth Sharing
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-5">
                Complete your program and receive a professional certificate — recognised by employers and ready to share on LinkedIn.
              </p>
              {/* Share mock */}
              <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-xl px-4 py-2.5 group-hover:bg-blue-600/30 transition-colors duration-300">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-400 fill-current flex-shrink-0">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="text-blue-300 text-xs font-semibold">Share on LinkedIn</span>
              </div>
            </div>

            {/* Right: certificate visual */}
            <div className="relative z-10 hidden sm:flex flex-shrink-0 items-center justify-center">
              <div className="relative w-48">
                {/* Certificate card mockup */}
                <div className="absolute -inset-2 bg-violet-600/20 rounded-2xl blur-xl" />
                <div className="relative bg-white rounded-2xl p-5 shadow-2xl -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="w-full h-1.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mb-4" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                      <Certificate size={16} weight="fill" className="text-violet-600" />
                    </div>
                    <div>
                      <div className="h-2 w-20 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                  <div className="h-2 w-28 bg-gray-100 rounded-full mb-1.5" />
                  <div className="h-2 w-20 bg-gray-100 rounded-full mb-4" />
                  <div className="h-8 w-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold uppercase tracking-wider">Certificate of Completion</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  )
}
