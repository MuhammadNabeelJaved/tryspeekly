import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from '@phosphor-icons/react'

const TRUST_ITEMS = [
  'No credit card needed',
  '7-day free trial',
  'Cancel any time',
  '14,832 learners enrolled',
]

export default function CTA() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative bg-blue-600 py-32 overflow-hidden">

      {/* Animated blobs inside blue section */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], x: [-20, 20, -20] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-blue-500/30 rounded-full blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], x: [20, -20, 20] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-blue-700/40 rounded-full blur-[110px] pointer-events-none"
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 36 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ stiffness: 80, damping: 20 }}
        >
          {/* Badge */}
          <span className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
            No credit card required
          </span>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tighter leading-[1.04] mb-6 max-w-3xl mx-auto">
            Your first lesson
            <br />
            is today.
          </h2>

          <p className="text-lg text-blue-100 max-w-[44ch] mx-auto mb-12 leading-relaxed">
            Take the placement test in 10 minutes. Get your personalized path. Start learning before your next coffee.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <motion.a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-600 font-bold text-base px-10 py-4 rounded-xl transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ stiffness: 300, damping: 20 }}
            >
              Start for free
              <ArrowRight size={18} weight="bold" />
            </motion.a>
            <a
              href="#"
              className="text-sm text-blue-200 hover:text-white transition-colors font-medium px-4 py-4"
            >
              View pricing plans
            </a>
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 text-sm text-blue-100"
          >
            {TRUST_ITEMS.map((text) => (
              <span key={text} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M2.5 7l3 3 6-6"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {text}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
