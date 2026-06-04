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
