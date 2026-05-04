import { motion, AnimatePresence } from 'framer-motion'

interface LoadingButtonProps {
  children: React.ReactNode
  onClick: () => void
  isLoading: boolean
  variant?: 'primary' | 'secondary'
  className?: string
  disabled?: boolean
}

export default function LoadingButton({
  children,
  onClick,
  isLoading,
  variant = 'primary',
  className = '',
  disabled = false,
}: LoadingButtonProps) {
  const isPrimary = variant === 'primary'

  const baseClasses =
    'relative w-full rounded-2xl font-semibold py-3 px-4 transition-all duration-200 text-sm uppercase tracking-wide'

  const variantClasses = isPrimary
    ? 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95 disabled:opacity-50'
    : 'border-2 border-slate-300 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/20 dark:border-slate-700 active:scale-95 disabled:opacity-50'

  const spinnerVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
  }

  const spinnerTransition = { duration: 0.3 }

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="spinner"
            variants={spinnerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spinnerTransition}
            className="absolute left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              data-testid="loading-spinner"
              className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.span
        animate={isLoading ? { opacity: 0 } : { opacity: 1 }}
        transition={spinnerTransition}
      >
        {children}
      </motion.span>
    </button>
  )
}
