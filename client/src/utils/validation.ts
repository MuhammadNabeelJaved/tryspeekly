/**
 * Password strength criteria
 */
export interface PasswordCriteria {
  minLength: boolean
  hasUppercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  strength: 'weak' | 'medium' | 'strong'
  criteria: PasswordCriteria
}

/**
 * Validates email format using RFC-compliant regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Returns password strength criteria evaluation
 */
export function getPasswordStrength(
  password: string
): PasswordStrengthResult {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const metCount = Object.values(criteria).filter(Boolean).length
  const strength =
    metCount <= 2 ? 'weak' : metCount === 3 ? 'medium' : 'strong'

  return { strength, criteria }
}

/**
 * Checks if password meets strength requirements
 * Requires all 4 criteria: minLength, hasUppercase, hasNumber, hasSpecial
 */
export function isStrongPassword(password: string): boolean {
  const { criteria } = getPasswordStrength(password)
  return Object.values(criteria).every(Boolean)
}
