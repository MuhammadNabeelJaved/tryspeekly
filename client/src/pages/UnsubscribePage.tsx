import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Warning } from '@phosphor-icons/react'
import { newsletterService } from '@/services/newsletter.service'

type State = 'loading' | 'success' | 'error' | 'no-token'

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<State>(token ? 'loading' : 'no-token')

  useEffect(() => {
    if (!token) return
    newsletterService
      .unsubscribeByToken(token)
      .then(() => setState('success'))
      .catch(() => setState('error'))
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-white/10 p-10 text-center shadow-sm">
        {state === 'loading' && (
          <p className="text-slate-500 dark:text-neutral-400 text-sm">Processing your request...</p>
        )}

        {state === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You've been unsubscribed</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">
              You will no longer receive newsletter emails from TrySpeekly.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Back to Home
            </Link>
          </>
        )}

        {(state === 'error' || state === 'no-token') && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
              <Warning size={28} weight="fill" className="text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invalid unsubscribe link</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">
              This link may be expired or has already been used.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
