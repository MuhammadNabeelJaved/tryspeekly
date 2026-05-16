import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserAvatar from '../UserAvatar'

describe('UserAvatar', () => {
  it('renders an img when src is provided', () => {
    render(<UserAvatar src="https://res.cloudinary.com/test/image.jpg" name="Ali Khan" size="md" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/test/image.jpg')
    expect(img).toHaveAttribute('alt', 'Ali Khan')
  })

  it('renders the first letter of name when src is absent', () => {
    render(<UserAvatar name="Sara Malik" size="md" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('renders ? fallback when neither src nor name is provided', () => {
    render(<UserAvatar size="sm" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders fallback when img fails to load', async () => {
    render(<UserAvatar src="https://broken-url.com/image.jpg" name="Tariq Ali" size="md" />)
    const img = screen.getByRole('img')
    fireEvent.error(img)
    await waitFor(() => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(screen.getByText('T')).toBeInTheDocument()
    })
  })
})
