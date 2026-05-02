import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, TrendUp } from '@phosphor-icons/react'

const BARS = [28, 38, 30, 50, 42, 58, 70, 88, 76]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
const MINI_BARS = [38, 60, 48, 75, 58, 82, 72]

const PROGRESS = [
  { label: 'Fluency Improvement', value: 95 },
  { label: 'Speaking Confidence', value: 87 },
  { label: 'Vocabulary Growth', value: 92 },
]

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="bg-white dark:bg-neutral-900 py-16 lg:py-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* ── LEFT: Analytics dashboard mockup ── */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center pb-12"
          >
            {/* Dot pattern decoration */}
            <div
              className="absolute -top-6 -left-6 w-28 h-28 opacity-25 dark:opacity-15 pointer-events-none z-0"
              style={{
                backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)',
                backgroundSize: '10px 10px',
              }}
            />

            {/* Main dark card */}
            <div className="relative z-10 w-full max-w-[480px] bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.4)] ring-1 ring-white/5">

              {/* Header row */}
              <div className="flex items-start justify-between mb-7">
                <div>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-2">
                    Active Learners
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-4xl font-black">50K+</span>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs font-bold px-2.5 py-1.5 rounded-full">
                      <TrendUp size={11} weight="bold" />
                      +25%
                    </span>
                  </div>
                </div>
                <div className="w-11 h-11 bg-violet-600 rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(124,58,237,0.55)]">
                  <TrendUp size={22} weight="bold" className="text-white" />
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-1.5 h-[110px] mb-2.5">
                {BARS.map((h, i) => (
                  <div key={i} className="flex-1 flex items-end h-full">
                    <motion.div
                      className="w-full rounded-t-[3px]"
                      initial={{ height: 0 }}
                      animate={isInView ? { height: h } : { height: 0 }}
                      transition={{ delay: i * 0.06 + 0.35, duration: 0.55, ease: 'easeOut' }}
                      style={{
                        background:
                          i >= 7
                            ? 'linear-gradient(to top, #7c3aed, #a855f7)'
                            : '#1e293b',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Month labels */}
              <div className="flex gap-1.5">
                {MONTHS.map((m) => (
                  <span key={m} className="flex-1 text-center text-slate-600 text-[9px] font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Floating "New Learners" card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
              className="absolute -bottom-2 right-0 sm:right-4 bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-2xl border border-gray-100 dark:border-neutral-700 w-44 z-20"
            >
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                New Learners
              </p>
              <p className="text-gray-900 dark:text-white text-2xl font-black mb-3">+248</p>
              <div className="flex items-end gap-1 h-7">
                {MINI_BARS.map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{ background: `rgba(124,58,237,${0.3 + (i / MINI_BARS.length) * 0.7})` }}
                    initial={{ scaleY: 0 }}
                    animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                    transition={{ delay: i * 0.05 + 0.95, duration: 0.4, ease: 'easeOut' }}
                    // height set via inline so animation can scaleY from bottom
                    // scaleY origin is bottom (set on parent wrapper below)
                  >
                    <div style={{ height: `${h}%`, minHeight: 4 }} className="w-full" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </motion.div>

          {/* ── RIGHT: title + progress bars + CTA ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-200 text-sm font-semibold mb-5">
              <span className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full" />
              Start Your Journey
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.15] tracking-tight mb-5">
              Ready to Speak English{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 drop-shadow-[0_0_8px_rgba(124,58,237,0.2)] dark:drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]">
                Fluently?
              </span>
            </h2>

            <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed mb-9 max-w-[46ch]">
              Join thousands of successful learners who have transformed their English skills.
              Start your first session today and experience the difference our live trainers
              can make.
            </p>

            {/* Animated progress bars */}
            <div className="space-y-5 mb-10">
              {PROGRESS.map((item, i) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-500"
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${item.value}%` } : { width: 0 }}
                      transition={{ delay: i * 0.15 + 0.5, duration: 1.1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-all shadow-[0_8px_24px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.45)]"
            >
              Start Your Journey
              <ArrowRight size={18} weight="bold" />
            </motion.button>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
