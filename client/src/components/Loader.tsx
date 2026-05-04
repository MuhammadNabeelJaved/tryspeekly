import { motion } from 'framer-motion'

interface LoaderProps {
  fullScreen?: boolean
  text?: string
}

export default function Loader({ fullScreen = false, text }: LoaderProps) {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-[9999] bg-white dark:bg-neutral-950 flex flex-col items-center justify-center transition-colors duration-300"
    : "w-full h-full min-h-[200px] flex flex-col items-center justify-center"

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-violet-100 dark:border-neutral-800"
        />
        {/* Spinning gradient ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="absolute w-12 h-12 rounded-full border-2 border-transparent border-t-violet-600 border-r-violet-600"
        />
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-sm font-medium text-slate-500 dark:text-neutral-400"
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}
