import { motion } from 'framer-motion'
import { Check, X } from '@phosphor-icons/react'
import { getPasswordStrength } from '../../utils/validation'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export default function PasswordStrengthIndicator({
  password,
  className = '',
}: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const { strength, criteria } = getPasswordStrength(password)

  const strengthConfig = {
    weak: { color: 'bg-red-500', width: '25%', label: 'Weak' },
    medium: { color: 'bg-yellow-500', width: '60%', label: 'Medium' },
    strong: { color: 'bg-green-500', width: '100%', label: 'Strong' },
  }

  const config = strengthConfig[strength]

  const criteriaList = [
    { label: 'At least 8 characters', met: criteria.minLength },
    { label: 'One uppercase letter', met: criteria.hasUppercase },
    { label: 'One number', met: criteria.hasNumber },
    { label: 'One special character', met: criteria.hasSpecial },
  ]

  return (
    <div className={`mt-4 space-y-3 ${className}`}>
      {/* Progress bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-neutral-500">
            Password strength
          </span>
          <span className={`text-xs font-bold ${
            strength === 'weak' ? 'text-red-600 dark:text-red-400' :
            strength === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {config.label}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={config.width}
          aria-valuemin="0"
          aria-valuemax="100"
          className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: config.width }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`h-full rounded-full ${config.color}`}
          />
        </div>
      </div>

      {/* Criteria checklist */}
      <div className="space-y-2">
        {criteriaList.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {item.met ? (
              <Check
                size={14}
                weight="bold"
                data-testid="check-icon"
                className="flex-shrink-0 text-green-600 dark:text-green-400"
              />
            ) : (
              <X
                size={14}
                weight="bold"
                className="flex-shrink-0 text-slate-300 dark:text-neutral-700"
              />
            )}
            <span className={`text-xs ${
              item.met
                ? 'text-slate-700 dark:text-neutral-300'
                : 'text-slate-400 dark:text-neutral-600'
            }`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
