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
