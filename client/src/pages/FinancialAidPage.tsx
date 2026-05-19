import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Handshake, VideoCamera, CheckCircle, WarningCircle, CaretRight, ShieldCheck, GraduationCap, Question, CaretDown, Star, Certificate, Target, LockSimple, UserPlus } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function FinancialAidPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const FAQS = [
    { q: "How long does the verification process take?", a: "After you submit your application, our team will review it and contact you within 3-5 business days to schedule a brief verification call." },
    { q: "Are there any hidden charges?", a: "No. If your financial aid application is approved, you will receive a 100% scholarship. There are no hidden fees or charges." },
    { q: "What documents do I need for verification?", a: "We usually require a brief video call. In some cases, we may ask for a student ID or a basic proof of income/unemployment, but we focus mainly on your interview." },
    { q: "Do financial aid students get the same certificate?", a: "Yes! You get access to the exact same live classes, study materials, community groups, and the final certificate as paid students." }
  ]

  const INCLUDED = [
    { icon: <VideoCamera size={24} weight="fill" />, title: "Live Classes", desc: "Full access to all interactive live sessions with our expert instructors." },
    { icon: <Star size={24} weight="fill" />, title: "Premium Materials", desc: "Get all worksheets, slides, and recording access." },
    { icon: <Certificate size={24} weight="fill" />, title: "Verified Certificate", desc: "Earn the same completion certificate to boost your resume." }
  ]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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

            {/* Right Column: Auth Gate */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-neutral-800 sticky top-[100px]"
              >
                {user?.role === 'student' ? (
                  /* Logged-in student — redirect to dashboard */
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Handshake size={32} weight="fill" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Ready to Apply?</h3>
                    <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                      You're signed in as <span className="font-bold text-slate-700 dark:text-neutral-200">{user.name}</span>. Head to your dashboard to submit your financial aid application.
                    </p>
                    <button
                      onClick={() => navigate('/dashboard/financial-aid')}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all"
                    >
                      Apply for Financial Aid <CaretRight size={18} weight="bold" />
                    </button>
                  </div>
                ) : user ? (
                  /* Logged in but not a student */
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5">
                      <WarningCircle size={32} weight="fill" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Student Accounts Only</h3>
                    <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed">
                      Financial aid is available for student accounts only. Please sign in or register with a student account to apply.
                    </p>
                  </div>
                ) : (
                  /* Not logged in */
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockSimple size={28} weight="fill" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Account Required</h3>
                      <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed">
                        You need a free student account to apply for financial aid. Create one in seconds — it's completely free.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Link
                        to="/register"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all"
                      >
                        <UserPlus size={18} weight="bold" /> Create Free Account
                      </Link>
                      <Link
                        to="/login"
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-bold py-4 rounded-xl transition-all"
                      >
                        Already have an account? Sign In <CaretRight size={16} weight="bold" />
                      </Link>
                    </div>

                    <div className="flex items-start gap-3 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-2xl p-4">
                      <CheckCircle size={16} weight="fill" className="text-violet-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                        Registration is free and takes less than a minute. Once signed in, you can submit your financial aid application directly from your student dashboard.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── ELIGIBILITY & WHAT'S INCLUDED ──────────────────────────────── */}
      <section className="relative py-16 lg:py-24 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Eligibility */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <span className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider text-xs mb-3">
                  <Target size={16} weight="bold" /> Who Can Apply
                </span>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Eligibility Criteria</h2>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Our financial aid program is designed specifically for those who possess the passion to learn but lack the financial means to afford standard course fees.
                </p>
              </div>

              <ul className="space-y-4">
                {[
                  "Currently unemployed or from a low-income household",
                  "Demonstrated strong desire and commitment to complete the course",
                  "Access to a stable internet connection and a device for live classes",
                  "Willingness to participate in a quick verification call"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} weight="bold" />
                    </div>
                    <span className="text-slate-700 dark:text-neutral-300 font-medium text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* What's Included */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs mb-3">
                  <GraduationCap size={16} weight="bold" /> Equal Access
                </span>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">What's Included?</h2>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Financial aid students are treated exactly the same as our paid students. You will receive 100% of the benefits to ensure your success.
                </p>
              </div>

              <div className="grid gap-4">
                {INCLUDED.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────── */}
      <section className="relative py-16 lg:py-24 bg-white dark:bg-neutral-900 border-y border-slate-200 dark:border-neutral-800 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold rounded-full uppercase tracking-wider mb-4">
              <Question size={16} weight="bold" />
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-neutral-400 text-lg">Got questions about the financial aid process? We've got answers.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={idx} className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10 shadow-sm' : 'border-slate-200 dark:border-neutral-800 hover:border-violet-200 dark:hover:border-neutral-700'}`}>
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex items-center justify-between w-full p-5 text-left"
                  >
                    <span className="text-base font-bold text-slate-900 dark:text-white pr-4">{faq.q}</span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="flex-shrink-0 text-violet-600 dark:text-violet-400">
                      <CaretDown size={20} weight="bold" />
                    </motion.div>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 text-slate-600 dark:text-neutral-400 leading-relaxed text-sm">
                      {faq.a}
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

    </div>
  )
}
