import { motion } from 'framer-motion'
import { ArrowRight, Play } from '@phosphor-icons/react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 to-white min-h-screen overflow-hidden pt-[72px] md:pt-[80px]">
      {/* Minimal background elements - hidden on mobile for cleaner look */}
      <div className="hidden md:block absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-violet-100 to-purple-50 rounded-full blur-3xl opacity-60" />
      <div className="hidden md:block absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-32 min-h-[calc(100vh-72px)] md:min-h-[calc(100vh-80px)] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left: Clean Copy */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

            {/* Minimal Badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 text-violet-600 text-sm font-medium tracking-wide uppercase">
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                Trusted by 50,000+ learners
              </span>
            </motion.div>

            {/* Clean Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight"
            >
              Learn English
              <span className="block text-violet-600">with confidence</span>
            </motion.h1>

            {/* Simple Description */}
            <motion.p variants={itemVariants} className="text-gray-600 text-lg leading-relaxed max-w-lg">
              Master English through interactive lessons, personalized learning paths, and expert guidance designed for every level.
            </motion.p>

            {/* Clean CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Learning Free
                <ArrowRight size={18} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group border border-gray-300 hover:border-violet-300 text-gray-700 font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:bg-violet-50"
              >
                <Play size={18} className="inline mr-2" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Minimal Social Proof */}
            <motion.div variants={itemVariants} className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&q=80',
                  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=40&q=80',
                  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&q=80',
                ].map((src, i) => (
                  <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">4.9/5</span> from 10,000+ reviews
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Clean Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="relative flex justify-center items-center min-h-[400px] md:min-h-[500px]"
          >
            {/* Clean circular background - responsive sizing */}
            <div className="absolute w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-violet-100 to-purple-50 rounded-full opacity-80" />
            <div className="absolute w-52 h-52 md:w-64 md:h-64 bg-white rounded-full shadow-lg border border-gray-100" />

            {/* Person image - responsive sizing */}
            <div className="relative z-10">
              <div className="w-60 h-80 md:w-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80"
                  alt="English learner"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Minimal floating element - hidden on mobile for cleaner look */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden md:block absolute top-8 right-8 bg-white rounded-xl shadow-lg border border-gray-100 p-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Play size={12} weight="fill" className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">Speaking Practice</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
