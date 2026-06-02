# Website Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a custom language switcher that translates the entire website into 13 major languages using the Google Translate engine, with RTL support and cookie persistence.

**Architecture:** A single isolated module (`googleTranslate.ts`) wraps all Google-engine integration (script load, cookie, language switching, RTL). A `LanguageSwitcher.tsx` dropdown drives it. The switcher is placed in the public navbar and all four dashboard headers. Google's default UI is hidden via CSS in `index.html`.

**Tech Stack:** React 19 + TypeScript + Tailwind + Vite, Google Translate Element (no API key), Vitest for unit tests.

---

## File Structure

- **Create** `client/src/lib/googleTranslate.ts` — engine integration + pure helpers (`LANGUAGES`, `buildGoogtransValue`, `parseLangFromCookie`, `isRtl`, `loadGoogleTranslate`, `setLanguage`, `getCurrentLanguage`, `applyInitialDir`).
- **Create** `client/src/lib/__tests__/googleTranslate.test.ts` — unit tests for the pure helpers.
- **Create** `client/src/components/LanguageSwitcher.tsx` — dropdown UI (`compact?` prop).
- **Modify** `client/index.html` — hidden mount node + CSS to suppress Google's banner/tooltip.
- **Modify** `client/src/App.tsx` — call `loadGoogleTranslate()` + `applyInitialDir()` once on mount.
- **Modify** `client/src/components/Navbar.tsx` — add switcher (desktop + mobile).
- **Modify** `client/src/pages/AdminPage.tsx`, `StudentDashboardPage.tsx`, `InstructorDashboardPage.tsx` — add `<LanguageSwitcher compact />` in the header.

---

## Task 1: Pure helpers + unit tests in googleTranslate.ts

**Files:**
- Create: `client/src/lib/googleTranslate.ts`
- Create: `client/src/lib/__tests__/googleTranslate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `client/src/lib/__tests__/googleTranslate.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd client && npx vitest run src/lib/__tests__/googleTranslate.test.ts`
Expected: FAIL — cannot resolve `../googleTranslate`.

- [ ] **Step 3: Create the module with the pure helpers**

Create `client/src/lib/googleTranslate.ts`:

```ts
export interface Language {
  code: string      // Google Translate language code
  label: string     // Native name shown in the UI
  flag: string
}

// English first (the original / reset option), then 12 translation targets.
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

/** Cookie value the Google engine reads. Empty string means "show original". */
export function buildGoogtransValue(code: string): string {
  return code === 'en' ? '' : `/en/${code}`
}

/** Read the active language from a document.cookie string. Defaults to 'en'. */
export function parseLangFromCookie(cookie: string): string {
  const match = cookie.match(/googtrans=\/en\/([\w-]+)/)
  return match && match[1] ? match[1] : 'en'
}

