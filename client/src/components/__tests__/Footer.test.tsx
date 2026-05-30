import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Footer from '../Footer'

vi.mock('@/services/newsletter.service', () => ({
  newsletterService: {
    subscribe: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

const renderFooter = () => render(<BrowserRouter><Footer /></BrowserRouter>)

describe('Footer newsletter subscription', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls newsletterService.subscribe with entered email on submit', async () => {
    const { newsletterService } = await import('@/services/newsletter.service')
    vi.mocked(newsletterService.subscribe).mockResolvedValue({ success: true, message: 'Subscribed!' })

    renderFooter()

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /subscribe now/i }))

    await waitFor(() => {
      expect(newsletterService.subscribe).toHaveBeenCalledWith('user@example.com')
    })
  })

  it('shows error toast when subscribe returns a conflict', async () => {
    const toast = await import('react-hot-toast')
    const { newsletterService } = await import('@/services/newsletter.service')
    vi.mocked(newsletterService.subscribe).mockRejectedValue({
      response: { data: { message: 'This email is already subscribed.' } },
    })

    renderFooter()

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'dup@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /subscribe now/i }))

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('This email is already subscribed.')
    })
  })
})
