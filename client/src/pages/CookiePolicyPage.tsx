import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Cookie, Gear, Globe, ChartBar, Trash, ArrowLeft } from '@phosphor-icons/react'

export default function CookiePolicyPage() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const SECTIONS = [
    { id: 'what-are-cookies', title: '1. What Are Cookies?', icon: Cookie },
    { id: 'how-we-use', title: '2. How We Use Cookies', icon: Globe },
    { id: 'types', title: '3. Types We Use', icon: ChartBar },
    { id: 'managing', title: '4. Managing Preferences', icon: Gear },
    { id: 'updates', title: '5. Policy Updates', icon: Trash },
  ]

  return (
    <div className="bg-slate-50 dark:bg-neutral-950 min-h-screen pt-[72px] lg:pt-[80px] pb-24 selection:bg-violet-200 dark:selection:bg-violet-900/50">
      
      {/* ─── HERO SECTION ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-900 dark:bg-black py-16 lg:py-24 border-b border-white/5 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#ffffff_1px,transparent_1px)] bg-[size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-violet-300 hover:text-white transition-colors text-sm font-medium mb-6 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
            </Link>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center text-violet-300 backdrop-blur-sm border border-violet-500/30">
                <Cookie size={32} weight="fill" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
              Cookie Policy
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed font-light">
              We use cookies to improve your browsing experience, analyze site traffic, and personalize content. Learn how and why we use them.
            </p>
            <p className="text-sm text-slate-400 mt-8 font-medium">
              Last Updated: <span className="text-white">May 15, 2026</span>
            </p>
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
              
              {/* Intro */}
              <div id="what-are-cookies" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Cookie size={20} weight="bold" />
                  </span>
                  1. What Are Cookies?
                </h2>
                <div className="bg-violet-50 dark:bg-violet-900/10 border-l-4 border-violet-500 p-6 rounded-r-xl mb-6 text-slate-700 dark:text-neutral-200">
                  <p className="m-0 font-medium"><strong>TL;DR:</strong> Cookies are tiny text files saved on your device that help our website remember you and function properly.</p>
                </div>
                <p>
                  Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                </p>
              </div>

              {/* How We Use */}
              <div id="how-we-use" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Globe size={20} weight="bold" />
                  </span>
                  2. How We Use Cookies
                </h2>
                <p>We use cookies for several reasons, including:</p>
                <ul className="space-y-3 mt-4">
                  <li>Keeping you signed in to your account.</li>
                  <li>Remembering your site preferences and course progress.</li>
                  <li>Understanding how you use our platform so we can improve it.</li>
                  <li>Providing you with relevant content and personalized learning experiences.</li>
                </ul>
              </div>

              {/* Types */}
              <div id="types" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ChartBar size={20} weight="bold" />
                  </span>
                  3. Types of Cookies We Use
                </h2>
                <ul className="space-y-3 mt-4">
                  <li><strong>Essential Cookies:</strong> Required for the website to function. Without them, you couldn't log in or purchase courses.</li>
                  <li><strong>Analytical/Performance Cookies:</strong> Allow us to recognize and count the number of visitors and see how visitors move around our website.</li>
                  <li><strong>Functionality Cookies:</strong> Used to recognize you when you return to our website (e.g., remembering your language or region).</li>
                </ul>
              </div>

              {/* Managing Preferences */}
              <div id="managing" className="scroll-mt-32 mb-12">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Gear size={20} weight="bold" />
                  </span>
                  4. Managing Your Cookie Preferences
                </h2>
                <p>
                  Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, as it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
                </p>
                <p>
                  You can usually find these settings in the "Options" or "Preferences" menu of your browser.
                </p>
              </div>

              {/* Updates */}
              <div id="updates" className="scroll-mt-32 mb-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Trash size={20} weight="bold" />
                  </span>
                  5. Updates to This Policy
                </h2>
                <p>We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this page regularly to stay informed about our use of cookies.</p>
              </div>

            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
