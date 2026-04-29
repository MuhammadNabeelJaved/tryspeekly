import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MagnifyingGlass, ChartBar, Palette, CheckCircle, ArrowRight } from '@phosphor-icons/react'

const STEPS = [
  {
    number: '01',
    Icon: MagnifyingGlass,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    title: 'Foundation Building',
    description: 'Master essential grammar, vocabulary, and pronunciation fundamentals through interactive lessons and practice exercises.',
  },
  {
    number: '02',
    Icon: ChartBar,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Skill Development',
    description: 'Develop listening, speaking, reading, and writing skills with targeted exercises and real-world application scenarios.',
  },
  {
    number: '03',
    Icon: Palette,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    title: 'Conversation Practice',
    description: 'Build confidence through live sessions with native speakers and structured conversation practice in various contexts.',
  },
  {
    number: '04',
    Icon: CheckCircle,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: 'Fluency Achievement',
    description: 'Apply your skills in complex situations, achieve certification, and continue learning with advanced content and communities.',
  },
]

export default function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-white py-16 md:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Left: steps */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 text-violet-600 text-sm font-semibold mb-4">
              <span className="w-2 h-2 bg-violet-600 rounded-full" />
              Work Process
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-gray-900 leading-tight tracking-tight mb-8 md:mb-10">
              We Complete Our Work To Follow Some Easy Ways
            </h2>

            {/* Steps */}
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const { Icon } = step
                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.1 + 0.2, duration: 0.55 }}
                    className="flex gap-5 group"
                  >
                    {/* Left: icon + connector */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-11 h-11 ${step.iconBg} rounded-xl flex items-center justify-center border border-current/10 group-hover:scale-110 transition-transform duration-200`}>
                        <Icon size={20} weight="duotone" className={step.iconColor} />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="w-px flex-1 bg-gradient-to-b from-gray-200 to-transparent mt-3 mb-3 min-h-[2rem]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={i < STEPS.length - 1 ? 'pb-7' : ''}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-[11px] font-bold text-violet-600 font-mono tracking-widest">{step.number}</span>
                      </div>
                      <h3 className="text-[16px] font-bold text-gray-900 mb-1.5">{step.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed max-w-[42ch]">{step.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <motion.a
              href="#"
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[15px] px-6 py-3 rounded-lg transition-colors shadow-[0_4px_16px_rgba(124,58,237,0.3)] mt-8"
            >
              Discover More
              <ArrowRight size={16} weight="bold" />
            </motion.a>
          </motion.div>

          {/* Right: image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
              <img
                src="https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=700&q=80"
                alt="Business professional at work"
                className="w-full h-[520px] lg:h-[580px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-violet-900/30 to-transparent" />
            </div>

            {/* Floating card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Project Completed</p>
                  <p className="text-xs text-gray-500 mt-0.5">500+ successful projects</p>
                </div>
              </div>
            </motion.div>

            {/* Dot pattern decoration */}
            <div
              className="absolute -top-6 -right-6 w-28 h-28 pointer-events-none opacity-25"
              style={{
                backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)',
                backgroundSize: '12px 12px',
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
