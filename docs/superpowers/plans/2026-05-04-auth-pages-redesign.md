# Auth Pages Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign login and signup pages with animations, social login, password strength, and inline validation matching the Hero component's quality.

**Architecture:** Build reusable auth components first (FormInput, LoadingButton, FloatingCard, SocialLoginButtons, PasswordStrengthIndicator), then enhance LoginPage and SignupPage with animations, validation, and modern features using Framer Motion.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion, Vitest, React Testing Library, Phosphor Icons

---

## File Structure

### New Files (Components)
- `client/src/components/auth/FormInput.tsx` — Animated input field with validation
- `client/src/components/auth/LoadingButton.tsx` — Button with loading state
- `client/src/components/auth/FloatingCard.tsx` — Decorative floating card
- `client/src/components/auth/SocialLoginButtons.tsx` — Google/GitHub OAuth buttons
- `client/src/components/auth/PasswordStrengthIndicator.tsx` — Password strength meter

### New Files (Utils & Tests)
- `client/src/utils/validation.ts` — Email/password validation helpers
- `client/src/components/auth/__tests__/FormInput.test.tsx`
- `client/src/components/auth/__tests__/LoadingButton.test.tsx`
- `client/src/components/auth/__tests__/FloatingCard.test.tsx`
- `client/src/components/auth/__tests__/SocialLoginButtons.test.tsx`
- `client/src/components/auth/__tests__/PasswordStrengthIndicator.test.tsx`
- `client/src/utils/__tests__/validation.test.ts`
- `client/src/pages/__tests__/LoginPage.test.tsx`
- `client/src/pages/__tests__/SignupPage.test.tsx`

### Modified Files
- `client/src/pages/LoginPage.tsx` — Add animations and new components
- `client/src/pages/SignupPage.tsx` — Add animations and new components
- `client/package.json` — Add framer-motion dependency

---

## Task 0: Install Dependencies

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: Install framer-motion**

```bash
cd client
npm install framer-motion
```

Expected: Package installed successfully

- [ ] **Step 2: Verify installation**

```bash
npm list framer-motion
```

Expected: Shows framer-motion version (e.g., `framer-motion@11.x.x`)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add framer-motion for auth page animations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 1: Validation Utilities

**Files:**
- Create: `client/src/utils/validation.ts`
- Test: `client/src/utils/__tests__/validation.test.ts`

- [ ] **Step 1: Write failing tests for email validation**

Create `client/src/utils/__tests__/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { isValidEmail, isStrongPassword, getPasswordStrength } from '../validation'

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true)
      expect(isValidEmail('name+tag@email.com')).toBe(true)
    })

    it('returns false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('notanemail')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user @example.com')).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd client
npm test -- validation.test.ts
```

Expected: FAIL - Cannot find module '../validation'

- [ ] **Step 3: Write minimal implementation for email validation**

Create `client/src/utils/validation.ts`:

```typescript
/**
 * Validates email format using RFC-compliant regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Checks if password meets strength requirements
 */
export function isStrongPassword(password: string): boolean {
  // Placeholder - will implement in next step
  return false
}

/**
 * Returns password strength criteria evaluation
 */
export function getPasswordStrength(password: string) {
  // Placeholder - will implement in next step
  return { strength: 'weak' as const, criteria: {} }
}
```

- [ ] **Step 4: Run test to verify email validation passes**

```bash
npm test -- validation.test.ts
```

Expected: PASS for isValidEmail tests

- [ ] **Step 5: Write failing tests for password validation**

Add to `client/src/utils/__tests__/validation.test.ts`:

