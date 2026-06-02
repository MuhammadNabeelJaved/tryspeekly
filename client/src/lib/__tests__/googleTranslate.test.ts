import { describe, it, expect } from 'vitest'
import { LANGUAGES, buildGoogtransValue, parseLangFromCookie, isRtl } from '../googleTranslate'

describe('googleTranslate helpers', () => {
  it('includes English plus 12 translation languages', () => {
    expect(LANGUAGES[0].code).toBe('en')
    expect(LANGUAGES).toHaveLength(13)
    expect(LANGUAGES.map(l => l.code)).toContain('ur')
    expect(LANGUAGES.map(l => l.code)).toContain('zh-CN')
  })

  it('buildGoogtransValue returns /en/<code> for non-English', () => {
    expect(buildGoogtransValue('ur')).toBe('/en/ur')
    expect(buildGoogtransValue('zh-CN')).toBe('/en/zh-CN')
  })

  it('buildGoogtransValue returns empty string for English (reset)', () => {
    expect(buildGoogtransValue('en')).toBe('')
  })

  it('parseLangFromCookie extracts the target language', () => {
    expect(parseLangFromCookie('googtrans=/en/ur')).toBe('ur')
    expect(parseLangFromCookie('foo=1; googtrans=/en/ar; bar=2')).toBe('ar')
    expect(parseLangFromCookie('googtrans=/en/zh-CN')).toBe('zh-CN')
  })

  it('parseLangFromCookie defaults to en when absent or malformed', () => {
    expect(parseLangFromCookie('')).toBe('en')
    expect(parseLangFromCookie('other=1')).toBe('en')
    expect(parseLangFromCookie('googtrans=/en/')).toBe('en')
  })

  it('isRtl is true only for Arabic and Urdu', () => {
    expect(isRtl('ar')).toBe(true)
    expect(isRtl('ur')).toBe(true)
    expect(isRtl('en')).toBe(false)
    expect(isRtl('fr')).toBe(false)
  })
})
