import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart, Handshake, CheckCircle, VideoCamera } from '@phosphor-icons/react'

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function FinancialAidSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="bg-white dark:bg-neutral-950 py-16 lg:py-24 transition-colors duration-300 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-neutral-900 dark:to-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800/50 dark:border-white/10"
        >
          <div className="grid lg:grid-cols-2 items-center">
            
            {/* Content Side */}
            <div className="p-8 md:p-12 lg:p-16 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider mb-6">
                <Heart size={16} weight="fill" />
                <span>Financial Aid Available</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                Can't afford the fee? <br className="hidden sm:block"/>
                <span className="text-emerald-400">Learn for free.</span>
              </h2>
              
              <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                We believe that financial barriers shouldn't stop anyone from mastering English. If you truly cannot afford the course, we offer <strong>100% free enrollment</strong> to verified students.
              </p>

              <div className="space-y-4 mb-10 text-slate-300 text-sm max-w-md mx-auto lg:mx-0 text-left">
                <div className="flex items-start gap-3">
                  <Handshake size={20} className="text-violet-400 flex-shrink-0 mt-0.5" weight="duotone" />
                  <p><strong>Step 1:</strong> Submit your application for financial aid.</p>
                </div>
                <div className="flex items-start gap-3">
                  <VideoCamera size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="duotone" />
                  <p><strong>Step 2:</strong> Verification via a brief 1-on-1 live call.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" weight="duotone" />
                  <p><strong>Step 3:</strong> Get full access to live classes, completely free.</p>
                </div>
              </div>

              <Link 
                to="/financial-aid"
                className="inline-flex items-center justify-center bg-white text-slate-900 hover:bg-slate-100 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Apply for Financial Aid
              </Link>
            </div>

            {/* Image/Visual Side */}
            <div className="relative hidden lg:block h-full min-h-[500px]">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-40 dark:opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 dark:from-neutral-900 to-transparent w-full lg:w-1/2" />
              
              {/* Floating badges */}
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 right-12 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <Heart size={24} weight="fill" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">100% Free</p>
                  <p className="text-slate-300 text-xs">For verified students</p>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }} 
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/3 right-24 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center text-white">
                  <VideoCamera size={24} weight="fill" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Live Verification</p>
                  <p className="text-slate-300 text-xs">Quick 5-min call</p>
                </div>
              </motion.div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  )
}
