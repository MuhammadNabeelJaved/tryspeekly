import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from './Hero'

describe('Hero', () => {
  it('renders left-side CTAs', () => {
    render(<Hero />)
    expect(screen.getByText('Start Learning')).toBeInTheDocument()
    expect(screen.getByText('Watch Demo')).toBeInTheDocument()
  })

  it('renders headline text', () => {
    render(<Hero />)
    expect(screen.getByText(/The Smarter Way/i)).toBeInTheDocument()
    expect(screen.getByText(/English\./i)).toBeInTheDocument()
  })

  it('renders scroll card labels for both columns', () => {
    render(<Hero />)
    // Column A labels (each rendered twice due to duplication for seamless loop)
    expect(screen.getAllByText('Speaking').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('IELTS Prep').length).toBeGreaterThanOrEqual(1)
    // Column B labels
    expect(screen.getAllByText('Vocabulary').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Conversation').length).toBeGreaterThanOrEqual(1)
  })

  it('renders social proof stats', () => {
    render(<Hero />)
    expect(screen.getByText(/10,000\+ students/i)).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
  })
})
