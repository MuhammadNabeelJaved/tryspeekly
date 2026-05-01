import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShieldCheck, LockKey, UserFocus, Database, EnvelopeSimple, Info, ArrowLeft } from '@phosphor-icons/react'

export default function PrivacyPolicyPage() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const SECTIONS = [
    { id: 'introduction', title: '1. Introduction', icon: Info },
    { id: 'data-collection', title: '2. Information We Collect', icon: Database },
    { id: 'data-usage', title: '3. How We Use Your Data', icon: UserFocus },
    { id: 'data-protection', title: '4. Data Protection', icon: ShieldCheck },
    { id: 'your-rights', title: '5. Your Rights', icon: LockKey },
    { id: 'contact', title: '6. Contact Us', icon: EnvelopeSimple },
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
                <ShieldCheck size={32} weight="fill" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-slate-500 dark:text-neutral-400 leading-relaxed font-light">
              We value your privacy and are committed to protecting your personal data. This policy outlines how we collect, use, and safeguard your information.
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
              
              {/* Introduction */}
              <div id="introduction" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Info size={20} weight="bold" />
                  </span>
                  1. Introduction
                </h2>
                <div className="bg-violet-50 dark:bg-violet-900/10 border-l-4 border-violet-500 p-6 rounded-r-xl mb-6 text-slate-700 dark:text-neutral-200">
                  <p className="m-0 font-medium"><strong>TL;DR:</strong> We only collect data necessary to provide you with the best English learning experience. We never sell your personal information to third parties.</p>
                </div>
                <p>
                  Welcome to EnglishPro. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our learning platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
                </p>
                <p>
                  We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy.
                </p>
              </div>

              {/* Information We Collect */}
              <div id="data-collection" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Database size={20} weight="bold" />
                  </span>
                  2. Information We Collect
                </h2>
                <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
                <ul className="space-y-3 mt-4">
                  <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information that you voluntarily give to us when you register.</li>
                  <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
                  <li><strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services.</li>
                </ul>
              </div>

              {/* How We Use Your Data */}
              <div id="data-usage" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <UserFocus size={20} weight="bold" />
                  </span>
                  3. How We Use Your Data
                </h2>
                <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
                <ul className="space-y-3 mt-4">
                  <li>Create and manage your account.</li>
                  <li>Process your transactions and send you related information, including purchase confirmations and invoices.</li>
                  <li>Deliver course materials, track your progress, and issue certificates.</li>
                  <li>Email you regarding your account or order.</li>
                  <li>Respond to customer service requests and provide support.</li>
                </ul>
              </div>

              {/* Data Protection */}
              <div id="data-protection" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={20} weight="bold" />
                  </span>
                  4. Data Protection
                </h2>
                <p>
                  We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                </p>
              </div>

              {/* Your Rights */}
              <div id="your-rights" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <LockKey size={20} weight="bold" />
                  </span>
                  5. Your Rights
                </h2>
                <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                <ul className="space-y-3 mt-4">
                  <li>The right to access – You have the right to request copies of your personal data.</li>
                  <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate.</li>
                  <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
                  <li>The right to restrict processing – You have the right to request that we restrict the processing of your personal data.</li>
                </ul>
              </div>

              {/* Contact Us */}
              <div id="contact" className="scroll-mt-32 mb-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <EnvelopeSimple size={20} weight="bold" />
                  </span>
                  6. Contact Us
                </h2>
                <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
                <div className="bg-slate-50 dark:bg-neutral-950 p-6 rounded-2xl mt-6 border border-slate-100 dark:border-neutral-800">
                  <p className="m-0 font-bold text-slate-900 dark:text-white">EnglishPro Education</p>
                  <p className="m-0 mt-2">123 Education Street</p>
                  <p className="m-0">New York, NY 10001</p>
                  <p className="m-0 mt-2 text-violet-600 dark:text-violet-400 font-semibold">privacy@englishlms.com</p>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
