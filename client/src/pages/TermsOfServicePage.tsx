import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FileText, Users, CreditCard, WarningCircle, ArrowLeft, Gavel } from '@phosphor-icons/react'

export default function TermsOfServicePage() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const SECTIONS = [
    { id: 'agreement', title: '1. Agreement to Terms', icon: FileText },
    { id: 'accounts', title: '2. User Accounts', icon: Users },
    { id: 'payments', title: '3. Payments & Refunds', icon: CreditCard },
    { id: 'conduct', title: '4. Prohibited Conduct', icon: WarningCircle },
    { id: 'modifications', title: '5. Modifications', icon: Gavel },
  ]

  return (
    <div className="bg-slate-50 dark:bg-neutral-950 min-h-screen pt-[72px] lg:pt-[80px] pb-24 selection:bg-violet-200 dark:selection:bg-violet-900/50">
      
      {/* ─── HERO SECTION ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-neutral-900 py-16 lg:py-24 border-b border-slate-100 dark:border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-100/60 dark:bg-violet-900/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors text-sm font-bold mb-8 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
            </Link>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-xl shadow-violet-600/5 dark:shadow-none border border-slate-100 dark:border-neutral-700">
                <FileText size={32} weight="fill" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6">
              Terms of Service
            </h1>
            <p className="text-lg text-slate-500 dark:text-neutral-400 leading-relaxed font-light">
              These terms govern your use of EnglishPro. By accessing our platform, you agree to abide by these rules and guidelines.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-500"></span>
              Last Updated: <span className="text-slate-900 dark:text-white font-bold">May 15, 2026</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CONTENT ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 lg:mt-16">
        <div className="grid lg:grid-cols-[300px_1fr] gap-12 items-start">
          
          {/* Sidebar TOC */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:block sticky top-[100px] bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-neutral-800"
          >
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Table of Contents</h3>
            <nav className="space-y-2">
              {SECTIONS.map((sec) => (
                <button 
                  key={sec.id}
                  onClick={() => {
                    const el = document.getElementById(sec.id)
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.scrollY - 100
                      window.scrollTo({ top: y, behavior: 'smooth' })
                    }
                  }}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  <sec.icon size={18} className="text-slate-400" />
                  {sec.title}
                </button>
              ))}
            </nav>
          </motion.div>

          {/* Policy Text */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-neutral-900 rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-100 dark:border-neutral-800"
          >
            <div className="prose prose-lg dark:prose-invert max-w-none text-slate-600 dark:text-neutral-300 leading-relaxed">
              
              {/* Agreement */}
              <div id="agreement" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <FileText size={20} weight="bold" />
                  </span>
                  1. Agreement to Terms
                </h2>
                <div className="bg-violet-50 dark:bg-violet-900/10 border-l-4 border-violet-500 p-6 rounded-r-xl mb-6 text-slate-700 dark:text-neutral-200">
                  <p className="m-0 font-medium"><strong>TL;DR:</strong> By using our website, you agree to these rules. If you don't agree, please do not use EnglishPro.</p>
                </div>
                <p>
                  These Terms of Service constitute a legally binding agreement made between you and EnglishPro, concerning your access to and use of our website as well as any other media form or application related to it.
                </p>
              </div>

              {/* Accounts */}
              <div id="accounts" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Users size={20} weight="bold" />
                  </span>
                  2. User Accounts
                </h2>
                <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.</p>
                <ul className="space-y-3 mt-4">
                  <li>You are responsible for safeguarding the password that you use to access the Service.</li>
                  <li>You agree not to disclose your password to any third party.</li>
                  <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
                </ul>
              </div>

              {/* Payments & Refunds */}
              <div id="payments" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CreditCard size={20} weight="bold" />
                  </span>
                  3. Payments & Refunds
                </h2>
                <p>
                  We offer a 30-Day Money-Back Guarantee for most of our courses. If you are unsatisfied with a course, you can request a full refund within 30 days of your purchase.
                </p>
                <p>
                  Refunds are not applicable if a significant portion of the course has been completed or downloaded. We reserve the right to decline refund requests if we believe the policy is being abused.
                </p>
              </div>

              {/* Prohibited Conduct */}
              <div id="conduct" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <WarningCircle size={20} weight="bold" />
                  </span>
                  4. Prohibited Conduct
                </h2>
                <p>You agree not to use the Service to:</p>
                <ul className="space-y-3 mt-4">
                  <li>Copy, distribute, or disclose any part of the course materials in any medium.</li>
                  <li>Attempt to interfere with or compromise the system integrity or security.</li>
                  <li>Harass, abuse, or harm other users or instructors.</li>
                  <li>Share your account login with others (each account is for a single user).</li>
                </ul>
              </div>

              {/* Modifications */}
              <div id="modifications" className="scroll-mt-32 mb-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Gavel size={20} weight="bold" />
                  </span>
                  5. Modifications to Terms
                </h2>
                <p>We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after such modifications constitutes your acceptance of the new Terms.</p>
              </div>

            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
