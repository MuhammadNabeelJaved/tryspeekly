import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import { VideoCamera, Trophy, Briefcase, Certificate, ArrowRight, Sparkle } from '@phosphor-icons/react'

const SERVICES = [
  {
    Icon: VideoCamera,
    bgGradient: 'from-violet-500 to-purple-600',
    glowColor: 'group-hover:shadow-violet-500/25',
    title: 'Live Training',
    description: 'Attend live classes with expert trainers on Zoom & Google Meet. Real-time interaction, instant feedback, and structured sessions that fit your schedule.',
    colSpan: 'col-span-1 md:col-span-2 lg:col-span-2',
  },
  {
    Icon: Trophy,
    bgGradient: 'from-violet-500 to-purple-600',
    glowColor: 'group-hover:shadow-violet-500/25',
    title: '8+ Bands in IELTS',
    description: 'Proven strategies and targeted practice to help you achieve band 8 or above in your IELTS exam.',
    colSpan: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    Icon: Briefcase,
    bgGradient: 'from-violet-500 to-purple-600',
    glowColor: 'group-hover:shadow-violet-500/25',
    title: 'Job Interview Prep',
    description: 'Master professional English for interviews, presentations, and workplace communication with real-world practice sessions.',
    colSpan: 'col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    Icon: Certificate,
    bgGradient: 'from-violet-500 to-purple-600',
    glowColor: 'group-hover:shadow-violet-500/25',
    title: 'Shareable Certificate',
    description: 'Earn a recognised certificate upon course completion and share it directly on LinkedIn or with potential employers.',
    colSpan: 'col-span-1 md:col-span-2 lg:col-span-2',
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-950 py-20 md:py-28 lg:py-32 transition-colors duration-300">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-violet-600/10 dark:bg-violet-600/10 blur-[100px]"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.5, 1] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/10 dark:bg-purple-600/10 blur-[100px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50/50 dark:bg-white/5 border border-violet-100 dark:border-white/10 backdrop-blur-sm mb-6"
          >
            <Sparkle size={16} weight="fill" className="text-violet-600 dark:text-violet-400" />
            <span className="text-violet-700 dark:text-violet-300 text-sm font-bold tracking-wide uppercase">
              What We Offer
            </span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight max-w-4xl mx-auto"
          >
            Everything You Need To{' '}
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 dark:from-violet-400 dark:via-purple-400 dark:to-blue-400">
              Master English
            </span>
          </motion.h2>
        </div>

        {/* Bento Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]"
        >
          {SERVICES.map((service) => {
            const { Icon } = service
            return (
              <motion.div
                key={service.title}
                variants={cardVariants}
                whileHover={{ y: -8 }}
                className={`group relative rounded-3xl p-8 sm:p-10 bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 backdrop-blur-md overflow-hidden transition-all duration-500 hover:bg-gray-50 dark:hover:bg-slate-800/70 shadow-xl dark:shadow-2xl ${service.glowColor} ${service.colSpan}`}
              >
                {/* Hover Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.bgGradient} opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-10 transition-opacity duration-500`} />
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-8">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.bgGradient} p-[2px] shadow-lg`}
                    >
                      <div className="w-full h-full bg-white dark:bg-slate-900 backdrop-blur-xl rounded-xl flex items-center justify-center">
                        <Icon size={32} weight="duotone" className="text-violet-600 dark:text-white" />
                      </div>
                    </motion.div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1, rotate: -45 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center group-hover:border-violet-300 dark:group-hover:border-white/30 group-hover:bg-violet-50 dark:group-hover:bg-slate-700/50 transition-all duration-300"
                    >
                      <ArrowRight size={20} className="text-gray-400 group-hover:text-violet-600 dark:group-hover:text-white transition-colors" />
                    </motion.button>
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-purple-600 dark:group-hover:from-white dark:group-hover:to-white/70 transition-all duration-300">
                      {service.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* Decorative glowing dot */}
                <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${service.bgGradient} blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-full`} />
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
