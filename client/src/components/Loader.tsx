import { motion } from 'framer-motion'

interface LoaderProps {
  fullScreen?: boolean
  page?: boolean
  text?: string
}

export default function Loader({ fullScreen = false, page = false, text }: LoaderProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex flex-col items-center justify-center transition-colors duration-300'
    : page
    ? 'flex flex-1 flex-col items-center justify-center py-24'
    : 'flex w-full flex-col items-center justify-center py-16'

  return (
    <div className={containerClasses}>
      {/* Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-violet-100 dark:border-neutral-800" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          className="absolute h-12 w-12 rounded-full border-2 border-transparent border-r-violet-600 border-t-violet-600"
        />
      </div>

      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-4 text-sm font-medium text-slate-500 dark:text-neutral-400"
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}
