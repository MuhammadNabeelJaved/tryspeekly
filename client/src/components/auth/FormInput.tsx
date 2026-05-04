import { motion, AnimatePresence } from 'framer-motion'
import { Check, Warning } from '@phosphor-icons/react'

interface FormInputProps {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  icon?: React.ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
  onBlur?: () => void
}

export default function FormInput({
  label,
  type,
  value,
  onChange,
  error,
  placeholder,
  icon,
  required = false,
  disabled = false,
  className = '',
  onBlur,
}: FormInputProps) {
  const hasError = Boolean(error)
  const hasValue = Boolean(value)
  const isValid = hasValue && !hasError

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
        <div className="relative mt-3">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500">
              {icon}
            </div>
          )}

          <motion.input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className={`
              block w-full rounded-2xl border px-4 py-3 text-sm outline-none transition
              ${icon ? 'pl-12' : ''}
              ${hasError
                ? 'border-red-500 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500/20 dark:border-red-500 dark:bg-red-950/20 dark:text-red-100'
                : isValid
                  ? 'border-green-500 bg-green-50 text-slate-900 focus:ring-2 focus:ring-green-500/20 dark:border-green-500 dark:bg-green-950/20 dark:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
          />

          {isValid && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Check
                size={18}
                weight="bold"
                className="text-green-600 dark:text-green-400"
              />
            </motion.div>
          )}
        </div>
      </label>

      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
          >
            <Warning size={16} weight="fill" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
