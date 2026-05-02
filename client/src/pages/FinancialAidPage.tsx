import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Handshake, VideoCamera, CheckCircle, WarningCircle, CaretRight, ShieldCheck } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export default function FinancialAidPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1500)
  }

  return (
    <div className="bg-slate-50 dark:bg-neutral-950 min-h-screen pt-[72px] lg:pt-[80px] pb-24 selection:bg-emerald-200 dark:selection:bg-emerald-900/50">
      
      {/* ─── HERO HEADER ──────────────────────────────── */}
      <div className="relative bg-slate-900 dark:bg-black text-white pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold rounded-full uppercase tracking-wider mb-6">
              <Heart size={18} weight="fill" />
              <span>Financial Aid Program</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-6 tracking-tight text-white drop-shadow-sm">
              Learn English for <span className="text-emerald-400">Free.</span>
            </h1>
            
            <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-8 font-light">
              We believe education should be accessible to everyone. If you truly cannot afford our live cohort fees, apply for our financial aid program. Verification is required.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────── */}
      <section className="relative -mt-12 lg:-mt-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Information & Process */}
            <div className="lg:col-span-7 space-y-8">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-neutral-800"
              >
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Handshake size={24} weight="fill" />
                  </div>
                  How It Works
                </h2>
                
                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-neutral-800">
                  
                  <div className="relative flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold flex-shrink-0 z-10 shadow-md shadow-violet-600/20">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Submit Application</h3>
                      <p className="text-slate-600 dark:text-neutral-400 leading-relaxed text-sm">
                        Fill out the form with your honest details. Explain why you want to learn English and why you are currently unable to afford the course fee.
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold flex-shrink-0 z-10 shadow-md shadow-emerald-500/20">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        Live Verification Call <VideoCamera size={20} className="text-emerald-500" />
                      </h3>
                      <p className="text-slate-600 dark:text-neutral-400 leading-relaxed text-sm mb-3">
                        If shortlisted, our team will schedule a brief 5-10 minute Zoom or Google Meet call with you. This is a mandatory step to verify your identity and financial situation.
                      </p>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-start gap-2 border border-emerald-100 dark:border-emerald-900/30">
                        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                        <p>We do this to ensure that the free seats go to those who genuinely need them and to prevent misuse of the program.</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0 z-10 shadow-md shadow-blue-500/20">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Start Learning</h3>
                      <p className="text-slate-600 dark:text-neutral-400 leading-relaxed text-sm">
                        Once verified, you will be enrolled in our upcoming live cohort completely free of charge. You'll have access to all materials, live sessions, and community features.
                      </p>
                    </div>
                  </div>
                  
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl p-6 sm:p-8 border border-amber-200 dark:border-amber-900/30"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center flex-shrink-0">
                    <WarningCircle size={24} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-500 mb-2">Important Notice</h3>
                    <p className="text-amber-800 dark:text-amber-200/70 text-sm leading-relaxed mb-3">
                      Seats for the financial aid program are limited per cohort. Applying does not guarantee enrollment. We strictly verify applicants to prevent fraud. 
                    </p>
                    <p className="text-amber-800 dark:text-amber-200/70 text-sm leading-relaxed">
                      If you can afford the course, we kindly ask you to <Link to="/courses" className="font-bold underline underline-offset-4 hover:text-amber-600">purchase it</Link> to support our instructors and allow us to keep offering free seats to those in true need.
                    </p>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Right Column: Application Form */}
            <div className="lg:col-span-5">
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-neutral-800 sticky top-[100px]"
              >
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Application Form</h3>
                
                {isSubmitted ? (
                  <div className="text-center py-10">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} weight="fill" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Application Received</h4>
                    <p className="text-slate-600 dark:text-neutral-400 text-sm leading-relaxed mb-8">
                      Thank you for applying. Our team will review your application and contact you via email or WhatsApp within 3-5 business days to schedule your verification call.
                    </p>
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="text-violet-600 dark:text-violet-400 font-bold text-sm hover:underline underline-offset-4"
                    >
                      Submit another application
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2">Full Name <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        id="name" 
                        required
                        className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white transition-shadow"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2">Email Address <span className="text-rose-500">*</span></label>
                      <input 
                        type="email" 
                        id="email" 
                        required
                        className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white transition-shadow"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2">WhatsApp Number <span className="text-rose-500">*</span></label>
                      <input 
                        type="tel" 
                        id="phone" 
                        required
                        className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white transition-shadow"
                        placeholder="+1 234 567 890"
                      />
                      <p className="text-xs text-slate-500 mt-2">Required for scheduling the verification call.</p>
                    </div>

                    <div>
                      <label htmlFor="reason" className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2">Why do you need financial aid? <span className="text-rose-500">*</span></label>
                      <textarea 
                        id="reason" 
                        rows={4}
                        required
                        className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white transition-shadow resize-none"
                        placeholder="Please explain your financial situation honestly..."
                      ></textarea>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input type="checkbox" required className="peer sr-only" />
                          <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-neutral-700 peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-colors" />
                          <CheckCircle size={14} weight="bold" className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                          I confirm that the information provided is accurate and truthful. I agree to participate in a live verification call to prove my eligibility.
                        </span>
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        <>Submit Application <CaretRight size={18} weight="bold" /></>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
