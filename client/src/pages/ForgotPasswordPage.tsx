import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { LockKey, EnvelopeSimple, ArrowLeft, Check, ShieldCheck } from '@phosphor-icons/react'
import FormInput from '../components/auth/FormInput'
import LoadingButton from '../components/auth/LoadingButton'
import FloatingCard from '../components/auth/FloatingCard'
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator'
import { isValidEmail, isStrongPassword } from '../utils/validation'
import { authService } from '../services/auth.service'
import { extractApiError } from '../utils/apiError'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  // Step 1 — email
  const [step, setStep] = useState<1 | 2 | 'done'>(1)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isEmailLoading, setIsEmailLoading] = useState(false)

  // Step 2 — OTP + new password
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetErrors, setResetErrors] = useState({ otp: '', newPassword: '', confirmPassword: '', general: '' })
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [isResending, setIsResending] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (step === 2) {
      inputRefs.current[0]?.focus()
      setResendTimer(60)
    }
  }, [step])

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => setResendTimer((p) => (p <= 1 ? (clearInterval(t), 0) : p - 1)), 1000)
    return () => clearInterval(t)
  }, [resendTimer])

  // ─── Step 1 handlers ────────────────────────────────────────────────────────

  const validateEmail = () => {
    if (!email) { setEmailError('Email is required'); return false }
    if (!isValidEmail(email)) { setEmailError('Please enter a valid email address'); return false }
    setEmailError('')
    return true
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateEmail()) return

    setIsEmailLoading(true)
    try {
      await authService.forgotPassword({ email })
      setStep(2)
    } catch (err) {
      const msg = extractApiError(err, 'Failed to send reset code. Please try again.')
      setEmailError(msg)
      toast.error(msg)
    } finally {
      setIsEmailLoading(false)
    }
  }

  // ─── Step 2 — OTP input ──────────────────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...code]
    next[index] = value.slice(-1)
    setCode(next)
    setResetErrors((p) => ({ ...p, otp: '' }))
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pasted)) return
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setCode(next)
    const lastIdx = pasted.length - 1
    if (lastIdx < 6) inputRefs.current[lastIdx]?.focus()
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      await authService.forgotPassword({ email })
      setResendTimer(60)
      toast.success('New reset code sent to your email.')
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to resend code.'))
    } finally {
      setIsResending(false)
    }
  }

  const validateReset = () => {
    const errs = { otp: '', newPassword: '', confirmPassword: '', general: '' }
    let ok = true
    if (code.some((d) => !d)) { errs.otp = 'Please enter the 6-digit code'; ok = false }
    if (!newPassword) { errs.newPassword = 'Password is required'; ok = false }
    else if (!isStrongPassword(newPassword)) {
      errs.newPassword = 'Password must be at least 8 characters with uppercase, number, and special character'
      ok = false
    }
    if (!confirmPassword) { errs.confirmPassword = 'Please confirm your password'; ok = false }
    else if (newPassword !== confirmPassword) { errs.confirmPassword = 'Passwords do not match'; ok = false }
    setResetErrors(errs)
    return ok
  }

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateReset()) return

    setIsResetLoading(true)
    try {
      await authService.resetPassword({ email, otp: code.join(''), newPassword, confirmPassword })
      setStep('done')
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      const msg = extractApiError(err, 'Failed to reset password. Please try again.')
      setResetErrors((p) => ({ ...p, general: msg }))
      toast.error(msg)
    } finally {
      setIsResetLoading(false)
    }
  }

  // ─── Done state ──────────────────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-violet-50 px-4 dark:from-neutral-950 dark:via-neutral-900 dark:to-violet-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30"
          >
            <Check size={40} weight="bold" className="text-violet-600 dark:text-violet-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Password Reset!</h2>
          <p className="mt-2 text-slate-600 dark:text-neutral-400">Redirecting to login...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-violet-50 text-slate-900 transition-colors duration-300 dark:from-neutral-950 dark:via-neutral-900 dark:to-violet-950 dark:text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-200/40 blur-[120px] dark:bg-violet-900/20" />
        <div className="absolute bottom-1/4 right-1/3 h-[300px] w-[300px] rounded-full bg-purple-200/30 blur-[80px] dark:bg-purple-900/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]"
        >
          {/* Left */}
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
              <LockKey size={16} weight="fill" /> Secure password reset
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-2xl space-y-6">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                {step === 1 ? 'Forgot your password?' : 'Enter your reset code.'}
              </h1>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                {step === 1
                  ? 'No worries — enter your email and we\'ll send a 6-digit code to reset your password.'
                  : 'We\'ve sent a 6-digit code to your email. Enter it below along with your new password.'}
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Secure reset</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Your OTP expires in 15 minutes for your account's safety.</p>
              </div>
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Strong password</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Use 8+ characters with uppercase, number, and special character.</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(124,58,237,0.08)] dark:border-neutral-800 dark:bg-neutral-950/95">
              <div className="flex items-center gap-4">
                <div className="rounded-3xl bg-violet-600/10 p-3 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <ShieldCheck size={28} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Your account is protected.</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">OTP-based reset keeps your account secure.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right — form */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-x-6 top-0 h-40 bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />

            <motion.div
              variants={itemVariants}
              className="relative rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_80px_rgba(124,58,237,0.12)] dark:border-neutral-800 dark:bg-neutral-950/95"
            >
              <div className="mb-8">
                <Link
                  to="/login"
                  className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-600 dark:text-neutral-400 dark:hover:text-violet-400"
                >
                  <ArrowLeft size={16} /> Back to login
                </Link>
                <p className="text-sm font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">
                  {step === 1 ? 'Forgot password' : 'Reset password'}
                </p>
                <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">
                  {step === 1 ? 'Reset your password' : 'Create new password'}
                </h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
                  {step === 1
                    ? 'Enter your account email to receive a password reset code.'
                    : <>Code sent to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span></>}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.form
                    key="step1"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    onSubmit={handleEmailSubmit}
                    className="space-y-5"
                  >
                    <FormInput
                      label="Email address"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      onBlur={validateEmail}
                      error={emailError}
                      placeholder="you@example.com"
                      required
                      disabled={isEmailLoading}
                    />

                    <LoadingButton type="submit" isLoading={isEmailLoading} className="w-full">
                      {isEmailLoading ? 'Sending code...' : 'Send reset code'}
                    </LoadingButton>
                  </motion.form>
                ) : (
                  <motion.form
                    key="step2"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    onSubmit={handleResetSubmit}
                    className="space-y-5"
                  >
                    {/* OTP input */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        6-digit reset code
                      </label>
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {code.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            disabled={isResetLoading}
                            className="h-12 w-10 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-900 transition-all duration-200 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-violet-400 dark:focus:bg-neutral-800 sm:h-14 sm:w-12 sm:text-2xl"
                            placeholder="0"
                          />
                        ))}
                      </div>
                      {resetErrors.otp && (
                        <p className="mt-2 text-center text-sm text-red-500">{resetErrors.otp}</p>
                      )}

                      {/* Resend */}
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
                        {resendTimer > 0 ? (
                          <span>Resend in <span className="font-semibold text-slate-700 dark:text-slate-200">{resendTimer}s</span></span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResend}
                            disabled={isResending}
                            className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                          >
                            {isResending ? 'Sending...' : 'Resend code'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <FormInput
                        label="New password"
                        type="password"
                        value={newPassword}
                        onChange={setNewPassword}
                        onBlur={() => {
                          if (!newPassword) setResetErrors((p) => ({ ...p, newPassword: 'Password is required' }))
                          else if (!isStrongPassword(newPassword)) setResetErrors((p) => ({ ...p, newPassword: 'Password must be at least 8 characters with uppercase, number, and special character' }))
                          else setResetErrors((p) => ({ ...p, newPassword: '' }))
                        }}
                        error={resetErrors.newPassword}
                        placeholder="Create a secure password"
                        required
                        disabled={isResetLoading}
                      />
                      <PasswordStrengthIndicator password={newPassword} />
                    </div>

                    <FormInput
                      label="Confirm new password"
                      type="password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      onBlur={() => {
                        if (!confirmPassword) setResetErrors((p) => ({ ...p, confirmPassword: 'Please confirm your password' }))
                        else if (newPassword !== confirmPassword) setResetErrors((p) => ({ ...p, confirmPassword: 'Passwords do not match' }))
                        else setResetErrors((p) => ({ ...p, confirmPassword: '' }))
                      }}
                      error={resetErrors.confirmPassword}
                      placeholder="Repeat your new password"
                      required
                      disabled={isResetLoading}
                    />

                    <LoadingButton type="submit" isLoading={isResetLoading} className="w-full">
                      {isResetLoading ? 'Resetting password...' : 'Reset password'}
                    </LoadingButton>

                    {resetErrors.general && (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                        {resetErrors.general}
                      </p>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-neutral-900/80 dark:text-neutral-300">
                <p className="font-semibold text-slate-900 dark:text-white">Remember your password?</p>
                <p className="mt-2">Go back and sign in to your account.</p>
                <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
                  Sign in <span>→</span>
                </Link>
              </div>
            </motion.div>

            <FloatingCard
              icon={<LockKey size={20} weight="fill" />}
              title="Secure OTP"
              subtitle="15 Min Expiry"
              position="top-right"
              delay={0.9}
            />

            <FloatingCard
              icon={<EnvelopeSimple size={20} weight="fill" />}
              title="Check Inbox"
              subtitle="Check Spam too"
              position="bottom-left"
              delay={1.1}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
