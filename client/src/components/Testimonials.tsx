import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from '@phosphor-icons/react'

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-violet-600 dark:bg-slate-900 dark:border-t dark:border-violet-500/20 overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">

          {/* Left: image */}
          <div className="relative h-[340px] lg:h-auto overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80"
              alt="Business professional"
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient to blend into section */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-600/20 dark:via-slate-900/40 to-violet-600/60 lg:to-violet-600/80 dark:to-slate-900/80 lg:dark:to-slate-900/90" />

            {/* Floating stats card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="absolute bottom-8 left-8 bg-white/10 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white leading-none">85%</p>
                  <p className="text-[10px] text-violet-200 dark:text-violet-300 mt-0.5">Sales Growth</p>
                </div>
                <div className="w-px h-10 bg-white/20 dark:bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-white leading-none">4.9★</p>
                  <p className="text-[10px] text-violet-200 dark:text-violet-300 mt-0.5">Client Rating</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: text content */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 sm:px-8 lg:px-14 py-12 lg:py-20 flex flex-col justify-center"
          >
            <span className="inline-flex items-center gap-2 bg-white/15 dark:bg-white/10 border border-white/20 dark:border-white/10 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6 w-fit">
              <span className="w-2 h-2 bg-violet-300 dark:bg-violet-400 rounded-full" />
              Success Stories
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-white leading-tight tracking-tight mb-4 md:mb-5">
              Join Thousands Who Achieved{' '}
              <span className="text-violet-200 dark:text-violet-300">English Fluency</span>
            </h2>

            <p className="text-violet-200 dark:text-violet-300 text-sm md:text-[15px] leading-relaxed mb-6 md:mb-9 max-w-[44ch]">
              Real students, real results. See how our comprehensive English learning platform has helped learners from around the world achieve their language goals and unlock new opportunities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 dark:border dark:border-white/15 hover:bg-violet-50 dark:hover:bg-slate-800 text-violet-700 dark:text-violet-400 font-bold text-[15px] px-7 py-3.5 rounded-lg transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
              >
                Start Learning Today
                <ArrowRight size={17} weight="bold" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.02 }}
                className="inline-flex items-center justify-center gap-2 border border-white/30 dark:border-white/20 hover:border-white/50 dark:hover:border-white/40 text-white font-semibold text-[15px] px-7 py-3.5 rounded-lg transition-all"
              >
                View Success Stories
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
