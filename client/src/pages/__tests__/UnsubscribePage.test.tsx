import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import UnsubscribePage from '../UnsubscribePage'

vi.mock('@/services/newsletter.service', () => ({
  newsletterService: {
    unsubscribeByToken: vi.fn(),
  },
}))

const renderPage = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/unsubscribe${search}`]}>
      <Routes>
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
      </Routes>
    </MemoryRouter>
  )

describe('UnsubscribePage', () => {
  it('calls unsubscribeByToken with token from URL and shows success', async () => {
    const { newsletterService } = await import('@/services/newsletter.service')
    vi.mocked(newsletterService.unsubscribeByToken).mockResolvedValue({ success: true, message: 'Done' })

    renderPage('?token=abc-123')

    await waitFor(() => {
      expect(newsletterService.unsubscribeByToken).toHaveBeenCalledWith('abc-123')
      expect(screen.getByText(/unsubscribed/i)).toBeInTheDocument()
    })
  })

  it('shows error when no token is in URL', async () => {
    renderPage('')

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument()
    })
  })
})
