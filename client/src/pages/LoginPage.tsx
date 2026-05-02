import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Sparkle, ArrowRight } from '@phosphor-icons/react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    alert(`Logged in as ${email}`)
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-violet-50 via-white to-slate-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
              <Sparkle size={16} weight="fill" /> Fast access to your learning dashboard
            </div>
            <div className="max-w-2xl space-y-6">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">Sign in and continue your English journey.</h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-8">Access enrolled courses, payment history, and course progress from a single clean login experience designed for modern learners.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-violet-100 bg-white shadow-sm p-6 dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="text-xs uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400 font-bold mb-4">Secure access</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-6">Two-step friendly login with encrypted credentials and automatic session management.</p>
              </div>
              <div className="rounded-3xl border border-violet-100 bg-white shadow-sm p-6 dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="text-xs uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400 font-bold mb-4">One-click support</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-6">Need help? Our support team is available to resolve any login or access issues quickly.</p>
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(124,58,237,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90 dark:shadow-none">
              <div className="flex items-center gap-4 border border-violet-100/80 bg-violet-50/80 px-5 py-4 rounded-3xl dark:border-violet-800/40 dark:bg-violet-900/30">
                <ShieldCheck size={24} className="text-violet-600 dark:text-violet-300" weight="fill" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Your account is protected.</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">Encrypted login and learner-first security across all devices.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-x-6 top-0 h-40 blur-3xl bg-violet-400/20 dark:bg-violet-500/10 pointer-events-none" />
            <div className="relative rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_80px_rgba(124,58,237,0.12)] dark:border-neutral-800 dark:bg-neutral-950/95">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400 font-bold">Login</p>
                <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">Welcome back</h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">Enter your email and password to sign in and pick up where you left off.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="you@example.com"
                    className="mt-3 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="••••••••"
                    className="mt-3 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                  />
                </label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    Remember me
                  </label>
                  <Link to="/" className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">Forgot password?</Link>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(124,58,237,0.25)] transition hover:shadow-[0_16px_40px_rgba(124,58,237,0.28)]"
                >
                  Sign in
                </button>
              </form>

              <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-neutral-900/80 dark:text-neutral-300">
                <p className="font-semibold text-slate-900 dark:text-white">New here?</p>
                <p className="mt-2">Create your account and start enrolling in courses today.</p>
                <Link to="/signup" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
                  Create new account <ArrowRight size={16} weight="bold" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
