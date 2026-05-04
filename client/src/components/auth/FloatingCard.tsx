import { motion } from 'framer-motion'

interface FloatingCardProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  delay?: number
}

export default function FloatingCard({
  icon,
  title,
  subtitle,
  position,
  delay = 0.9,
}: FloatingCardProps) {
  const positionClasses = {
    'top-left': 'top-[6%] left-[4%] sm:left-[8%]',
    'top-right': 'top-[6%] right-[4%] sm:right-[8%]',
    'bottom-left': 'bottom-[6%] left-[4%] sm:left-[8%]',
    'bottom-right': 'bottom-[6%] right-[4%] sm:right-[8%]',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'backOut' }}
      className={`absolute z-20 hidden sm:block ${positionClasses[position]}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-xl shadow-slate-200/60 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
            {icon}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
            {subtitle && (
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
