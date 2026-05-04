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
