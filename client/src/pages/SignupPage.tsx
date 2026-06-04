import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import FormInput from '../components/auth/FormInput'
import PhoneInput from '../components/auth/PhoneInput'
import LoadingButton from '../components/auth/LoadingButton'
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator'
import { isValidEmail, isStrongPassword } from '../utils/validation'
import { useAuth } from '../context/AuthContext'
import { extractApiError } from '../utils/apiError'

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState({ name: '', email: '', phone: '', password: '', terms: '', general: '' })
  const [isLoading, setIsLoading] = useState(false)

  const validateName = () => {
    if (!name || name.length < 2) { setErrors(p => ({ ...p, name: 'Please enter your full name' })); return false }
    setErrors(p => ({ ...p, name: '' }))
    return true
  }

  const validateEmail = () => {
    if (!email) { setErrors(p => ({ ...p, email: 'Email is required' })); return false }
    if (!isValidEmail(email)) { setErrors(p => ({ ...p, email: 'Please enter a valid email address' })); return false }
    setErrors(p => ({ ...p, email: '' }))
    return true
  }

  const validatePhone = () => {
    if (!phone) { setErrors(p => ({ ...p, phone: 'Phone number is required' })); return false }
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) { setErrors(p => ({ ...p, phone: 'Please enter a valid phone number' })); return false }
    setErrors(p => ({ ...p, phone: '' }))
    return true
  }

  const validatePassword = () => {
    if (!password) { setErrors(p => ({ ...p, password: 'Password is required' })); return false }
    if (!isStrongPassword(password)) {
      setErrors(p => ({ ...p, password: 'Password must be at least 8 characters with uppercase, number, and special character' }))
      return false
    }
    setErrors(p => ({ ...p, password: '' }))
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nameValid = validateName()
    const emailValid = validateEmail()
    const phoneValid = validatePhone()
    const passwordValid = validatePassword()

    if (!agreedToTerms) {
      setErrors(p => ({ ...p, terms: 'You must agree to the Terms & Services to continue' }))
      return
    }

    if (!nameValid || !emailValid || !phoneValid || !passwordValid) return

    setIsLoading(true)
    setErrors({ name: '', email: '', phone: '', password: '', terms: '', general: '' })

    try {
      await registerUser({ name, email, phone, password, role: 'student' })
      navigate('/verify-email', { state: { email }, replace: true })
    } catch (error: unknown) {
      const e = error as { response?: { data?: { fields?: { field: string; message: string }[] } } }
      const data = e?.response?.data
      if (data?.fields?.length) {
        const fieldErrors: Record<string, string> = { general: '' }
        data.fields.forEach((f) => { fieldErrors[f.field] = f.message })
        setErrors(p => ({ ...p, ...fieldErrors }))
      } else {
        const message = extractApiError(error, 'Registration failed. Please try again.')
        setErrors(p => ({ ...p, general: message }))
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-violet-950 flex items-center justify-center px-4 py-8">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-200/50 blur-[140px] dark:bg-violet-900/25" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-200/40 blur-[100px] dark:bg-purple-900/20" />
      </div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-lg"
      >
        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-[0_24px_60px_rgba(124,58,237,0.10)] dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className="mb-5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
              Join Speekly and unlock live classes, progress tracking, and expert support.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Full name"
                type="text"
                value={name}
                onChange={setName}
                onBlur={validateName}
                error={errors.name}
                placeholder="Your full name"
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
            </div>

            <PhoneInput
              value={phone}
              onChange={(val) => {
                setPhone(val)
                if (val) setErrors(p => ({ ...p, phone: '' }))
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

            {/* Terms */}
            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked)
                    if (e.target.checked) setErrors(p => ({ ...p, terms: '' }))
                  }}
                  disabled={isLoading}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-slate-600 dark:text-neutral-400">
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="font-semibold text-violet-600 underline underline-offset-2 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="font-semibold text-violet-600 underline underline-offset-2 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.terms}</p>
              )}
            </div>

            <LoadingButton type="submit" isLoading={isLoading} className="w-full">
              {isLoading ? 'Creating account...' : 'Create account'}
            </LoadingButton>

            {errors.general && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {errors.general}
              </p>
            )}
          </form>

          <p className="mt-5 text-center text-sm text-slate-500 dark:text-neutral-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
