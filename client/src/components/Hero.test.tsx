import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero, { getTimeUntilNextClass } from './Hero'

describe('Hero — Bento Grid', () => {
  it('renders left-side CTAs unchanged', () => {
    render(<Hero />)
    expect(screen.getByText('Start Learning')).toBeInTheDocument()
    expect(screen.getByText('Watch Demo')).toBeInTheDocument()
  })

  it('renders IELTS Speaking Practice in Next Class card', () => {
    render(<Hero />)
    expect(screen.getByText('IELTS Speaking Practice')).toBeInTheDocument()
  })

  it('renders LIVE badge', () => {
    render(<Hero />)
    expect(screen.getByText(/live/i)).toBeInTheDocument()
  })

  it('renders rating card', () => {
    render(<Hero />)
    expect(screen.getByText('4.9')).toBeInTheDocument()
    expect(screen.getByText(/1,200\+/)).toBeInTheDocument()
  })

  it('renders streak card', () => {
    render(<Hero />)
    expect(screen.getByText(/7-Day Streak/i)).toBeInTheDocument()
  })

  it('renders certificate card', () => {
    render(<Hero />)
    expect(screen.getByText(/Certificate/i)).toBeInTheDocument()
  })

  it('renders speaking progress card', () => {
    render(<Hero />)
    expect(screen.getByText(/Speaking Progress/i)).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('renders 50K+ learners card', () => {
    render(<Hero />)
    expect(screen.getByText('50K+')).toBeInTheDocument()
  })
})

describe('getTimeUntilNextClass', () => {
  // Date strings without timezone offset are parsed as local time by JS.
  // setHours(18) also uses local time — so the arithmetic is consistent
  // regardless of the machine's timezone.
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns correct hours/minutes/seconds when class is in the future', () => {
    vi.setSystemTime(new Date('2026-05-16T14:00:00')) // 4 hours before 18:00 local
    const result = getTimeUntilNextClass()
    expect(result.h).toBe(4)
    expect(result.m).toBe(0)
    expect(result.s).toBe(0)
  })

  it('rolls over to next day when 6PM has already passed', () => {
    // Class is daily at 18:00. Past that, next class is 23h away (18:00 next day).
    vi.setSystemTime(new Date('2026-05-16T19:00:00')) // 1 hour past 18:00
    const result = getTimeUntilNextClass()
    expect(result.h).toBe(23)
    expect(result.m).toBe(0)
    expect(result.s).toBe(0)
  })

  it('returns all-zero values at exactly 6PM', () => {
    // At exactly 18:00:00, diff rounds to 0 — class starts now.
    vi.setSystemTime(new Date('2026-05-16T18:00:00'))
    const result = getTimeUntilNextClass()
    expect(result.h).toBe(0)
    expect(result.m).toBe(0)
    expect(result.s).toBe(0)
  })
})
