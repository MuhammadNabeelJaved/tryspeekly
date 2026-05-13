import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkle, UserCircle, GraduationCap } from '@phosphor-icons/react'
import FormInput from '../components/auth/FormInput'
import PhoneInput from '../components/auth/PhoneInput'
import LoadingButton from '../components/auth/LoadingButton'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import FloatingCard from '../components/auth/FloatingCard'
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator'
import { isValidEmail, isStrongPassword } from '../utils/validation'
import { useAuth } from '../context/AuthContext'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({ name: '', email: '', phone: '', password: '', general: '' })
  const [isLoading, setIsLoading] = useState(false)

  const validateName = () => {
    if (!name || name.length < 2) {
      setErrors(prev => ({ ...prev, name: 'Please enter your full name' }))
      return false
    }
    setErrors(prev => ({ ...prev, name: '' }))
    return true
  }

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

  const validatePhone = () => {
    if (!phone) {
      setErrors(prev => ({ ...prev, phone: 'Phone number is required' }))
      return false
    }
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) {
      setErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }))
      return false
    }
    setErrors(prev => ({ ...prev, phone: '' }))
    return true
  }

  const validatePassword = () => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }))
      return false
    }
    if (!isStrongPassword(password)) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters with uppercase, number, and special character' }))
      return false
    }
    setErrors(prev => ({ ...prev, password: '' }))
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nameValid = validateName()
    const emailValid = validateEmail()
    const phoneValid = validatePhone()
    const passwordValid = validatePassword()

    if (!nameValid || !emailValid || !phoneValid || !passwordValid) return

    setIsLoading(true)
    setErrors({ name: '', email: '', phone: '', password: '', general: '' })

    try {
      await registerUser({
        name,
        email,
        phone,
        password,
        role: 'student',
      })
      navigate('/verify-email', { state: { email }, replace: true })
    } catch (error: any) {
      const data = error?.response?.data
      const message = data?.error || error?.message || 'Registration failed. Please try again.'

      // Handle field-level validation errors from backend
      if (data?.fields) {
        const fieldErrors: Record<string, string> = { general: '' }
        data.fields.forEach((f: { field: string; message: string }) => {
          fieldErrors[f.field] = f.message
        })
        setErrors(prev => ({ ...prev, ...fieldErrors }))
      } else {
        setErrors(prev => ({ ...prev, general: message }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: 'google' | 'github') => {
    console.log(`Social login with ${provider}`)
    alert(`Social login with ${provider} - backend integration pending`)
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-violet-50 text-slate-900 transition-colors duration-300 dark:from-neutral-950 dark:via-neutral-900 dark:to-violet-950 dark:text-white">
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
          className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]"
        >
          {/* Left: Content */}
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
              <Sparkle size={16} weight="fill" /> Start with a learner-first account
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-2xl space-y-6">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Create your EnglishPro account.
              </h1>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Sign up in seconds and unlock real-time lessons, progress tracking, and a smarter study experience.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Fast setup</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Create an account quickly and begin exploring courses immediately.</p>
              </div>
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Smart progress</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Your dashboard remembers your course progress so you can jump back in without losing momentum.</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(124,58,237,0.08)] dark:border-neutral-800 dark:bg-neutral-950/95">
              <div className="flex items-center gap-4">
                <div className="rounded-3xl bg-violet-600/10 p-3 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <UserCircle size={28} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Your learning space</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">Save your preferences and revisit courses anytime.</p>
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
                <p className="text-sm font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Create account</p>
                <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">Join EnglishPro</h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">Register once and get instant access to live classes, learning tools, and expert support.</p>
              </div>

              <SocialLoginButtons
                onGoogleClick={() => handleSocialLogin('google')}
                onGithubClick={() => handleSocialLogin('github')}
                isLoading={isLoading}
              />

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <FormInput
                  label="Full name"
                  type="text"
                  value={name}
                  onChange={setName}
                  onBlur={validateName}
                  error={errors.name}
                  placeholder="Enter your name"
                  required
                  disabled={isLoading}
                />

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

                <PhoneInput
                  value={phone}
                  onChange={(val) => {
                    setPhone(val)
                    if (val) {
                      setErrors(prev => ({ ...prev, phone: '' }))
                    }
                  }}
                  error={errors.phone}
                  label="Phone number"
                  placeholder="300 1234567"
                />

                <div>
                  <FormInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    onBlur={validatePassword}
                    error={errors.password}
                    placeholder="Create a secure password"
                    required
                    disabled={isLoading}
                  />
                  <PasswordStrengthIndicator password={password} />
                </div>

                <LoadingButton type="submit" isLoading={isLoading} className="w-full">
                  {isLoading ? 'Creating account...' : 'Create account'}
                </LoadingButton>

                {errors.general && (
                  <p className="text-red-500 text-sm font-medium text-center bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">{errors.general}</p>
                )}
              </form>

              <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-neutral-900/80 dark:text-neutral-300">
                <p className="font-semibold text-slate-900 dark:text-white">Already a member?</p>
                <p className="mt-2">Log in and continue from where you left off.</p>
                <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
                  Log in <span>→</span>
                </Link>
              </div>
            </motion.div>

            {/* Floating cards */}
            <FloatingCard
              icon={<Sparkle size={20} weight="fill" />}
              title="Quick Setup"
              subtitle="2 Minutes"
              position="top-right"
              delay={0.9}
            />

            <FloatingCard
              icon={<GraduationCap size={20} weight="fill" />}
              title="50K+ Learners"
              subtitle="Join Today"
              position="bottom-left"
              delay={1.1}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
