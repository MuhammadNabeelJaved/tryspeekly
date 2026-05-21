import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getSpotlightStyle, computeTipW, getTooltipPos } from '../TourGuide'

const PAD = 10

function mockRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    top: 100, left: 50, bottom: 140, right: 250,
    width: 200, height: 40, x: 50, y: 100,
    toJSON: () => ({}),
    ...overrides,
  } as DOMRect
}

describe('getSpotlightStyle', () => {
  it('pads rect by PAD on all sides', () => {
    const rect = mockRect({ top: 100, left: 50, width: 200, height: 40 })
    const s = getSpotlightStyle(rect)
    expect(s.top).toBe(90)
    expect(s.left).toBe(40)
    expect(s.width).toBe(220)
    expect(s.height).toBe(60)
  })

  it('clamps top and left to 0 when rect is near viewport edge', () => {
    const rect = mockRect({ top: 5, left: 3 })
    const s = getSpotlightStyle(rect)
    expect(s.top).toBe(0)
    expect(s.left).toBe(0)
  })
})

describe('computeTipW', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1280)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 320 on wide viewports', () => {
    expect(computeTipW()).toBe(320)
  })

  it('returns innerWidth - 32 on narrow viewports', () => {
    vi.stubGlobal('innerWidth', 300)
    expect(computeTipW()).toBe(268)
  })
})

describe('getTooltipPos', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth',  { writable: true, configurable: true, value: 1280 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 })
  })

  it('places tooltip below when there is enough space below', () => {
    const rect = mockRect({ top: 100, bottom: 140 })
    const { placement } = getTooltipPos(rect, 320)
    expect(placement).toBe('below')
  })

  it('places tooltip above when there is not enough space below', () => {
    const rect = mockRect({ top: 730, bottom: 770 })
    const { placement } = getTooltipPos(rect, 320)
    expect(placement).toBe('above')
  })

  it('places tooltip to the right when both vertical spaces are insufficient', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 400 })
    const rect = mockRect({ top: 100, bottom: 300, left: 50, right: 250 })
    const { placement } = getTooltipPos(rect, 320)
    expect(placement).toBe('right')
  })

  it('places tooltip to the left as fallback', () => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 400 })
    Object.defineProperty(window, 'innerWidth',  { writable: true, configurable: true, value: 400 })
    const rect = mockRect({ top: 100, bottom: 300, left: 20, right: 390 })
    const { placement } = getTooltipPos(rect, 320)
    expect(placement).toBe('left')
  })
})
