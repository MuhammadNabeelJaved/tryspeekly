import { useState, useRef, useEffect } from 'react'
import { Translate, CaretDown, Check } from '@phosphor-icons/react'
import { LANGUAGES, setLanguage, getCurrentLanguage } from '@/lib/googleTranslate'

interface Props {
  /** Icon-only trigger for dashboard headers; full label for the public navbar. */
  compact?: boolean
}

export default function LanguageSwitcher({ compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('en')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setCurrent(getCurrentLanguage()) }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const active = LANGUAGES.find(l => l.code === current) ?? LANGUAGES[0]

  const pick = (code: string) => {
    setOpen(false)
    if (code === current) return
    setLanguage(code)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Change language"
        className={`flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors ${
          compact ? 'w-8 h-8 justify-center' : 'px-2.5 h-9'
        }`}
      >
        <Translate size={16} />
        {!compact && <span className="text-sm font-semibold">{active.label}</span>}
        {!compact && <CaretDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 z-[120] bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-xl max-h-80 overflow-y-auto py-1">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => pick(lang.code)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1 text-sm text-slate-700 dark:text-neutral-200">
                {lang.label}{lang.code === 'en' ? ' (Original)' : ''}
              </span>
              {lang.code === current && <Check size={15} weight="bold" className="text-violet-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
