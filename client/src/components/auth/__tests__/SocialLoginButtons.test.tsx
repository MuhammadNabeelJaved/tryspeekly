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
