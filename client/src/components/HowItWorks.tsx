import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ClipboardText, Books, Medal } from '@phosphor-icons/react'

const STEPS = [
  {
    number: '01',
    Icon: ClipboardText,
    iconBg: 'bg-blue-50',
    iconBorder: 'border-blue-100',
    iconColor: 'text-blue-600',
    title: 'Take your placement test',
    description:
      'A 10-minute test pinpoints your exact level. No guessing, no wasting time on lessons you already know.',
    duration: '10 minutes',
  },
  {
    number: '02',
    Icon: Books,
    iconBg: 'bg-emerald-50',
    iconBorder: 'border-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Follow your learning path',
    description:
      'Your personalized curriculum adapts as you improve — lessons, AI practice, and live sessions that fit your schedule.',
    duration: 'Self-paced',
  },
  {
    number: '03',
    Icon: Medal,
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-100',
    iconColor: 'text-amber-600',
    title: 'Earn your certificate',
    description:
      'Complete level assessments and receive a globally verified certificate you can share on LinkedIn immediately.',
    duration: '3–6 months avg.',
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-16 items-start">

          {/* Left: sticky header */}
          <div className="lg:sticky lg:top-28">
            <span className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-4 block">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
              From placement to certified, 3 steps
            </h2>
            <p className="text-slate-500 text-base leading-relaxed max-w-[36ch]">
              No overwhelming menus. No endless content. A clear path from where you are to where you want to be.
            </p>
            <motion.a
              href="#"
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, stiffness: 100, damping: 20 }}
              className="mt-8 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors shadow-[0_4px_16px_rgba(37,99,235,0.3)]"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              Take the free test
            </motion.a>
          </div>

          {/* Right: steps */}
          <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.18 } },
            }}
          >
            {STEPS.map((step, i) => {
              const { Icon } = step
              return (
                <motion.div
                  key={step.number}
                  variants={{
                    hidden: { opacity: 0, x: 36 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      transition: { stiffness: 80, damping: 20 },
                    },
                  }}
                  className="flex gap-6 group"
                >
                  {/* Icon + connector */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      transition={{ stiffness: 300, damping: 20 }}
                      className={`w-12 h-12 border rounded-xl flex items-center justify-center ${step.iconBg} ${step.iconBorder}`}
                    >
                      <Icon size={22} weight="duotone" className={step.iconColor} />
                    </motion.div>
                    {i < STEPS.length - 1 && (
                      <div className="w-px flex-1 mt-4 mb-4 bg-gradient-to-b from-slate-200 to-transparent min-h-[3rem]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-12">
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-xs font-bold text-blue-600 font-mono tracking-wider">
                        {step.number}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {step.duration}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                    <p className="text-slate-500 text-base leading-relaxed max-w-[42ch]">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
