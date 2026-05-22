import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from './Hero'

describe('Hero', () => {
  it('renders CTAs', () => {
    render(<Hero />)
    expect(screen.getByText('Start Learning')).toBeInTheDocument()
    expect(screen.getByText('Watch Demo')).toBeInTheDocument()
  })

  it('renders headline text', () => {
    render(<Hero />)
    expect(screen.getByText(/The Smarter Way/i)).toBeInTheDocument()
    expect(screen.getByText(/English\./i)).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    render(<Hero />)
    expect(screen.getByText(/Expert-led sessions via Zoom/i)).toBeInTheDocument()
  })

  it('renders social proof stats', () => {
    render(<Hero />)
    expect(screen.getByText(/10,000\+ students/i)).toBeInTheDocument()
    expect(screen.getAllByText('95%').length).toBeGreaterThanOrEqual(1)
  })

  it('renders scroll card rows', () => {
    render(<Hero />)
    expect(screen.getAllByText('IELTS Prep').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Grammar Mastery').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Speaking Practice').length).toBeGreaterThanOrEqual(1)
  })
})
