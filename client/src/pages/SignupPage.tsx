import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Sparkle, UserCircle, ArrowRight } from '@phosphor-icons/react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    alert(`Account created for ${name}`)
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-violet-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-violet-950 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
              <Sparkle size={16} weight="fill" /> Start with a learner-first account
            </div>
            <div className="max-w-2xl space-y-6">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">Create your EnglishPro account.</h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-8">Sign up in seconds and unlock real-time lessons, progress tracking, and a smarter study experience.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-violet-100 bg-white shadow-sm p-6 dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="text-xs uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400 font-bold mb-4">Fast setup</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-6">Create an account quickly and begin exploring courses immediately.</p>
              </div>
              <div className="rounded-3xl border border-violet-100 bg-white shadow-sm p-6 dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="text-xs uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400 font-bold mb-4">Smart progress</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-6">Your dashboard remembers your course progress so you can jump back in without losing momentum.</p>
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(124,58,237,0.08)] dark:border-neutral-800 dark:bg-neutral-950/95">
              <div className="flex items-center gap-4">
                <div className="rounded-3xl bg-violet-600/10 p-3 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <UserCircle size={28} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Your learning space</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">Save your preferences and revisit courses anytime.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-x-6 top-0 h-40 blur-3xl bg-violet-400/20 dark:bg-violet-500/10 pointer-events-none" />
            <div className="relative rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_80px_rgba(124,58,237,0.12)] dark:border-neutral-800 dark:bg-neutral-950/95">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400 font-bold">Create account</p>
                <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">Join EnglishPro</h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">Register once and get instant access to live classes, learning tools, and expert support.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Full name
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    placeholder="Enter your name"
                    className="mt-3 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                  />
                </label>
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
                    placeholder="Create a secure password"
                    className="mt-3 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Confirm password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    placeholder="Repeat your password"
                    className="mt-3 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(124,58,237,0.25)] transition hover:shadow-[0_16px_40px_rgba(124,58,237,0.28)]"
                >
                  Create account
                </button>
              </form>

              <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-neutral-900/80 dark:text-neutral-300">
                <p className="font-semibold text-slate-900 dark:text-white">Already a member?</p>
                <p className="mt-2">Log in and continue from where you left off.</p>
                <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
                  Log in <ArrowRight size={16} weight="bold" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
