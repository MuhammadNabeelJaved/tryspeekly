import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STEPS = [
  {
    name: 'Assess Your Level',
    role: 'Take our placement test to determine your current English proficiency and get matched with the right trainer and program.',
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
  },
  {
    name: 'Attend Live Sessions',
    role: 'Attend scheduled live sessions on Zoom or Google Meet with your trainer — structured, interactive, and tailored to your goals.',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
  },
  {
    name: 'Practice & Connect',
    role: 'Join live conversation sessions, connect with tutors, and practice with peers to achieve real-world fluency.',
    img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80',
  },
  {
    name: 'Track Progress',
    role: 'Monitor your improvement with detailed analytics, certificates, and celebrate milestones on your learning journey.',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="bg-gray-50 dark:bg-slate-950 py-16 md:py-20 lg:py-28 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-12 md:mb-14">
          <span className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-200 text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full" />
            Learning Process
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
            Your Journey to English Fluency in 4 Simple Steps
          </h2>
        </div>

        {/* Team cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {STEPS.map((step, index) => (
            <motion.div
              key={step.name}
              variants={cardVariants}
              whileHover={{ scale: 1.04 }}
              className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all duration-300 cursor-pointer shadow-sm"
            >
              {/* Photo */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={step.img}
                  alt={step.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-800 via-transparent to-transparent" />

                {/* Step number overlay */}
                <motion.div
                  className="absolute top-4 left-4 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  whileHover={{
                    scale: 1.2,
                    rotate: 360
                  }}
                  transition={{
                    scale: { duration: 0.2 },
                    rotate: { duration: 0.6, ease: "easeInOut" }
                  }}
                >
                  {index + 1}
                </motion.div>
              </div>

              {/* Info */}
              <div className="p-5">
                <motion.h3
                  className="font-bold text-gray-900 dark:text-white text-[15px] mb-0.5"
                  whileHover={{ color: "#7c3aed" }}
                  transition={{ duration: 0.2 }}
                >
                  {step.name}
                </motion.h3>
                <motion.p
                  className="text-gray-500 dark:text-gray-400 text-sm mb-4"
                  whileHover={{ color: "#64748b" }}
                  transition={{ duration: 0.2 }}
                >
                  {step.role}
                </motion.p>

                {/* Animated arrow */}
                <motion.div
                  className="flex items-center gap-2.5"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <motion.div
                    className="w-8 h-8 bg-violet-100 dark:bg-violet-600/20 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-200"
                    whileHover={{
                      backgroundColor: "rgba(124, 58, 237, 0.2)",
                      scale: 1.1
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.span
                      className="text-xs font-bold"
                      animate={{
                        scale: [1, 1.2, 1],
                        color: ["#7c3aed", "#a78bfa", "#7c3aed"]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {index + 1}
                    </motion.span>
                  </motion.div>
                  <motion.span
                    className="text-violet-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                  >
                    Learn More
                  </motion.span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
