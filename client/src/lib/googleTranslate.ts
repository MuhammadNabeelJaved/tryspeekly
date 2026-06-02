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