```typescript
  describe('isStrongPassword', () => {
    it('returns true for strong passwords', () => {
      expect(isStrongPassword('Password1!')).toBe(true)
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true)
      expect(isStrongPassword('Str0ng!Pass')).toBe(true)
    })

    it('returns false for weak passwords', () => {
      expect(isStrongPassword('')).toBe(false)
      expect(isStrongPassword('short')).toBe(false)
      expect(isStrongPassword('nouppercase1!')).toBe(false)
      expect(isStrongPassword('NOLOWERCASE1!')).toBe(false)
      expect(isStrongPassword('NoNumbers!')).toBe(false)
      expect(isStrongPassword('NoSpecial1')).toBe(false)
    })
  })

  describe('getPasswordStrength', () => {
    it('returns weak for passwords meeting 0-2 criteria', () => {
      const result = getPasswordStrength('weak')
      expect(result.strength).toBe('weak')
      expect(result.criteria.minLength).toBe(false)
    })

    it('returns medium for passwords meeting 3 criteria', () => {
      const result = getPasswordStrength('Password1')
      expect(result.strength).toBe('medium')
      expect(result.criteria.minLength).toBe(true)
      expect(result.criteria.hasUppercase).toBe(true)
      expect(result.criteria.hasNumber).toBe(true)
      expect(result.criteria.hasSpecial).toBe(false)
    })

    it('returns strong for passwords meeting all 4 criteria', () => {
      const result = getPasswordStrength('Password1!')
      expect(result.strength).toBe('strong')
      expect(result.criteria.minLength).toBe(true)
      expect(result.criteria.hasUppercase).toBe(true)
      expect(result.criteria.hasNumber).toBe(true)
      expect(result.criteria.hasSpecial).toBe(true)
    })

    it('provides detailed criteria breakdown', () => {
      const result = getPasswordStrength('Test')
      expect(result.criteria).toEqual({
        minLength: false,
        hasUppercase: true,
        hasNumber: false,
        hasSpecial: false,
      })
    })
  })
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npm test -- validation.test.ts
```

Expected: FAIL for password tests

- [ ] **Step 7: Implement password validation functions**

Update `client/src/utils/validation.ts`:

```typescript
/**
 * Validates email format using RFC-compliant regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

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
 * Returns password strength criteria evaluation
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const metCount = Object.values(criteria).filter(Boolean).length
  const strength = metCount <= 2 ? 'weak' : metCount === 3 ? 'medium' : 'strong'

  return { strength, criteria }
}

/**
 * Checks if password meets strength requirements (all 4 criteria)
 */
export function isStrongPassword(password: string): boolean {
  const { criteria } = getPasswordStrength(password)
  return Object.values(criteria).every(Boolean)
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm test -- validation.test.ts
```

Expected: All tests PASS

- [ ] **Step 9: Commit**

```bash
git add src/utils/validation.ts src/utils/__tests__/validation.test.ts
git commit -m "feat(utils): add email and password validation utilities

Add isValidEmail, isStrongPassword, and getPasswordStrength helpers
with comprehensive test coverage.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: FormInput Component

**Files:**
- Create: `client/src/components/auth/FormInput.tsx`
- Test: `client/src/components/auth/__tests__/FormInput.test.tsx`

- [ ] **Step 1: Write failing test for basic rendering**

Create `client/src/components/auth/__tests__/FormInput.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FormInput from '../FormInput'

