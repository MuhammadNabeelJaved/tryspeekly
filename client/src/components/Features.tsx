import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from '@phosphor-icons/react'

const STATS = [
  { value: '95%', label: 'Fluency Achieved' },
  { value: '50K+', label: 'Active Learners' },
  { value: '4.9★', label: 'Student Rating' },
  { value: '24/7', label: 'Learning Support' },
  { value: '150+', label: 'Countries Served' },
]

const AGENCY_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=80',
    alt: 'Team collaboration',
    className: 'absolute top-0 left-0 w-[58%] h-[240px] lg:h-[270px] rounded-2xl object-cover shadow-lg',
  },
  {
    src: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=500&q=80',
    alt: 'Business meeting',
    className: 'absolute top-0 right-0 w-[38%] h-[200px] lg:h-[230px] rounded-2xl object-cover shadow-lg',
  },
  {
    src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=500&q=80',
    alt: 'Agency team',
    className: 'absolute bottom-0 left-1/2 -translate-x-1/2 w-[54%] h-[200px] lg:h-[220px] rounded-2xl object-cover shadow-lg',
  },
]

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="bg-white py-16 md:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Left: image collage */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[480px] lg:h-[520px]"
          >
            {AGENCY_IMAGES.map((img, i) => (
              <motion.img
                key={i}
                src={img.src}
                alt={img.alt}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.12 + 0.2, duration: 0.6 }}
                className={img.className}
              />
            ))}

            {/* Floating experience badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute bottom-4 left-4 bg-violet-600 text-white rounded-2xl px-5 py-3 shadow-[0_8px_30px_rgba(124,58,237,0.4)] z-10"
            >
              <p className="text-3xl font-bold leading-none">22+</p>
              <p className="text-xs text-violet-200 mt-1">Years of Experience</p>
            </motion.div>

            {/* Decorative dot pattern */}
            <div
              className="absolute -bottom-6 -right-6 w-32 h-32 pointer-events-none opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)',
                backgroundSize: '12px 12px',
              }}
            />
          </motion.div>

          {/* Right: text + stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 text-violet-600 text-sm font-semibold mb-4">
              <span className="w-2 h-2 bg-violet-600 rounded-full" />
              Why Choose Our Platform
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-gray-900 leading-tight tracking-tight mb-4 md:mb-5">
              Transform Your English Skills With{' '}
              <span className="text-violet-600">Proven Methods</span>
            </h2>

            <p className="text-gray-500 text-sm md:text-[15px] leading-relaxed mb-6 md:mb-8 max-w-[48ch]">
              Join a community of successful English learners who have achieved fluency through our comprehensive platform featuring expert instructors, interactive content, and personalized learning experiences.
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-9">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.08 + 0.4, duration: 0.5 }}
                >
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 leading-none mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.a
              href="#"
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[15px] px-6 py-3 rounded-lg transition-colors shadow-[0_4px_16px_rgba(124,58,237,0.3)]"
            >
              Learn More
              <ArrowRight size={16} weight="bold" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
