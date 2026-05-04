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