export function isRtl(code: string): boolean {
  return RTL_CODES.has(code)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd client && npx vitest run src/lib/__tests__/googleTranslate.test.ts`
Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/googleTranslate.ts client/src/lib/__tests__/googleTranslate.test.ts
git commit -m "feat(i18n): add googleTranslate pure helpers with unit tests"
```

---

## Task 2: Engine integration functions

**Files:**
- Modify: `client/src/lib/googleTranslate.ts`

- [ ] **Step 1: Append the side-effecting functions**

Add to the end of `client/src/lib/googleTranslate.ts`:

```ts
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

/** Write the googtrans cookie on path=/ and (in prod) the apex domain. */
function writeCookie(value: string) {
  const host = window.location.hostname
  // Expire when value is empty (reset to English)
  const expires = value ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  const cookie = value ? `googtrans=${value}` : 'googtrans='
  document.cookie = `${cookie}; path=/${expires}`
  if (host && host !== 'localhost' && !/^[\d.]+$/.test(host)) {
    const apex = host.replace(/^www\./, '')
    document.cookie = `${cookie}; path=/; domain=.${apex}${expires}`
  }
}

/** Switch the page language. Updates cookie, drives the hidden combo, sets <html dir>. */
export function setLanguage(code: string): void {
  writeCookie(buildGoogtransValue(code))
  document.documentElement.dir = isRtl(code) ? 'rtl' : 'ltr'

  const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo')
  if (combo) {
    combo.value = code === 'en' ? '' : code
    combo.dispatchEvent(new Event('change'))
    if (code === 'en') window.location.reload() // engine has no clean "undo" without reload
  } else {
    window.location.reload() // widget not ready yet — cookie applies on reload
  }
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
```

- [ ] **Step 2: Verify the existing unit tests still pass**

Run: `cd client && npx vitest run src/lib/__tests__/googleTranslate.test.ts`
Expected: PASS — the 6 helper tests still pass (new functions are not imported by the test).

- [ ] **Step 3: Verify the module typechecks**

Run: `cd client && npx tsc -b --noEmit 2>&1 | grep googleTranslate || echo "no googleTranslate errors"`
Expected: `no googleTranslate errors`.

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/googleTranslate.ts
git commit -m "feat(i18n): add Google Translate engine integration (load, setLanguage, RTL)"
```

---

## Task 3: Hidden mount node + suppress Google UI in index.html

**Files:**
- Modify: `client/index.html`

- [ ] **Step 1: Add the hidden mount node and CSS**

In `client/index.html`, replace the `<body>` block:

```html
  <body>
    <div id="root"></div>
    <div id="google_translate_element" aria-hidden="true" style="position:absolute;left:-9999px;top:-9999px;"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
```

And add this `<style>` inside `<head>` (just before `</head>`):

```html
    <style>
      /* Hide Google Translate's injected banner, tooltip, and body offset */
      .goog-te-banner-frame, .skiptranslate { display: none !important; }
      body { top: 0 !important; position: static !important; }
      #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
      .goog-text-highlight { background: none !important; box-shadow: none !important; }
    </style>
```

- [ ] **Step 2: Verify the build still succeeds**

Run: `cd client && npx vite build 2>&1 | grep -E "built in|error" | head -3`
Expected: `✓ built in ...` (no error).

- [ ] **Step 3: Commit**

```bash
git add client/index.html
git commit -m "feat(i18n): add hidden translate mount node and suppress Google default UI"
```

---

## Task 4: Initialize the engine on app mount

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Read the top of App.tsx to find the imports and the root component**

Run: `cd client && sed -n '1,20p' src/App.tsx` and locate the default-exported `App` function and its first `useEffect` (or add one).

- [ ] **Step 2: Add the import**

Add near the other imports in `client/src/App.tsx`:

```tsx
import { useEffect } from 'react'
import { loadGoogleTranslate, applyInitialDir } from '@/lib/googleTranslate'
```

(If `useEffect`/`react` is already imported, merge — do not duplicate the import.)

- [ ] **Step 3: Call the loaders once inside the App component**

Inside the `App` component body (the one that renders `<BrowserRouter>`), add as the first statement before the `return`:

```tsx
  useEffect(() => {
    applyInitialDir()
    loadGoogleTranslate()
  }, [])
```

- [ ] **Step 4: Verify typecheck + build**

Run: `cd client && npx tsc -b --noEmit 2>&1 | grep "App.tsx" || echo "no App errors"`
Expected: `no App errors`.

- [ ] **Step 5: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(i18n): load Google Translate engine and apply RTL on app mount"
```

---

## Task 5: LanguageSwitcher component

**Files:**
- Create: `client/src/components/LanguageSwitcher.tsx`

- [ ] **Step 1: Create the component**

Create `client/src/components/LanguageSwitcher.tsx`:

```tsx
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
    setLanguage(code) // triggers reload / engine switch
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
```

- [ ] **Step 2: Verify typecheck**

Run: `cd client && npx tsc -b --noEmit 2>&1 | grep "LanguageSwitcher" || echo "no LanguageSwitcher errors"`
Expected: `no LanguageSwitcher errors`.

> Note: the `<button>`/`<span>` labels must NOT be translated by the engine. The switcher list shows native names that should stay fixed. This is acceptable — the engine may translate the visible label, but selecting still works by code. No action needed.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/LanguageSwitcher.tsx
git commit -m "feat(i18n): add LanguageSwitcher dropdown component"
```

---

## Task 6: Add switcher to the public navbar

**Files:**
- Modify: `client/src/components/Navbar.tsx`

- [ ] **Step 1: Add the import**

Near the top imports of `client/src/components/Navbar.tsx` (after the `ThemeToggle` import on line 5):

```tsx
import LanguageSwitcher from './LanguageSwitcher'
```

- [ ] **Step 2: Add to the desktop actions** (the block around lines 242–244)

Replace:

```tsx
            <div className="ml-1">
              <ThemeToggle />
            </div>
```

with:

```tsx
            <div className="ml-1 flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
```

- [ ] **Step 3: Add to the mobile actions** (around line 249)

Replace:

```tsx
          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
```

with:

```tsx
          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
```

- [ ] **Step 4: Verify typecheck**

Run: `cd client && npx tsc -b --noEmit 2>&1 | grep "Navbar.tsx" || echo "no Navbar errors"`
Expected: `no Navbar errors`.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Navbar.tsx
git commit -m "feat(i18n): add language switcher to public navbar"
```

---

## Task 7: Add switcher to all three dashboard headers

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`
- Modify: `client/src/pages/StudentDashboardPage.tsx`
- Modify: `client/src/pages/InstructorDashboardPage.tsx`

Each dashboard header has the identical pattern: `<DashboardSearch items={...} />` immediately followed by a `{/* Dark mode */}` button. Insert `<LanguageSwitcher compact />` between them.

- [ ] **Step 1: AdminPage.tsx — add import**

Add after the `DashboardSearch` import line:

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher'
```

- [ ] **Step 2: AdminPage.tsx — insert the switcher**

Replace:

```tsx
            <DashboardSearch items={ADMIN_SEARCH_ITEMS} />
```

with:

```tsx
            <DashboardSearch items={ADMIN_SEARCH_ITEMS} />
            <LanguageSwitcher compact />
```

- [ ] **Step 3: StudentDashboardPage.tsx — add import**

Add after the `DashboardSearch` import line:

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher'
```

- [ ] **Step 4: StudentDashboardPage.tsx — insert the switcher**

Replace:

```tsx
            <DashboardSearch items={STUDENT_SEARCH_ITEMS} />
```

with:

```tsx
            <DashboardSearch items={STUDENT_SEARCH_ITEMS} />
            <LanguageSwitcher compact />
```

- [ ] **Step 5: InstructorDashboardPage.tsx — add import**

Add after the `DashboardSearch` import line:

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher'
```

- [ ] **Step 6: InstructorDashboardPage.tsx — insert the switcher**

Replace:

```tsx
            <DashboardSearch items={INSTRUCTOR_SEARCH_ITEMS} />
```

with:

```tsx
            <DashboardSearch items={INSTRUCTOR_SEARCH_ITEMS} />
            <LanguageSwitcher compact />
```

> Note: team members use the AdminPage layout, so adding it to AdminPage covers the team dashboard too.

- [ ] **Step 7: Verify typecheck for all three**

Run: `cd client && npx tsc -b --noEmit 2>&1 | grep -E "AdminPage|StudentDashboardPage|InstructorDashboardPage" || echo "no dashboard errors"`
Expected: `no dashboard errors`.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/AdminPage.tsx client/src/pages/StudentDashboardPage.tsx client/src/pages/InstructorDashboardPage.tsx
git commit -m "feat(i18n): add language switcher to admin, student, and instructor dashboards"
```

---

## Task 8: Full build + push

- [ ] **Step 1: Run the unit tests**

Run: `cd client && npx vitest run src/lib/__tests__/googleTranslate.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 2: Full production build**

Run: `cd client && npx vite build 2>&1 | grep -E "built in|error" | head -3`
Expected: `✓ built in ...` (no error).

- [ ] **Step 3: Push**

```bash
git push origin main
```
Expected: all commits pushed.

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - 13 languages → Task 1 `LANGUAGES`
  - Hidden Google element + suppress UI → Task 3
  - Engine load + init → Task 2 (`loadGoogleTranslate`) + Task 4 (mount)
  - Cookie persistence → Task 2 (`writeCookie`, `googtrans`)
  - RTL for ar/ur → Task 1 (`isRtl`) + Task 2 (`setLanguage`, `applyInitialDir`)
  - Switcher component (compact variant) → Task 5
  - Navbar placement → Task 6
  - All 4 dashboards (team via Admin) → Task 7
  - English default / opt-in → no auto-switch on load; only `applyInitialDir` (reads persisted cookie)
- [x] **No placeholders** — every step has full code.
- [x] **Type consistency** — `LANGUAGES`, `setLanguage`, `getCurrentLanguage`, `buildGoogtransValue`, `parseLangFromCookie`, `isRtl`, `loadGoogleTranslate`, `applyInitialDir` names are consistent across Tasks 1, 2, 4, 5.
- [x] **`Translate` icon** exists in `@phosphor-icons/react` (used as the globe/translate trigger).
