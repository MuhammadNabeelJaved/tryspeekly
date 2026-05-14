import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import FormInput from '../components/auth/FormInput'
import LoadingButton from '../components/auth/LoadingButton'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import { isValidEmail } from '../utils/validation'
import { extractApiError } from '../utils/apiError'
import toast from 'react-hot-toast'

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '', general: '' })
  const [isLoading, setIsLoading] = useState(false)

  const validateEmail = () => {
    if (!email) { setErrors(p => ({ ...p, email: 'Email is required' })); return false }
    if (!isValidEmail(email)) { setErrors(p => ({ ...p, email: 'Please enter a valid email address' })); return false }
    setErrors(p => ({ ...p, email: '' }))
    return true
  }

  const validatePassword = () => {
    if (!password) { setErrors(p => ({ ...p, password: 'Password is required' })); return false }
    setErrors(p => ({ ...p, password: '' }))
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateEmail() || !validatePassword()) return

    setIsLoading(true)
    setErrors({ email: '', password: '', general: '' })

    try {
      const result = await login({ email, password }, remember)
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname
      if (from && from !== '/login' && from !== '/signup') {
        navigate(from, { replace: true })
      } else {
        const map: Record<string, string> = { student: '/dashboard', teacher: '/instructor', admin: '/admin' }
        navigate(map[result.user.role] || '/', { replace: true })
      }
    } catch (error: unknown) {
      setErrors(p => ({ ...p, general: extractApiError(error, 'Login failed. Please try again.') }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (_provider: 'google' | 'github') => {
    toast('Social login coming soon — use email & password for now.', { icon: 'ℹ️' })
  }

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-br from-violet-50 via-white to-slate-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center px-4 py-10">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-200/50 blur-[140px] dark:bg-violet-900/25" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-200/40 blur-[100px] dark:bg-purple-900/20" />
      </div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-[0_24px_60px_rgba(124,58,237,0.10)] dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className="mb-7">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-neutral-400">
              Sign in to continue your English learning journey.
            </p>
          </div>

          <SocialLoginButtons
            onGoogleClick={() => handleSocialLogin('google')}
            onGithubClick={() => handleSocialLogin('github')}
            isLoading={isLoading}
          />

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-slate-600 dark:text-neutral-400">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Forgot password?
              </Link>
            </div>

            <LoadingButton type="submit" isLoading={isLoading} className="w-full">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </LoadingButton>

            {errors.general && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {errors.general}
              </p>
            )}
          </form>

          <p className="mt-7 text-center text-sm text-slate-500 dark:text-neutral-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
