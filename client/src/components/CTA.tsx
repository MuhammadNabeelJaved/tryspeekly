import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, TrendUp } from '@phosphor-icons/react'

const STATS = [
  { value: 95, label: 'Fluency Improvement', color: 'bg-violet-600' },
  { value: 87, label: 'Speaking Confidence', color: 'bg-purple-500' },
  { value: 92, label: 'Vocabulary Growth', color: 'bg-violet-400' },
]

function ProgressBar({ value, label, color, delay }: { value: number; label: string; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div ref={ref} className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${value}%` } : {}}
          transition={{ delay, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className={`h-2 rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

export default function CTA() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-gray-50 dark:bg-slate-950 py-16 md:py-20 lg:py-28 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Left: dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Main card */}
            <div className="bg-slate-950 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">Active Learners</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-3xl font-bold">50K+</p>
                    <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                      <TrendUp size={10} weight="bold" />
                      +25%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
                  <TrendUp size={20} weight="bold" className="text-violet-400" />
                </div>
              </div>

              {/* Progress bars */}
              <div className="flex items-end gap-2 h-28 mt-4">
                {[40, 65, 45, 80, 60, 90, 55, 75, 85, 70, 95, 60].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={isInView ? { scaleY: 1 } : {}}
                    transition={{ delay: i * 0.05 + 0.3, duration: 0.5 }}
                    style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                    className={`flex-1 rounded-t-sm ${i === 9 ? 'bg-violet-500' : 'bg-white/10'} hover:bg-violet-400 transition-colors duration-300 cursor-pointer`}
                    whileHover={{
                      scaleY: 1.2,
                      backgroundColor: "#a78bfa"
                    }}
                    whileTap={{ scaleY: 0.9 }}
                  />
                ))}
              </div>

              <div className="flex justify-between mt-3">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                  <span key={m} className="text-[9px] text-gray-600">{m}</span>
                ))}
              </div>
            </div>

            {/* Secondary floating card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-6 -right-4 bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-slate-800 p-4 w-44 transition-colors duration-300"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">New Learners</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">+248</p>
              <div className="mt-2 flex gap-1">
                {[3, 5, 4, 7, 6, 8, 5].map((v, i) => (
                  <div key={i} style={{ height: `${v * 4}px` }} className="flex-1 bg-violet-100 rounded-sm relative overflow-hidden">
                    <div style={{ height: '60%' }} className="absolute bottom-0 left-0 right-0 bg-violet-500 rounded-sm" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Decorative dot grid */}
            <div
              className="absolute -top-6 -left-6 w-24 h-24 pointer-events-none opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)',
                backgroundSize: '12px 12px',
              }}
            />
          </motion.div>

          {/* Right: text + stats */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-300 text-sm font-semibold mb-4">
              <span className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full" />
              Start Your Journey
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight mb-4 md:mb-5">
              Ready to Speak English{' '}
              <span className="text-violet-600 dark:text-violet-300">Fluently?</span>
            </h2>

            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-[15px] leading-relaxed mb-6 md:mb-8 max-w-[46ch]">
              Join thousands of successful learners who have transformed their English skills. Start your free trial today and experience the difference our proven methods can make.
            </p>

            {/* Progress stats */}
            <div className="mb-8">
              {STATS.map((stat, i) => (
                <ProgressBar
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  color={stat.color}
                  delay={i * 0.15 + 0.3}
                />
              ))}
            </div>

            <motion.a
              href="#"
              whileHover={{
                scale: 1.05,
                x: 8,
                boxShadow: "0 20px 40px rgba(124, 58, 237, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17
              }}
              className="group relative inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white font-semibold text-[15px] px-6 py-3 rounded-lg transition-all duration-300 shadow-[0_4px_16px_rgba(124,58,237,0.3)] dark:shadow-[0_8px_24px_rgba(124,58,237,0.35)] overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
              />
              <span className="relative z-10">Start Your Journey</span>
              <motion.div
                whileHover={{ x: 4, rotate: 15 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ArrowRight size={16} weight="bold" />
              </motion.div>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
