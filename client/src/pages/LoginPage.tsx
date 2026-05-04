import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Sparkle, Star } from '@phosphor-icons/react'
import FormInput from '../components/auth/FormInput'
import LoadingButton from '../components/auth/LoadingButton'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import FloatingCard from '../components/auth/FloatingCard'
import { isValidEmail } from '../utils/validation'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)

  const validateEmail = () => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }))
      return false
    }
    if (!isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      return false
    }
    setErrors(prev => ({ ...prev, email: '' }))
    return true
  }

  const validatePassword = () => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }))
      return false
    }
    setErrors(prev => ({ ...prev, password: '' }))
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const emailValid = validateEmail()
    const passwordValid = validatePassword()

    if (!emailValid || !passwordValid) return

    setIsLoading(true)

    // Mock API call
    setTimeout(() => {
      setIsLoading(false)
      alert(`Logged in as ${email}`)
    }, 1500)
  }

  const handleSocialLogin = (provider: 'google' | 'github') => {
    console.log(`Social login with ${provider}`)
    alert(`Social login with ${provider} - backend integration pending`)
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-violet-50 via-white to-slate-100 text-slate-900 transition-colors duration-300 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-200/40 blur-[120px] dark:bg-violet-900/20" />
        <div className="absolute bottom-1/4 right-1/3 h-[300px] w-[300px] rounded-full bg-purple-200/30 blur-[80px] dark:bg-purple-900/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]"
        >
          {/* Left: Content */}
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
              <Sparkle size={16} weight="fill" /> Fast access to your learning dashboard
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-2xl space-y-6">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Sign in and continue your English journey.
              </h1>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Access enrolled courses, payment history, and course progress from a single clean login experience designed for modern learners.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Secure access</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Two-step friendly login with encrypted credentials and automatic session management.</p>
              </div>
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">One-click support</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Need help? Our support team is available to resolve any login or access issues quickly.</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(124,58,237,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90 dark:shadow-none">
              <div className="flex items-center gap-4 rounded-3xl border border-violet-100/80 bg-violet-50/80 px-5 py-4 dark:border-violet-800/40 dark:bg-violet-900/30">
                <ShieldCheck size={24} className="text-violet-600 dark:text-violet-300" weight="fill" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Your account is protected.</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">Encrypted login and learner-first security across all devices.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Form */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-x-6 top-0 h-40 bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />

            <motion.div
              variants={itemVariants}
              className="relative rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_80px_rgba(124,58,237,0.12)] dark:border-neutral-800 dark:bg-neutral-950/95"
            >
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Login</p>
                <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">Welcome back</h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">Enter your email and password to sign in and pick up where you left off.</p>
              </div>

              <SocialLoginButtons
                onGoogleClick={() => handleSocialLogin('google')}
                onGithubClick={() => handleSocialLogin('github')}
                isLoading={isLoading}
              />

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <FormInput
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onBlur={validateEmail}
                  error={errors.email}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                />

                <FormInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  onBlur={validatePassword}
                  error={errors.password}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    Remember me
                  </label>
                  <Link to="/" className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">
                    Forgot password?
                  </Link>
                </div>

                <LoadingButton type="submit" isLoading={isLoading} className="w-full">
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </LoadingButton>
              </form>

              <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-neutral-900/80 dark:text-neutral-300">
                <p className="font-semibold text-slate-900 dark:text-white">New here?</p>
                <p className="mt-2">Create your account and start enrolling in courses today.</p>
                <Link to="/signup" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
                  Create new account <span>→</span>
                </Link>
              </div>
            </motion.div>

            {/* Floating cards */}
            <FloatingCard
              icon={<ShieldCheck size={20} weight="fill" />}
              title="Secure Login"
              subtitle="Encrypted"
              position="top-right"
              delay={0.9}
            />

            <FloatingCard
              icon={<Star size={20} weight="fill" />}
              title="4.9/5 Rating"
              subtitle="10K+ Students"
              position="bottom-left"
              delay={1.1}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
