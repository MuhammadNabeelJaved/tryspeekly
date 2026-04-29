import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const TESTIMONIALS = [
  {
    quote:
      'I went from B2 to C1 in 4 months. My promotion at Microsoft happened 6 weeks after I got the certificate. Worth every minute.',
    name: 'Amira Ramirez',
    role: 'Marketing Manager, Microsoft LATAM',
    metric: 'B2→C1',
    metricLabel: 'in 4 months',
    avatar: 'https://picsum.photos/seed/amira78/96/96',
  },
  {
    quote:
      'The AI practice partner made the difference. Three conversations a week felt completely natural. I passed my IELTS with 7.5.',
    name: 'Kofi Mensah',
    role: 'Software Engineer, Vodafone Ghana',
    metric: '7.5',
    metricLabel: 'IELTS score',
    avatar: 'https://picsum.photos/seed/kofi34/96/96',
  },
  {
    quote:
      "I led my first all-English client meeting after 8 weeks. The structured path gave me confidence I couldn't get from YouTube.",
    name: 'Valentina Moreira',
    role: 'International Sales Director, São Paulo',
    metric: '8 weeks',
    metricLabel: 'to fluent meetings',
    avatar: 'https://picsum.photos/seed/valentina91/96/96',
  },
]

export default function Testimonials() {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 6500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="bg-slate-50 py-24 lg:py-32 overflow-hidden border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div>
            <span className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-4 block">
              Results
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Real people, real outcomes
            </h2>
          </div>

          {/* Navigation dots */}
          <div className="flex gap-2 items-center">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  active === i ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ stiffness: 80, damping: 20 }}
          className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-center"
        >

          {/* Quote */}
          <div className="relative overflow-hidden min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                transition={{ stiffness: 120, damping: 22 }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="#fbbf24" aria-hidden="true">
                      <path d="M8 1.5l1.75 5.25H15l-4.4 3.2 1.7 5.25L8 12 3.7 15.2l1.7-5.25L1 6.75h5.25z" />
                    </svg>
                  ))}
                </div>

                <blockquote className="text-2xl lg:text-[28px] font-semibold text-slate-900 tracking-tight leading-[1.35] mb-8">
                  "{TESTIMONIALS[active].quote}"
                </blockquote>

                <div className="flex items-center gap-4">
                  <img
                    src={TESTIMONIALS[active].avatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-200"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{TESTIMONIALS[active].name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{TESTIMONIALS[active].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Metric card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ stiffness: 120, damping: 22 }}
              className="bg-blue-600 rounded-3xl p-10 text-center"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, stiffness: 120, damping: 20 }}
                className="text-5xl lg:text-6xl font-bold text-white tracking-tighter mb-3"
              >
                {TESTIMONIALS[active].metric}
              </motion.p>
              <p className="text-blue-100 text-base">{TESTIMONIALS[active].metricLabel}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
