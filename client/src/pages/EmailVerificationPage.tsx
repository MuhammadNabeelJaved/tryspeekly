import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EnvelopeSimple, ArrowLeft, ArrowRight, Timer, Check } from '@phosphor-icons/react'
import FloatingCard from '../components/auth/FloatingCard'
import LoadingButton from '../components/auth/LoadingButton'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/auth.service'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

export default function EmailVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmail } = useAuth()
  const email = location.state?.email || ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(60)
  const [isResending, setIsResending] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true })
      return
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, navigate])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newCode.every((digit) => digit !== '')) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6)
    setCode(newCode)
    setError('')

    const lastFilledIndex = pastedData.length - 1
    if (lastFilledIndex < 6) {
      inputRefs.current[lastFilledIndex]?.focus()
    }

    if (pastedData.length === 6) {
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (fullCode: string) => {
    if (!fullCode || fullCode.length !== 6) return
    setIsLoading(true)
    setError('')

    try {
      await verifyEmail({ email, otp: fullCode })
      setIsVerified(true)
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      const role = stored?.role
      setTimeout(() => {
        if (role === 'admin') navigate('/admin', { replace: true })
        else if (role === 'teacher') navigate('/instructor', { replace: true })
        else navigate('/dashboard', { replace: true })
      }, 1500)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string }
      const message =
        axiosErr?.response?.data?.error?.message ||
        axiosErr?.message ||
        'Invalid verification code. Please try again.'
      setError(message)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError('')

    try {
      await authService.resendVerification(email)
      setResendTimer(60)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      setError(axiosErr?.response?.data?.error?.message || 'Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  if (isVerified) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-violet-50 px-4 dark:from-neutral-950 dark:via-neutral-900 dark:to-violet-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
          >
            <Check size={40} weight="bold" className="text-green-600 dark:text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Email Verified!</h2>
          <p className="mt-2 text-slate-600 dark:text-neutral-400">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-violet-50 text-slate-900 transition-colors duration-300 dark:from-neutral-950 dark:via-neutral-900 dark:to-violet-950 dark:text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-200/40 blur-[120px] dark:bg-violet-900/20" />
        <div className="absolute bottom-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-emerald-200/30 blur-[80px] dark:bg-emerald-900/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
              <EnvelopeSimple size={16} weight="fill" /> Verify your email
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-2xl space-y-6">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Enter the verification code.
              </h1>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                We've sent a 6-digit code to your email address. Enter it below to verify your account.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(16,185,129,0.08)] dark:border-neutral-800 dark:bg-neutral-950/95">
              <div className="flex items-center gap-4">
                <div className="rounded-3xl bg-emerald-600/10 p-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <EnvelopeSimple size={28} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Code sent to</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">{email}</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-emerald-600 dark:text-emerald-400">Quick tip</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Check your spam folder if you don't see the email within a few minutes.</p>
              </div>
              <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-emerald-600 dark:text-emerald-400">Security</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Your code expires in 10 minutes. Request a new one if needed.</p>
              </div>
            </motion.div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-x-6 top-0 h-40 bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />

            <motion.div
              variants={itemVariants}
              className="relative rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_80px_rgba(16,185,129,0.12)] dark:border-neutral-800 dark:bg-neutral-950/95"
            >
              <div className="mb-8">
                <Link
                  to="/signup"
                  className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400"
                >
                  <ArrowLeft size={16} /> Back to signup
                </Link>
                <p className="text-sm font-bold uppercase tracking-[0.32em] text-emerald-600 dark:text-emerald-400">Email verification</p>
                <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">Enter 6-digit code</h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
                  We sent a verification code to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-center gap-2 sm:gap-3">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={isLoading}
                      className="h-12 w-10 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-900 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-neutral-800 sm:h-14 sm:w-12 sm:text-2xl"
                      placeholder="0"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <LoadingButton
                onClick={() => handleVerify(code.join(''))}
                isLoading={isLoading}
                disabled={code.some((d) => !d)}
                className="w-full"
              >
                {isLoading ? 'Verifying...' : 'Verify email'}
              </LoadingButton>

              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
                  <Timer size={16} weight="bold" />
                  <span>
                    {resendTimer > 0 ? (
                      <>Resend code in <span className="font-semibold text-slate-700 dark:text-slate-200">{resendTimer}s</span></>
                    ) : (
                      'Code expired?'
                    )}
                  </span>
                </div>

                {resendTimer === 0 && (
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    {isResending ? 'Sending...' : 'Resend code'}
                    {!isResending && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
                  </button>
                )}
              </div>
            </motion.div>

            <FloatingCard
              icon={<EnvelopeSimple size={20} weight="fill" />}
              title="Check Inbox"
              subtitle="Now"
              position="top-right"
              delay={0.9}
            />

            <FloatingCard
              icon={<Timer size={20} weight="fill" />}
              title="10 Minutes"
              subtitle="Expiry"
              position="bottom-left"
              delay={1.1}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}