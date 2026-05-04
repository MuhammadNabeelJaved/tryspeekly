import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoadingButton from '../LoadingButton'

describe('LoadingButton', () => {
  it('renders button with text and clickable when not loading', () => {
    const handleClick = vi.fn()
    render(
      <LoadingButton onClick={handleClick} isLoading={false}>
        Sign In
      </LoadingButton>
    )

    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()

    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('disables button and hides text when loading', () => {
    render(
      <LoadingButton onClick={() => {}} isLoading={true}>
        Sign In
      </LoadingButton>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('shows spinner when loading and hides it when not loading', () => {
    const { rerender } = render(
      <LoadingButton onClick={() => {}} isLoading={false}>
        Sign In
      </LoadingButton>
    )

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()

    rerender(
      <LoadingButton onClick={() => {}} isLoading={true}>
        Sign In
      </LoadingButton>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('applies primary variant styling by default', () => {
    render(
      <LoadingButton onClick={() => {}} isLoading={false}>
        Sign In
      </LoadingButton>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-violet-600')
    expect(button).toHaveClass('hover:bg-violet-700')
  })

  it('applies secondary variant styling when variant prop is secondary', () => {
    render(
      <LoadingButton
        onClick={() => {}}
        isLoading={false}
        variant="secondary"
      >
        Cancel
      </LoadingButton>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-slate-300')
    expect(button).toHaveClass('hover:bg-slate-50')
  })

  it('prevents onClick when loading', () => {
    const handleClick = vi.fn()
    render(
      <LoadingButton onClick={handleClick} isLoading={true}>
        Sign In
      </LoadingButton>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className prop', () => {
    render(
      <LoadingButton
        onClick={() => {}}
        isLoading={false}
        className="custom-class"
      >
        Sign In
      </LoadingButton>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})
