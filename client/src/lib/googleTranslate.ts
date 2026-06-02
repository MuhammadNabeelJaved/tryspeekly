export interface Language {
  code: string
  label: string
  flag: string
}

export const LANGUAGES: Language[] = [
  { code: 'en',    label: 'English',    flag: '🇬🇧' },
  { code: 'ur',    label: 'اردو',        flag: '🇵🇰' },
  { code: 'ar',    label: 'العربية',     flag: '🇸🇦' },
  { code: 'hi',    label: 'हिन्दी',       flag: '🇮🇳' },
  { code: 'bn',    label: 'বাংলা',       flag: '🇧🇩' },
  { code: 'es',    label: 'Español',    flag: '🇪🇸' },
  { code: 'fr',    label: 'Français',   flag: '🇫🇷' },
  { code: 'zh-CN', label: '中文',        flag: '🇨🇳' },
  { code: 'pt',    label: 'Português',  flag: '🇵🇹' },
  { code: 'id',    label: 'Indonesia',  flag: '🇮🇩' },
  { code: 'de',    label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'ru',    label: 'Русский',     flag: '🇷🇺' },
  { code: 'tr',    label: 'Türkçe',     flag: '🇹🇷' },
]

const RTL_CODES = new Set(['ar', 'ur'])

export function buildGoogtransValue(code: string): string {
  return code === 'en' ? '' : `/en/${code}`
}

export function parseLangFromCookie(cookie: string): string {
  const match = cookie.match(/googtrans=\/en\/([\w-]+)/)
  return match && match[1] ? match[1] : 'en'
}

export function isRtl(code: string): boolean {
  return RTL_CODES.has(code)
}

const INCLUDED = LANGUAGES.filter(l => l.code !== 'en').map(l => l.code).join(',')

declare global {
  interface Window {
    google?: { translate?: { TranslateElement: new (opts: object, el: string) => void } }
    googleTranslateElementInit?: () => void
  }
}

/** Inject the Google Translate Element script once and init the hidden widget. */
export function loadGoogleTranslate(): void {
  if (typeof window === 'undefined') return
  if (document.getElementById('google-translate-script')) return

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate) return
    new window.google.translate.TranslateElement(
      { pageLanguage: 'en', includedLanguages: INCLUDED, autoDisplay: false },
      'google_translate_element',
    )
  }

  const s = document.createElement('script')
  s.id = 'google-translate-script'
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  s.async = true
  document.body.appendChild(s)
}

/** Set the googtrans cookie to a value on path=/ and (in prod) the apex domain. */
function writeCookie(value: string) {
  const host = window.location.hostname
  document.cookie = `googtrans=${value}; path=/`
  if (host && host !== 'localhost' && !/^[\d.]+$/.test(host)) {
    const apex = host.replace(/^www\./, '')
    document.cookie = `googtrans=${value}; path=/; domain=.${apex}`
  }
}

/** Delete the googtrans cookie across the path/domain variants Google may have set. */
function deleteCookie() {
  const host = window.location.hostname
  const past = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = `googtrans=; path=/; ${past}`
  document.cookie = `googtrans=; ${past}`
  if (host && host !== 'localhost' && !/^[\d.]+$/.test(host)) {
    const apex = host.replace(/^www\./, '')
    document.cookie = `googtrans=; path=/; domain=.${apex}; ${past}`
    document.cookie = `googtrans=; path=/; domain=${apex}; ${past}`
  }
}

/**
 * Switch the page language. Always reloads so the Google engine re-reads the
 * cookie from a clean state (driving the hidden combo is unreliable — its option
 * list has no empty value, so resetting to English silently fails).
 */
export function setLanguage(code: string): void {
  if (code === 'en') {
    deleteCookie()
    document.documentElement.dir = 'ltr'
  } else {
    writeCookie(buildGoogtransValue(code))
    document.documentElement.dir = isRtl(code) ? 'rtl' : 'ltr'
  }
  window.location.reload()
}

export function getCurrentLanguage(): string {
  if (typeof document === 'undefined') return 'en'
  return parseLangFromCookie(document.cookie)
}

/** On initial load, set <html dir> to match the persisted language. */
export function applyInitialDir(): void {
  if (typeof document === 'undefined') return
  document.documentElement.dir = isRtl(getCurrentLanguage()) ? 'rtl' : 'ltr'
}