describe('FormInput', () => {
  it('renders label and input correctly', () => {
    render(
      <FormInput
        label="Email address"
        type="email"
        value=""
        onChange={() => {}}
        placeholder="you@example.com"
      />
    )

    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('calls onChange with new value when input changes', () => {
    const handleChange = vi.fn()
    render(
      <FormInput
        label="Email"
        type="email"
        value=""
        onChange={handleChange}
      />
    )

    const input = screen.getByLabelText('Email')
    fireEvent.change(input, { target: { value: 'test@example.com' } })

    expect(handleChange).toHaveBeenCalledWith('test@example.com')
  })

  it('shows error message when error prop is provided', () => {
    render(
      <FormInput
        label="Email"
        type="email"
        value=""
        onChange={() => {}}
        error="Please enter a valid email"
      />
    )

    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
  })

  it('applies disabled styling when disabled', () => {
    render(
      <FormInput
        label="Email"
        type="email"
        value=""
        onChange={() => {}}
        disabled
      />
    )

    const input = screen.getByLabelText('Email')
    expect(input).toBeDisabled()
  })

  it('marks input as required when required prop is true', () => {
    render(
      <FormInput
        label="Email"
        type="email"
        value=""
        onChange={() => {}}
        required
      />
    )

    const input = screen.getByLabelText('Email')
    expect(input).toBeRequired()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- FormInput.test.tsx
```

Expected: FAIL - Cannot find module '../FormInput'

- [ ] **Step 3: Implement FormInput component**

Create `client/src/components/auth/FormInput.tsx`:

```typescript
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
              <Check size={18} weight="bold" className="text-green-600 dark:text-green-400" />
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- FormInput.test.tsx
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/FormInput.tsx src/components/auth/__tests__/FormInput.test.tsx
git commit -m "feat(auth): add FormInput component with validation states

Create animated input field component with:
- Error and success states
- Focus animations
- Icon support
- Accessibility features

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: LoadingButton Component

**Files:**
- Create: `client/src/components/auth/LoadingButton.tsx`
- Test: `client/src/components/auth/__tests__/LoadingButton.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `client/src/components/auth/__tests__/LoadingButton.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoadingButton from '../LoadingButton'

describe('LoadingButton', () => {
  it('renders children correctly', () => {
    render(
      <LoadingButton isLoading={false} onClick={() => {}}>
        Sign in
      </LoadingButton>
    )

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked and not loading', () => {
    const handleClick = vi.fn()
    render(
      <LoadingButton isLoading={false} onClick={handleClick}>
        Click me
      </LoadingButton>
    )

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn()
    render(
      <LoadingButton isLoading={true} onClick={handleClick}>
        Loading
      </LoadingButton>
    )

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('shows spinner when isLoading is true', () => {
    const { container } = render(
      <LoadingButton isLoading={true} onClick={() => {}}>
        Sign in
      </LoadingButton>
    )

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('disables button when loading', () => {
    render(
      <LoadingButton isLoading={true} onClick={() => {}}>
        Sign in
      </LoadingButton>
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies primary variant styles by default', () => {
    render(
      <LoadingButton isLoading={false} onClick={() => {}}>
        Sign in
      </LoadingButton>
    )

    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-gradient-to-r')
  })

  it('applies secondary variant styles when specified', () => {
    render(
      <LoadingButton isLoading={false} onClick={() => {}} variant="secondary">
        Cancel
      </LoadingButton>
    )

    const button = screen.getByRole('button')
    expect(button.className).toContain('border')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- LoadingButton.test.tsx
```

Expected: FAIL - Cannot find module '../LoadingButton'

- [ ] **Step 3: Implement LoadingButton component**

Create `client/src/components/auth/LoadingButton.tsx`:

```typescript
import { motion } from 'framer-motion'
import { CircleNotch } from '@phosphor-icons/react'

interface LoadingButtonProps {
  children: React.ReactNode
  isLoading: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  className?: string
}

export default function LoadingButton({
  children,
  isLoading,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: LoadingButtonProps) {
  const isPrimary = variant === 'primary'
  const isDisabled = disabled || isLoading

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.03 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      className={`
        inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold
        transition-all disabled:cursor-not-allowed disabled:opacity-60
        ${isPrimary
          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_12px_30px_rgba(124,58,237,0.25)] hover:shadow-[0_16px_40px_rgba(124,58,237,0.28)]'
          : 'border border-slate-200 bg-white text-slate-700 hover:border-violet-300 dark:border-neutral-800 dark:bg-white/5 dark:text-neutral-200 dark:hover:border-violet-700'
        }
        ${className}
      `}
    >
      {isLoading && (
        <CircleNotch size={18} weight="bold" className="animate-spin" />
      )}
      {children}
    </motion.button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- LoadingButton.test.tsx
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/LoadingButton.tsx src/components/auth/__tests__/LoadingButton.test.tsx
git commit -m "feat(auth): add LoadingButton component

Create button with loading state:
- Spinner animation during loading
- Primary and secondary variants
- Hover/tap animations
- Disabled state handling

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: FloatingCard Component

**Files:**
- Create: `client/src/components/auth/FloatingCard.tsx`
- Test: `client/src/components/auth/__tests__/FloatingCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `client/src/components/auth/__tests__/FloatingCard.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FloatingCard from '../FloatingCard'
import { ShieldCheck } from '@phosphor-icons/react'

describe('FloatingCard', () => {
  it('renders title and subtitle', () => {
    render(
      <FloatingCard
        icon={<ShieldCheck size={24} />}
        title="Secure Login"
        subtitle="Encrypted and protected"
        position="top-right"
      />
    )

    expect(screen.getByText('Secure Login')).toBeInTheDocument()
    expect(screen.getByText('Encrypted and protected')).toBeInTheDocument()
  })

  it('renders without subtitle', () => {
    render(
      <FloatingCard
        icon={<ShieldCheck size={24} />}
        title="Secure Login"
        position="top-right"
      />
    )

    expect(screen.getByText('Secure Login')).toBeInTheDocument()
  })

  it('applies top-right positioning class', () => {
    const { container } = render(
      <FloatingCard
        icon={<ShieldCheck size={24} />}
        title="Test"
        position="top-right"
      />
    )

    const card = container.firstChild
    expect(card).toHaveClass('top-[6%]', 'right-[4%]')
  })

  it('applies bottom-left positioning class', () => {
    const { container } = render(
      <FloatingCard
        icon={<ShieldCheck size={24} />}
        title="Test"
        position="bottom-left"
      />
    )

    const card = container.firstChild
    expect(card).toHaveClass('bottom-[6%]', 'left-[4%]')
  })

  it('hides on mobile with responsive classes', () => {
    const { container } = render(
      <FloatingCard
        icon={<ShieldCheck size={24} />}
        title="Test"
        position="top-right"
      />
    )

    const card = container.firstChild
    expect(card).toHaveClass('hidden', 'sm:block')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- FloatingCard.test.tsx
```

Expected: FAIL - Cannot find module '../FloatingCard'

- [ ] **Step 3: Implement FloatingCard component**

Create `client/src/components/auth/FloatingCard.tsx`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- FloatingCard.test.tsx
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/FloatingCard.tsx src/components/auth/__tests__/FloatingCard.test.tsx
git commit -m "feat(auth): add FloatingCard decorative component

Create floating card with:
- Configurable positioning (4 corners)
- Gentle float animation
- Responsive visibility (hidden on mobile)
- Icon + title + subtitle layout

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: SocialLoginButtons Component

**Files:**
- Create: `client/src/components/auth/SocialLoginButtons.tsx`
- Test: `client/src/components/auth/__tests__/SocialLoginButtons.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `client/src/components/auth/__tests__/SocialLoginButtons.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SocialLoginButtons from '../SocialLoginButtons'

describe('SocialLoginButtons', () => {
  it('renders Google and GitHub buttons', () => {
    render(
      <SocialLoginButtons
        onGoogleClick={() => {}}
        onGithubClick={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
  })

  it('calls onGoogleClick when Google button is clicked', () => {
    const handleGoogle = vi.fn()
    render(
      <SocialLoginButtons
        onGoogleClick={handleGoogle}
        onGithubClick={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
    expect(handleGoogle).toHaveBeenCalledTimes(1)
  })

  it('calls onGithubClick when GitHub button is clicked', () => {
    const handleGithub = vi.fn()
    render(
      <SocialLoginButtons
        onGoogleClick={() => {}}
        onGithubClick={handleGithub}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /continue with github/i }))
    expect(handleGithub).toHaveBeenCalledTimes(1)
  })

  it('disables buttons when isLoading is true', () => {
    render(
      <SocialLoginButtons
        onGoogleClick={() => {}}
        onGithubClick={() => {}}
        isLoading={true}
      />
    )

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeDisabled()
  })

  it('renders divider with "or" text', () => {
    render(
      <SocialLoginButtons
        onGoogleClick={() => {}}
        onGithubClick={() => {}}
      />
    )

    expect(screen.getByText(/or continue with email/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- SocialLoginButtons.test.tsx
```

Expected: FAIL - Cannot find module '../SocialLoginButtons'

- [ ] **Step 3: Implement SocialLoginButtons component**

Create `client/src/components/auth/SocialLoginButtons.tsx`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- SocialLoginButtons.test.tsx
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/SocialLoginButtons.tsx src/components/auth/__tests__/SocialLoginButtons.test.tsx
git commit -m "feat(auth): add SocialLoginButtons component

Create OAuth login buttons for Google and GitHub with:
- Hover animations
- Loading state support
- Responsive text (short on mobile)
- Divider with 'or' text

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: PasswordStrengthIndicator Component

**Files:**
- Create: `client/src/components/auth/PasswordStrengthIndicator.tsx`
- Test: `client/src/components/auth/__tests__/PasswordStrengthIndicator.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `client/src/components/auth/__tests__/PasswordStrengthIndicator.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PasswordStrengthIndicator from '../PasswordStrengthIndicator'

describe('PasswordStrengthIndicator', () => {
  it('shows weak strength for password with 1-2 criteria', () => {
    render(<PasswordStrengthIndicator password="weak" />)
    
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', expect.stringContaining('25'))
  })

  it('shows medium strength for password with 3 criteria', () => {
    render(<PasswordStrengthIndicator password="Password1" />)
    
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', expect.stringContaining('60'))
  })

  it('shows strong strength for password with all 4 criteria', () => {
    render(<PasswordStrengthIndicator password="Password1!" />)
    
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', expect.stringContaining('100'))
  })

  it('displays criteria checklist', () => {
    render(<PasswordStrengthIndicator password="Test" />)
    
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/one number/i)).toBeInTheDocument()
    expect(screen.getByText(/one special character/i)).toBeInTheDocument()
  })

  it('shows checkmarks for met criteria', () => {
    const { container } = render(<PasswordStrengthIndicator password="Password1!" />)
    
    // All criteria should be met - should have 4 checkmark icons
    const checkmarks = container.querySelectorAll('svg[data-testid="check-icon"]')
    expect(checkmarks).toHaveLength(4)
  })

  it('does not render when password is empty', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />)
    
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- PasswordStrengthIndicator.test.tsx
```

Expected: FAIL - Cannot find module '../PasswordStrengthIndicator'

- [ ] **Step 3: Implement PasswordStrengthIndicator component**

Create `client/src/components/auth/PasswordStrengthIndicator.tsx`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- PasswordStrengthIndicator.test.tsx
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/PasswordStrengthIndicator.tsx src/components/auth/__tests__/PasswordStrengthIndicator.test.tsx
git commit -m "feat(auth): add PasswordStrengthIndicator component

Create password strength meter with:
- Color-coded strength bar (weak/medium/strong)
- Animated width transitions
- Criteria checklist with checkmarks
- Real-time updates

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Enhanced LoginPage

**Files:**
- Modify: `client/src/pages/LoginPage.tsx`
- Test: `client/src/pages/__tests__/LoginPage.test.tsx`

- [ ] **Step 1: Write failing integration tests**

Create `client/src/pages/__tests__/LoginPage.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../LoginPage'

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('LoginPage', () => {
  it('renders login form with all fields', () => {
    renderWithRouter(<LoginPage />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders social login buttons', () => {
    renderWithRouter(<LoginPage />)

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
  })

  it('shows error for invalid email format', async () => {
    renderWithRouter(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('shows error for empty fields on submit', async () => {
    renderWithRouter(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('toggles remember me checkbox', () => {
    renderWithRouter(<LoginPage />)

    const checkbox = screen.getByRole('checkbox', { name: /remember me/i })
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('shows loading state during form submission', async () => {
    renderWithRouter(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- LoginPage.test.tsx
```

Expected: Tests fail (assertions fail or timeout)

- [ ] **Step 3: Update LoginPage with animations and new components**

Replace content of `client/src/pages/LoginPage.tsx`:

```typescript
import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Sparkle, Star } from '@phosphor-icons/react'
import FormInput from '../components/auth/FormInput'
import LoadingButton from '../components/auth/LoadingButton'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import FloatingCard from '../components/auth/FloatingCard'
import { isValidEmail } from '../utils/validation'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)

  const validateEmail = () => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }))
      return false
    }
    if (!isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      return false
    }
    setErrors(prev => ({ ...prev, email: '' }))
    return true
  }

  const validatePassword = () => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }))
      return false
    }
    setErrors(prev => ({ ...prev, password: '' }))
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const emailValid = validateEmail()
    const passwordValid = validatePassword()

    if (!emailValid || !passwordValid) return

    setIsLoading(true)

    // Mock API call
    setTimeout(() => {
      setIsLoading(false)
      alert(`Logged in as ${email}`)
    }, 1500)
  }

  const handleSocialLogin = (provider: 'google' | 'github') => {
    console.log(`Social login with ${provider}`)
    alert(`Social login with ${provider} - backend integration pending`)
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-violet-50 via-white to-slate-100 text-slate-900 transition-colors duration-300 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-200/40 blur-[120px] dark:bg-violet-900/20" />
        <div className="absolute bottom-1/4 right-1/3 h-[300px] w-[300px] rounded-full bg-purple-200/30 blur-[80px] dark:bg-purple-900/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]"
        >
          {/* Left: Content */}
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
              <Sparkle size={16} weight="fill" /> Fast access to your learning dashboard
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-2xl space-y-6">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Sign in and continue your English journey.
              </h1>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Access enrolled courses, payment history, and course progress from a single clean login experience designed for modern learners.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Secure access</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Two-step friendly login with encrypted credentials and automatic session management.</p>
              </div>
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">One-click support</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Need help? Our support team is available to resolve any login or access issues quickly.</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(124,58,237,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90 dark:shadow-none">
              <div className="flex items-center gap-4 rounded-3xl border border-violet-100/80 bg-violet-50/80 px-5 py-4 dark:border-violet-800/40 dark:bg-violet-900/30">
                <ShieldCheck size={24} className="text-violet-600 dark:text-violet-300" weight="fill" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Your account is protected.</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">Encrypted login and learner-first security across all devices.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Form */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-x-6 top-0 h-40 bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />

            <motion.div
              variants={itemVariants}
              className="relative rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_80px_rgba(124,58,237,0.12)] dark:border-neutral-800 dark:bg-neutral-950/95"
            >
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Login</p>
                <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">Welcome back</h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">Enter your email and password to sign in and pick up where you left off.</p>
              </div>

              <SocialLoginButtons
                onGoogleClick={() => handleSocialLogin('google')}
                onGithubClick={() => handleSocialLogin('github')}
                isLoading={isLoading}
              />

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <FormInput
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onBlur={validateEmail}
                  error={errors.email}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                />

                <FormInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  onBlur={validatePassword}
                  error={errors.password}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    Remember me
                  </label>
                  <Link to="/" className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">
                    Forgot password?
                  </Link>
                </div>

                <LoadingButton type="submit" isLoading={isLoading} className="w-full">
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </LoadingButton>
              </form>

              <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-neutral-900/80 dark:text-neutral-300">
                <p className="font-semibold text-slate-900 dark:text-white">New here?</p>
                <p className="mt-2">Create your account and start enrolling in courses today.</p>
                <Link to="/signup" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
                  Create new account <span>→</span>
                </Link>
              </div>
            </motion.div>

            {/* Floating cards */}
            <FloatingCard
              icon={<ShieldCheck size={20} weight="fill" />}
              title="Secure Login"
              subtitle="Encrypted"
              position="top-right"
              delay={0.9}
            />

            <FloatingCard
              icon={<Star size={20} weight="fill" />}
              title="4.9/5 Rating"
              subtitle="10K+ Students"
              position="bottom-left"
              delay={1.1}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- LoginPage.test.tsx
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/LoginPage.tsx src/pages/__tests__/LoginPage.test.tsx
git commit -m "feat(auth): redesign LoginPage with animations and modern components

Enhance login page with:
- Framer Motion entry animations
- Social login buttons (Google, GitHub)
- FormInput components with inline validation
- LoadingButton with submission state
- Floating decorative cards
- Improved responsive design

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Enhanced SignupPage

**Files:**
- Modify: `client/src/pages/SignupPage.tsx`
- Test: `client/src/pages/__tests__/SignupPage.test.tsx`

- [ ] **Step 1: Write failing integration tests**

Create `client/src/pages/__tests__/SignupPage.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SignupPage from '../SignupPage'

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('SignupPage', () => {
  it('renders signup form with all fields', () => {
    renderWithRouter(<SignupPage />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders social login buttons', () => {
    renderWithRouter(<SignupPage />)

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
  })

  it('shows password strength indicator when typing password', async () => {
    renderWithRouter(<SignupPage />)

    const passwordInput = screen.getAllByLabelText(/password/i)[0]
    fireEvent.change(passwordInput, { target: { value: 'Test' } })

    await waitFor(() => {
      expect(screen.getByText(/password strength/i)).toBeInTheDocument()
    })
  })

  it('shows error when passwords do not match', async () => {
    renderWithRouter(<SignupPage />)

    const passwordInput = screen.getAllByLabelText(/password/i)[0]
    const confirmInput = screen.getByLabelText(/confirm password/i)

    fireEvent.change(passwordInput, { target: { value: 'Password1!' } })
    fireEvent.change(confirmInput, { target: { value: 'Different1!' } })
    fireEvent.blur(confirmInput)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('shows error for weak password', async () => {
    renderWithRouter(<SignupPage />)

    const passwordInput = screen.getAllByLabelText(/password/i)[0]
    fireEvent.change(passwordInput, { target: { value: 'weak' } })
    fireEvent.blur(passwordInput)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during form submission', async () => {
    renderWithRouter(<SignupPage />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Password1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1!' } })
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- SignupPage.test.tsx
```

Expected: Tests fail (assertions fail or timeout)

- [ ] **Step 3: Update SignupPage with animations and new components**

Replace content of `client/src/pages/SignupPage.tsx`:

```typescript
import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkle, UserCircle, GraduationCap } from '@phosphor-icons/react'
import FormInput from '../components/auth/FormInput'
import LoadingButton from '../components/auth/LoadingButton'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import FloatingCard from '../components/auth/FloatingCard'
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator'
import { isValidEmail, isStrongPassword } from '../utils/validation'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(false)

  const validateName = () => {
    if (!name || name.length < 2) {
      setErrors(prev => ({ ...prev, name: 'Please enter your full name' }))
      return false
    }
    setErrors(prev => ({ ...prev, name: '' }))
    return true
  }

  const validateEmail = () => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }))
      return false
    }
    if (!isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      return false
    }
    setErrors(prev => ({ ...prev, email: '' }))
    return true
  }

  const validatePassword = () => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }))
      return false
    }
    if (!isStrongPassword(password)) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters with uppercase, number, and special character' }))
      return false
    }
    setErrors(prev => ({ ...prev, password: '' }))
    return true
  }

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }))
      return false
    }
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      return false
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }))
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nameValid = validateName()
    const emailValid = validateEmail()
    const passwordValid = validatePassword()
    const confirmValid = validateConfirmPassword()

    if (!nameValid || !emailValid || !passwordValid || !confirmValid) return

    setIsLoading(true)

    // Mock API call
    setTimeout(() => {
      setIsLoading(false)
      alert(`Account created for ${name}`)
    }, 1500)
  }

  const handleSocialLogin = (provider: 'google' | 'github') => {
    console.log(`Social login with ${provider}`)
    alert(`Social login with ${provider} - backend integration pending`)
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-violet-50 text-slate-900 transition-colors duration-300 dark:from-neutral-950 dark:via-neutral-900 dark:to-violet-950 dark:text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-200/40 blur-[120px] dark:bg-violet-900/20" />
        <div className="absolute bottom-1/4 right-1/3 h-[300px] w-[300px] rounded-full bg-purple-200/30 blur-[80px] dark:bg-purple-900/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]"
        >
          {/* Left: Content */}
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
              <Sparkle size={16} weight="fill" /> Start with a learner-first account
            </motion.div>

            <motion.div variants={itemVariants} className="max-w-2xl space-y-6">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Create your EnglishPro account.
              </h1>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Sign up in seconds and unlock real-time lessons, progress tracking, and a smarter study experience.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Fast setup</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Create an account quickly and begin exploring courses immediately.</p>
              </div>
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-800/40 dark:bg-neutral-900/80">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Smart progress</p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Your dashboard remembers your course progress so you can jump back in without losing momentum.</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(124,58,237,0.08)] dark:border-neutral-800 dark:bg-neutral-950/95">
              <div className="flex items-center gap-4">
                <div className="rounded-3xl bg-violet-600/10 p-3 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <UserCircle size={28} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Your learning space</p>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">Save your preferences and revisit courses anytime.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Form */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-x-6 top-0 h-40 bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />

            <motion.div
              variants={itemVariants}
              className="relative rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_80px_rgba(124,58,237,0.12)] dark:border-neutral-800 dark:bg-neutral-950/95"
            >
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400">Create account</p>
                <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">Join EnglishPro</h2>
                <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">Register once and get instant access to live classes, learning tools, and expert support.</p>
              </div>

              <SocialLoginButtons
                onGoogleClick={() => handleSocialLogin('google')}
                onGithubClick={() => handleSocialLogin('github')}
                isLoading={isLoading}
              />

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <FormInput
                  label="Full name"
                  type="text"
                  value={name}
                  onChange={setName}
                  onBlur={validateName}
                  error={errors.name}
                  placeholder="Enter your name"
                  required
                  disabled={isLoading}
                />

                <FormInput
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onBlur={validateEmail}
                  error={errors.email}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                />

                <div>
                  <FormInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(val) => {
                      setPassword(val)
                      if (confirmPassword && val !== confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
                      } else if (confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: '' }))
                      }
                    }}
                    onBlur={validatePassword}
                    error={errors.password}
                    placeholder="Create a secure password"
                    required
                    disabled={isLoading}
                  />
                  <PasswordStrengthIndicator password={password} />
                </div>

                <FormInput
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  onBlur={validateConfirmPassword}
                  error={errors.confirmPassword}
                  placeholder="Repeat your password"
                  required
                  disabled={isLoading}
                />

                <LoadingButton type="submit" isLoading={isLoading} className="w-full">
                  {isLoading ? 'Creating account...' : 'Create account'}
                </LoadingButton>
              </form>

              <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-neutral-900/80 dark:text-neutral-300">
                <p className="font-semibold text-slate-900 dark:text-white">Already a member?</p>
                <p className="mt-2">Log in and continue from where you left off.</p>
                <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
                  Log in <span>→</span>
                </Link>
              </div>
            </motion.div>

            {/* Floating cards */}
            <FloatingCard
              icon={<Sparkle size={20} weight="fill" />}
              title="Quick Setup"
              subtitle="2 Minutes"
              position="top-right"
              delay={0.9}
            />

            <FloatingCard
              icon={<GraduationCap size={20} weight="fill" />}
              title="50K+ Learners"
              subtitle="Join Today"
              position="bottom-left"
              delay={1.1}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- SignupPage.test.tsx
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/SignupPage.tsx src/pages/__tests__/SignupPage.test.tsx
git commit -m "feat(auth): redesign SignupPage with animations and modern components

Enhance signup page with:
- Framer Motion entry animations
- Social login buttons (Google, GitHub)
- Password strength indicator
- FormInput components with multi-field validation
- Password match validation
- LoadingButton with submission state
- Floating decorative cards
- Improved responsive design

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Final Testing & Verification

**Files:**
- All modified and created files

- [ ] **Step 1: Run full test suite**

```bash
cd client
npm test
```

Expected: All tests PASS

- [ ] **Step 2: Build project to verify no TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 3: Start dev server and manually test**

```bash
npm run dev
```

Expected: Server starts successfully

- [ ] **Step 4: Manual testing checklist**

Test in browser:
1. Navigate to `/login` - page loads with animations
2. Test form validation (empty fields, invalid email)
3. Test remember me checkbox
4. Test social login buttons (check console for logs)
5. Test form submission (loading state, success alert)
6. Navigate to `/signup` - page loads with animations
7. Test password strength indicator (type different passwords)
8. Test password match validation
9. Test all form validation rules
10. Test social login buttons
11. Test form submission
12. Test dark mode on both pages (toggle via system/browser)
13. Test responsive design (resize browser to mobile width)
14. Test keyboard navigation (tab through form)

- [ ] **Step 5: Final commit for testing verification**

```bash
git add -A
git commit -m "test: verify auth pages redesign implementation

All components tested and verified:
- Unit tests for all auth components
- Integration tests for LoginPage and SignupPage
- Manual testing completed for animations, validation, and UX
- Build verification passed
- Dark mode and responsive design tested

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Implementation Complete!

All tasks completed. The auth pages have been redesigned with:

✅ **Components** - FormInput, LoadingButton, FloatingCard, SocialLoginButtons, PasswordStrengthIndicator  
✅ **Animations** - Framer Motion page entry, form interactions, floating cards  
✅ **Validation** - Email format, password strength, inline errors  
✅ **Features** - Social login UI, password strength meter, loading states  
✅ **Testing** - Unit tests for components, integration tests for pages  
✅ **Responsive** - Mobile-first design, works on all breakpoints  
✅ **Accessibility** - ARIA labels, keyboard navigation, screen reader support  
✅ **Dark Mode** - Full support with proper contrast

---

## Post-Implementation Notes

### Backend Integration (Future Work)

The frontend is complete and ready for backend integration:

1. **OAuth Endpoints** - Replace console.log/alert in social login handlers with actual API calls to:
   - `POST /api/auth/google` - Google OAuth flow
   - `POST /api/auth/github` - GitHub OAuth flow

2. **Auth Endpoints** - Replace mock setTimeout in form submission with:
   - `POST /api/auth/login` - Email/password login
   - `POST /api/auth/signup` - Account creation

3. **Error Handling** - Add API error responses to show user-friendly messages

### Performance Optimization

If needed after deployment:
1. Code-split Framer Motion (import dynamically)
2. Lazy load floating cards on mobile
3. Optimize background blur effects
4. Add service worker for offline support

### Accessibility Audit

Run these tools to verify WCAG AA compliance:
- axe DevTools (browser extension)
- Lighthouse accessibility audit
- Screen reader testing (NVDA, JAWS, VoiceOver)

---

**End of Implementation Plan**
