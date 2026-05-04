import { motion } from 'framer-motion'
import { GoogleLogo, GithubLogo } from '@phosphor-icons/react'

interface SocialLoginButtonsProps {
  onGoogleClick: () => void
  onGithubClick: () => void
  isLoading?: boolean
}

export default function SocialLoginButtons({
  onGoogleClick,
  onGithubClick,
  isLoading = false,
}: SocialLoginButtonsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          onClick={onGoogleClick}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-700"
        >
          <GoogleLogo size={20} weight="bold" />
          <span className="hidden sm:inline">Continue with Google</span>
          <span className="sm:hidden">Google</span>
        </motion.button>

        <motion.button
          type="button"
          onClick={onGithubClick}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-700"
        >
          <GithubLogo size={20} weight="bold" />
          <span className="hidden sm:inline">Continue with GitHub</span>
          <span className="sm:hidden">GitHub</span>
        </motion.button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-neutral-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-4 text-slate-500 dark:bg-neutral-950 dark:text-neutral-400">
            or continue with email
          </span>
        </div>
      </div>
    </div>
  )
}
