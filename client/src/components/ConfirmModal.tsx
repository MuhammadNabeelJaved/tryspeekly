import { AnimatePresence, motion } from 'framer-motion'
import { Trash, Warning, PaperPlaneTilt, UserMinus } from '@phosphor-icons/react'

type Variant = 'danger' | 'warning' | 'send' | 'unsubscribe'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  onConfirm: () => void
  onCancel: () => void
}

const VARIANT_CONFIG: Record<Variant, { bg: string; iconBg: string; icon: React.ReactNode; btnClass: string }> = {
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    iconBg: 'text-red-500',
    icon: <Trash size={28} />,
    btnClass: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    iconBg: 'text-amber-500',
    icon: <Warning size={28} />,
    btnClass: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
  },
  send: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    iconBg: 'text-violet-500',
    icon: <PaperPlaneTilt size={28} />,
    btnClass: 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20',
  },
  unsubscribe: {
    bg: 'bg-slate-50 dark:bg-neutral-800',
    iconBg: 'text-slate-500',
    icon: <UserMinus size={28} />,
    btnClass: 'bg-slate-700 hover:bg-slate-800 dark:bg-neutral-600 dark:hover:bg-neutral-500 shadow-slate-700/20',
  },
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const cfg = VARIANT_CONFIG[variant]

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white dark:bg-neutral-900 rounded-[32px] p-8 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center"
          >
            <div className={`w-16 h-16 rounded-3xl ${cfg.bg} flex items-center justify-center mx-auto mb-6 ${cfg.iconBg}`}>
              {cfg.icon}
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-neutral-500 mb-8 leading-relaxed">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-neutral-800 text-sm font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 rounded-2xl text-white text-sm font-bold transition-all shadow-lg ${cfg.btnClass}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
