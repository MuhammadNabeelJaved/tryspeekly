# Dark Theme Polish & UI Consistency — Design Spec

**Date:** 2026-04-30
**Scope:** Fix dark theme inconsistencies and add premium polish across all landing page sections. No layout changes. Color scheme (violet/purple/slate) is preserved.

---

## Problem Summary

The landing page has dark theme applied inconsistently:
- Testimonials uses `violet-900` background — breaks the slate-950/slate-900 rhythm of every other section
- HowItWorks uses hardcoded hex values (`#0f172a`, `#1e293b`) instead of Tailwind tokens
- Stats bento cards use `dark:bg-white/[0.03]` — cards are nearly invisible in dark mode
- Bento card borders `dark:border-white/10` — too faint
- Blog "Read More" link missing `dark:text-violet-400`
- Primary buttons inconsistent violet glow in dark mode

---

## Design Decisions

### 1. Dark Background System

Keep the intentional alternating depth pattern (slate-950 → slate-900 → slate-950…):

| Section | Light bg | Dark bg (current) | Dark bg (fixed) |
|---|---|---|---|
| Hero | `#fafafa` | `slate-950` ✓ | no change |
| Stats/Bento | `white` | `slate-950` ✓ | no change |
| Features | `white` | `slate-900` ✓ | no change |
| HowItWorks | `gray-50` | `#0f172a` (hardcoded) | `slate-950` |
| Testimonials | `violet-600` | `violet-900` ✗ | `slate-900` |
| Reviews | `white` | `slate-950` ✓ | no change |
| CTA | `gray-50` | `slate-950` ✓ | no change |
| Process | `white` | `slate-900` ✓ | no change |
| Blog | `gray-50` | `slate-950` ✓ | no change |

### 2. Testimonials Section (Biggest Fix)

**Current:** `bg-violet-600 dark:bg-violet-900` — completely different palette in dark mode.

**Fix:**
- Dark bg → `dark:bg-slate-900`
- Image overlay gradient → replace `violet-900` tones with `slate-900` tones
- Floating stats card → `dark:bg-slate-800/60`
- Add `border-t-2 border-violet-500/30` to the section in dark mode as a subtle brand accent
- Keep all text colors (white, violet-200, violet-300) — they work on the new dark bg

### 3. Stats Bento Cards

- Card bg: `dark:bg-white/[0.03]` → `dark:bg-slate-800/50`
- Card hover: `dark:hover:bg-white/[0.05]` → `dark:hover:bg-slate-800/70`
- Card border: `dark:border-white/10` → `dark:border-slate-700/50`
- Icon inner bg: `dark:bg-slate-950/50` → `dark:bg-slate-900`

### 4. HowItWorks

- Section bg: `dark:bg-[#0f172a]` → `dark:bg-slate-950`
- Card bg: `dark:bg-[#1e293b]` → `dark:bg-slate-800`
- Card gradient: `dark:from-[#1e293b]` → `dark:from-slate-800`

### 5. Global Polish

- Blog "Read More" link: add `dark:text-violet-400 dark:hover:text-violet-300`
- All primary violet CTA buttons: ensure `dark:shadow-[0_4px_20px_rgba(124,58,237,0.3)]`
- Process floating card: add `backdrop-blur-sm` for glass feel
- Bento card arrow button hover: `dark:group-hover:bg-white/10` → `dark:group-hover:bg-slate-700/50`

---

## Non-Goals

- No layout changes
- No new components
- No color scheme changes (violet/purple remains the brand accent)
- No light theme changes
