import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Briefcase, ChartBar, Megaphone, Desktop, ArrowRight } from '@phosphor-icons/react'

const SERVICES = [
  {
    Icon: Briefcase,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    title: 'Interactive Lessons',
    description: 'Engage with dynamic video lessons, quizzes, and exercises designed to accelerate your English learning journey.',
  },
  {
    Icon: ChartBar,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Personalized Learning',
    description: 'AI-powered learning paths adapt to your pace and goals, ensuring optimal progress in speaking, reading, and writing.',
  },
  {
    Icon: Megaphone,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    title: 'Native Speaker Practice',
    description: 'Connect with certified English tutors and conversation partners for real-world speaking practice and feedback.',
  },
  {
    Icon: Desktop,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: 'Mobile Learning',
    description: 'Learn anytime, anywhere with our mobile app featuring offline access, audio lessons, and progress tracking.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="bg-gray-50 py-16 md:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-12 md:mb-14">
          <span className="inline-flex items-center gap-2 text-violet-600 text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-violet-600 rounded-full" />
            Master English Skills
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-gray-900 leading-tight tracking-tight max-w-2xl mx-auto">
            Learn English With Interactive Tools & Expert Guidance
          </h2>
        </div>

        {/* Service cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {SERVICES.map((service) => {
            const { Icon } = service
            return (
              <motion.div
                key={service.title}
                variants={cardVariants}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(124, 58, 237, 0.12)"
                }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-violet-200 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-5">
                  <motion.div
                    className={`w-12 h-12 ${service.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
                    whileHover={{
                      rotate: [0, -10, 10, 0],
                      scale: 1.1
                    }}
                    transition={{
                      rotate: { duration: 0.5, ease: "easeInOut" },
                      scale: { duration: 0.2 }
                    }}
                  >
                    <Icon size={22} weight="duotone" className={service.iconColor} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">
                        {service.title}
                      </h3>
                      <motion.div
                        className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center group-hover:bg-violet-600 group-hover:border-violet-600 transition-all duration-300 flex-shrink-0 ml-3"
                        whileHover={{
                          rotate: 45,
                          scale: 1.1
                        }}
                        transition={{
                          rotate: { duration: 0.3 },
                          scale: { duration: 0.2 }
                        }}
                      >
                        <ArrowRight
                          size={14}
                          weight="bold"
                          className="text-gray-400 group-hover:text-white transition-colors duration-300"
                        />
                      </motion.div>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-600 transition-colors duration-300">
                      {service.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
