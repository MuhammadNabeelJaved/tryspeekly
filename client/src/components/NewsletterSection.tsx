import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EnvelopeSimple, ArrowRight, CheckCircle, Sparkle } from '@phosphor-icons/react'
import { axiosClient } from '@/lib/axiosClient'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await axiosClient.post('/newsletter/subscribers', { email: email.trim() })
      setStatus('success')
      setEmail('')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Something went wrong. Please try again.'
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 dark:from-violet-900 dark:via-purple-900 dark:to-violet-950">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Floating dots */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 text-white text-sm font-semibold mb-8 backdrop-blur-sm"
        >
          <Sparkle size={16} weight="fill" className="text-yellow-300" />
          Stay in the loop
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06 }}
          className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-5"
        >
          Get English tips & updates
          <br className="hidden md:block" />
          <span className="text-violet-200">straight to your inbox</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
          className="text-violet-100 text-lg leading-relaxed mb-10 max-w-xl mx-auto"
        >
          Join thousands of learners who get weekly grammar tips, vocabulary lessons, and exclusive course offers — no spam, ever.
        </motion.p>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.18 }}
        >
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl"
              >
                <CheckCircle size={24} weight="fill" className="text-emerald-300 flex-shrink-0" />
                <span>You're subscribed! Check your inbox.</span>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              >
                <div className="flex-1 relative">
                  <EnvelopeSimple
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/95 dark:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium outline-none focus:ring-2 focus:ring-white/60 transition-all"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={status === 'loading'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white text-violet-700 font-bold text-sm shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:bg-violet-50 disabled:opacity-60 transition-all whitespace-nowrap"
                >
                  {status === 'loading' ? (
                    <span className="w-5 h-5 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" />
                  ) : (
                    <>Subscribe <ArrowRight size={16} weight="bold" /></>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {status === 'error' && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-red-200 text-sm font-medium"
            >
              {errorMsg}
            </motion.p>
          )}

          {status !== 'success' && (
            <p className="mt-5 text-violet-200/70 text-xs">
              No spam. Unsubscribe anytime. We respect your privacy.
            </p>
          )}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-8 mt-12 pt-10 border-t border-white/15"
        >
          {[
            { value: '5,000+', label: 'Subscribers' },
            { value: 'Weekly', label: 'New content' },
            { value: '100%', label: 'Free forever' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-violet-200/70 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
