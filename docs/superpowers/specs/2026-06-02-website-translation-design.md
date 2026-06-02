# Website Translation Design
**Date:** 2026-06-02
**Status:** Approved

---

## Goal
Let users translate the entire website into major languages for convenience, with the least implementation effort and full coverage of both UI text and dynamic content (course titles, blog posts, reviews, admin-entered text).

## Approach
A **custom-styled language switcher driving the Google Translate Element engine**. The engine machine-translates the whole rendered DOM on demand, so no per-string extraction is required. We hide Google's default UI entirely and present our own dropdown.

## Languages (curated set, 13)
| Code | Native name | Flag |
|------|-------------|------|
| en | English | 🇬🇧 |
| ur | اردو | 🇵🇰 |
| ar | العربية | 🇸🇦 |
| hi | हिन्दी | 🇮🇳 |
| bn | বাংলা | 🇧🇩 |
| es | Español | 🇪🇸 |
| fr | Français | 🇫🇷 |
| zh-CN | 中文 | 🇨🇳 |
| pt | Português | 🇵🇹 |
| id | Indonesia | 🇮🇩 |
| de | Deutsch | 🇩🇪 |
| ru | Русский | 🇷🇺 |
| tr | Türkçe | 🇹🇷 |

Adding a language later = one entry in this list.

---

## Architecture

### File structure
- **Create** `client/src/lib/googleTranslate.ts` — loads the Google script once, initializes the hidden element, and exposes `setLanguage(code)` / `getCurrentLanguage()` helpers built on the `googtrans` cookie.
- **Create** `client/src/components/LanguageSwitcher.tsx` — the dropdown UI (globe + current language → list of languages). Two visual variants via a `compact?: boolean` prop (full label for public navbar, icon-only for dashboard headers).
- **Modify** `client/index.html` — add the `#google_translate_element` mount node (hidden) and global CSS to suppress the Google banner/tooltip and prevent the `<body>` top-offset Google injects.
- **Modify** `client/src/components/Navbar.tsx` — add `<LanguageSwitcher />` to the public navbar.
- **Modify** the four dashboard headers — `AdminPage.tsx`, `StudentDashboardPage.tsx`, `InstructorDashboardPage.tsx`, and the team dashboard (team members use `AdminPage` layout) — add `<LanguageSwitcher compact />`.

### Core mechanism (`googleTranslate.ts`)
1. **Script load (once):** inject `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`. Define `window.googleTranslateElementInit` to construct:
   ```js
   new window.google.translate.TranslateElement(
     { pageLanguage: 'en', includedLanguages: '<csv of codes>', autoDisplay: false },
     'google_translate_element'
   )
   ```
   Idempotent: if `window.google?.translate` already exists, skip re-injection.
2. **Switch language (`setLanguage(code)`):**
   - Set cookie `googtrans=/en/<code>` on both `path=/` and the apex domain (so it persists across reloads/navigation). For `code === 'en'`, delete the cookie (show original).
   - Drive the hidden Google `<select.goog-te-combo>` by setting its value and dispatching a `change` event (the engine's supported trigger), OR reload if the combo isn't mounted yet.
   - Update `<html dir>` to `rtl` for `ar`/`ur`, else `ltr`.
3. **`getCurrentLanguage()`:** parse the `googtrans` cookie → returns the active code (default `en`).

### Persistence
The `googtrans` cookie persists the user's choice automatically — no localStorage needed. On subsequent loads, the engine reads the cookie and re-applies the translation; `LanguageSwitcher` reads it to show the active language.

### RTL handling
`setLanguage` sets `document.documentElement.dir = (code === 'ar' || code === 'ur') ? 'rtl' : 'ltr'`. On initial load, `googleTranslate.ts` applies the correct `dir` from the cookie.

### Hiding Google's default UI (`index.html` CSS)
```css
.goog-te-banner-frame, .skiptranslate { display: none !important; }
body { top: 0 !important; }
#goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
.goog-text-highlight { background: none !important; box-shadow: none !important; }
```
The `#google_translate_element` div is rendered but visually hidden (`position:absolute; left:-9999px`).

---

## Default behavior
Site loads in **English** by default (no auto-translation). Users opt in via the switcher. This protects first-impression quality and SEO.

## Switcher UI
- Trigger: globe icon (`Translate` or `Globe` from phosphor-icons) + current language native name (full variant) or just the icon (compact variant).
- Dropdown: list of the 13 languages (flag + native name), active one checkmarked. Includes an explicit "English (Original)" reset at top.
- Closes on outside click and on selection. Matches the app's existing rounded/violet styling and dark-mode classes.

## Trade-offs (accepted, documented)
- Machine-quality translation, not hand-curated.
- Google's Element script is "legacy" but works broadly, needs no API key, and incurs no cost.
- All Google-engine integration is isolated to `googleTranslate.ts`, so replacing the engine later (e.g. a paid translation API) touches only that one file.
- Minor layout shifts possible in some languages (longer words); acceptable for an opt-in convenience feature.

## Out of scope
- Hand-curated/professional translations.
- Translating server-side emails or PDFs.
- Per-user saved language preference in the database (cookie persistence is sufficient).

## Testing / verification
- Build passes (`vite build`).
- Manual: switch to Urdu/Arabic → page text translates, layout flips to RTL; reload → choice persists; switch back to English → original restored, `dir=ltr`.
- Switcher appears in public navbar and all four dashboard headers.
