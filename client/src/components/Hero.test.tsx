import { render, screen } from '@testing-library/react'
import Hero from './Hero'

// globals: true in vitest.config.ts — no need to import describe/it/expect
// @testing-library/jest-dom is loaded via src/test/setup.ts

describe('Hero — Live Classroom scene', () => {
  it('renders the live session course name', () => {
    render(<Hero />)
    expect(screen.getByText('IELTS Speaking Practice')).toBeInTheDocument()
  })

  it('renders AI fluency score label', () => {
    render(<Hero />)
    expect(screen.getByText(/AI Fluency Score/i)).toBeInTheDocument()
  })

  it('renders the active lesson with TODAY badge', () => {
    render(<Hero />)
    expect(screen.getByText('Speaking Module')).toBeInTheDocument()
    expect(screen.getByText('TODAY')).toBeInTheDocument()
  })

  it('renders the 50K+ learners floating badge', () => {
    render(<Hero />)
    expect(screen.getByText('50K+')).toBeInTheDocument()
  })

  it('renders left-side CTAs unchanged', () => {
    render(<Hero />)
    expect(screen.getByText('Start Learning')).toBeInTheDocument()
    expect(screen.getByText('Watch Demo')).toBeInTheDocument()
  })
})
