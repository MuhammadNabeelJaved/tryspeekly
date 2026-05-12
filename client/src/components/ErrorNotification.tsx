import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, WarningCircle, Info, CheckCircle, XCircle, ExclamationMark } from '@phosphor-icons/react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { ...toast, id }
    setToasts(prev => [...prev, newToast])

    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: <CheckCircle size={20} weight="fill" className="text-emerald-500" />,
    error: <XCircle size={20} weight="fill" className="text-red-500" />,
    warning: <ExclamationMark size={20} weight="fill" className="text-amber-500" />,
    info: <Info size={20} weight="fill" className="text-blue-500" />,
  }

  const colors = {
    success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50',
    error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50',
    warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${colors[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

export function toast(type: ToastType, title: string, message?: string, duration?: number) {
  const event = new CustomEvent('toast', { detail: { type, title, message, duration } })
  window.dispatchEvent(event)
}

toast.success = (title: string, message?: string) => toast('success', title, message)
toast.error = (title: string, message?: string) => toast('error', title, message)
toast.warning = (title: string, message?: string) => toast('warning', title, message)
toast.info = (title: string, message?: string) => toast('info', title, message)