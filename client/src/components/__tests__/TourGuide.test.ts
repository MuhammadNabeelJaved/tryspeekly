import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
    expect(s.top).toBe(100 - PAD)
    expect(s.left).toBe(50 - PAD)
    expect(s.width).toBe(200 + PAD * 2)
    expect(s.height).toBe(40 + PAD * 2)
  })

  it('clamps top and left to 0 near viewport edge but preserves width and height', () => {
    const rect = mockRect({ top: 5, left: 3, width: 200, height: 40 })
    const s = getSpotlightStyle(rect)
    expect(s.top).toBe(0)
    expect(s.left).toBe(0)
    expect(s.width).toBe(200 + PAD * 2)
    expect(s.height).toBe(40 + PAD * 2)
  })
})

describe('computeTipW', () => {
  afterEach(() => vi.unstubAllGlobals())

  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1280)
  })

  it('returns 320 on wide viewports', () => {
    expect(computeTipW()).toBe(320)
  })

  it('returns innerWidth - 32 on narrow viewports', () => {
    vi.stubGlobal('innerWidth', 300)
    expect(computeTipW()).toBe(300 - 32)
  })
})

describe('getTooltipPos', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1280)
    vi.stubGlobal('innerHeight', 800)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('places tooltip below when there is enough space below', () => {
    // spaceBelow = 800 - 140 = 660 >= 210
    const rect = mockRect({ top: 100, bottom: 140 })
    const result = getTooltipPos(rect, 320)
    expect(result.placement).toBe('below')
    expect(result.style.top).toBe(140 + PAD + 6)
  })

  it('places tooltip above when space below is insufficient', () => {
    // spaceBelow = 800 - 770 = 30 < 210; spaceAbove = 730 >= 210
    const rect = mockRect({ top: 730, bottom: 770 })
    const result = getTooltipPos(rect, 320)
    expect(result.placement).toBe('above')
    expect(result.style.bottom).toBe(800 - 730 + PAD + 6)
  })

  it('places tooltip to the right when both vertical spaces are insufficient', () => {
    // innerHeight 400: spaceBelow = 100, spaceAbove = 100, both < 210
    // innerWidth 1280: 1280 - 250 = 1030 >= 320 + 16 = 336
    vi.stubGlobal('innerHeight', 400)
    const rect = mockRect({ top: 100, bottom: 300, left: 50, right: 250 })
    const result = getTooltipPos(rect, 320)
    expect(result.placement).toBe('right')
  })

  it('places tooltip to the left as fallback', () => {
    // innerHeight 400, innerWidth 400
    // spaceBelow = 100, spaceAbove = 100, both < 210
    // 400 - 390 = 10 < 336 → left
    vi.stubGlobal('innerHeight', 400)
    vi.stubGlobal('innerWidth', 400)
    const rect = mockRect({ top: 100, bottom: 300, left: 20, right: 390 })
    const result = getTooltipPos(rect, 320)
    expect(result.placement).toBe('left')
  })
})
