# Admin Dashboard UI Improvement — Design Spec

**Date:** 2026-05-02  
**Approach:** Option A — Polish & Elevate  
**Scope:** `AdminPage.tsx`, `AdminOverview.tsx` (sidebar + overview page only)

---

## Goal

Align the admin dashboard's visual language with the main EnglishPro website — violet/purple accent dominance, bento-style cards, ambient blur orbs, bold typography, glassmorphism pill badges, and rounded-3xl corners — without restructuring the underlying data or routing logic.

---

## Section 1: Sidebar

### Brand Area
- Wrap sidebar `<aside>` background with a subtle top gradient:  
  `bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/20 dark:to-neutral-900`
- Keep existing border-right.

### Nav Section Grouping
Split `NAV_ITEMS` into two labeled groups:

| Group label | Views |
|---|---|
| `ANALYTICS` | overview, students, instructors |
| `MANAGEMENT` | courses, payments, payments-setup, financial-aid, cms, settings |

Group labels: `text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-600 px-3 mb-1 mt-4`

### Active Nav Item
- Change `rounded-xl` → `rounded-2xl` on active state (matches website card corners).
- Keep existing `bg-violet-600` fill and glow shadow.

### Pending Badges on Nav
- `payments` item: show count of `pendingPayments + failedPayments` if > 0 — amber badge.
- `financial-aid` item: show count of pending/under-review apps if > 0 — amber badge.
- Badge style: `bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-auto`

### User Profile Card (above logout)
Add a small card between nav and logout button:
```
┌──────────────────────────────┐
│ [A gradient avatar]  Admin   │
│                 admin@pro.com│
└──────────────────────────────┘
```
- Avatar: `w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600` with glow shadow `shadow-[0_4px_12px_rgba(124,58,237,0.4)]`
- Name: `text-sm font-black text-slate-900 dark:text-white`
- Email: `text-[10px] text-slate-400 dark:text-neutral-600`
- Card bg: `bg-slate-50 dark:bg-neutral-800 rounded-2xl px-3 py-2.5 mb-3`

---

## Section 2: Overview Stat Cards

### Card Layout
Grid stays `grid-cols-2 lg:grid-cols-5`. Corner radius `rounded-3xl` (was `rounded-[20px]`). Hover: `whileHover={{ scale: 1.02 }}`.

### Card 1 — Total Students (Hero Gradient Card)
- Background: `bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700`
- White text throughout.
- Decorative large watermark number: `absolute -top-2 -right-2 text-[80px] font-black text-white/10 leading-none select-none`
- Arrow icon: white, `group-hover:translate-x-0.5`

### Card 2 — Revenue (Dark Slate Card)
- Background: `bg-slate-900 dark:bg-neutral-800`
- Violet glow blob: `absolute top-0 right-0 w-24 h-24 bg-violet-600/20 rounded-full blur-2xl`
- White/slate text.

### Cards 3–5 — Courses, Instructors, Financial Aid
- Keep white/dark bg.
- Add colored left border accent: `border-l-4` with each card's color (blue, emerald, pink).
- Remove the icon box's individual glow shadow (redundant with border accent).

### Ambient Background (Content Area)
In `AdminOverview.tsx` wrapper div, add two absolute blur orbs (pointer-events-none, z-0):
- `absolute top-0 right-0 w-[400px] h-[400px] bg-violet-200/30 dark:bg-violet-900/15 rounded-full blur-[100px]`
- `absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-[80px]`

All card content must be `relative z-10`.

---

## Section 3: Overview Bottom Panels + Section Headers

### Welcome Strip
At top of `AdminOverview`, above alert strip, add:
```
Good morning, Admin 👋  ·  Friday, 2 May 2026
```
- Rendered dynamically via `new Date()` with greeting based on hour (morning/afternoon/evening).
- Style: `text-2xl font-black text-slate-900 dark:text-white` + `text-sm text-slate-400` for date part.

### Panel Header Pill Badges
Replace plain `icon + h2` headers in all panels with pill badge style matching main site:
```tsx
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/50">
  <Icon size={13} weight="fill" className="text-violet-600 dark:text-violet-400" />
  <span className="text-violet-700 dark:text-violet-300 text-xs font-bold tracking-wide uppercase">
    Recent Enrollments
  </span>
</div>
```
Each panel uses its own accent color for the pill (violet, emerald, blue, amber).

### Progress Bars
- Height: `h-1.5` → `h-2.5`
- Background: `bg-slate-100 dark:bg-neutral-800` (unchanged)
- Fill gradients unchanged.
- Slightly colored bg per section:
  - Countries: default violet fill, bg unchanged
  - Payment methods: blue fill, `bg-blue-50 dark:bg-blue-950/20`
  - Course enrollment: amber fill, `bg-amber-50 dark:bg-amber-950/20`

### Recent Enrollments — Avatar Colors
Rotate through 4 gradient colors per student index (instead of all-violet):
```ts
const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-orange-600',
]
// usage: AVATAR_GRADIENTS[index % 4]
```

### Countries — Flag Emoji
Add emoji flags next to known country names. Map the top countries (Pakistan → 🇵🇰, India → 🇮🇳, UK → 🇬🇧, USA → 🇺🇸, etc.) via a simple lookup object. Unknown countries show no flag.

---

## Files Changed

| File | Changes |
|---|---|
| `client/src/pages/AdminPage.tsx` | Sidebar gradient, nav grouping, profile card, pending badges, active item rounding |
| `client/src/pages/admin/AdminOverview.tsx` | Ambient orbs, welcome strip, stat card redesign, panel headers, progress bars, avatar colors, flag emojis |

## Files NOT Changed
All other admin sub-pages (AdminStudents, AdminCourses, etc.) are out of scope for this pass.

---

## Non-Goals
- No data/logic changes.
- No routing or state changes.
- No changes to sub-pages beyond Overview.
- No new dependencies.
