# Courses Page Hero Section — Design Spec
**Date:** 2026-05-01
**Status:** Approved

---

## Goal

Replace the current dark-themed Courses hero (`bg-slate-900`) with a clean, minimal, creative **light-theme** hero section. The new hero must be fully responsive and align with the EnglishPro brand (violet/purple accent, DM Sans font, Framer Motion animations).

---

## Layout

**Split layout — 60/40 on desktop, stacked on mobile**

| Column | Content |
|--------|---------|
| Left (60%) | Badge · Heading · Subtitle · CTA buttons · Stats strip |
| Right (40%) | 3 stacked/overlapping floating course cards |

On tablet and mobile: right column stacks below left column.

---

## Background

- Base: `bg-white`
- Top-right radial gradient blob: `violet-100` at 60% opacity, `blur-3xl`, large circle ~600px, positioned absolutely
- Faint dot grid overlay: `bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px]`, very low opacity (`opacity-40`)
- No dark backgrounds, no dark gradient orbs

---

## Left Column

### Badge
- Phosphor icon: `GraduationCap` (weight="fill"), size 16
- Text: "20+ Expert Courses"
- Style: `inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold`
- Animate: `opacity 0 → 1, y 16 → 0` on mount, duration 0.5s

### Heading
- Text: "Explore Our English **Courses**"
- "Courses" uses violet gradient: `text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600`
- Style: `text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight`
- Animate: `opacity 0 → 1, y 24 → 0`, delay 0.1s

### Subtitle
- Text: "From beginner basics to IELTS mastery — expert-led courses designed to get you speaking confidently, faster."
- Style: `text-slate-500 text-lg max-w-lg leading-relaxed`
- Animate: delay 0.2s

### CTA Buttons
- Primary: "Browse Courses →" — `bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-violet-200`
- Secondary: "▶ Free Trial Class" — `border border-slate-200 hover:border-violet-300 text-slate-700 hover:text-violet-600 font-semibold px-8 py-4 rounded-2xl`
- Layout: `flex flex-col sm:flex-row gap-4`
- Animate: delay 0.3s

### Stats Strip
- 4 items: `6,000+ Active Students · 20+ Expert Courses · 4.9 Avg. Rating · 95% Success Rate`
- Layout: `flex flex-wrap gap-6` (not a grid card — just inline text with dividers)
- Each stat: small number bold `text-slate-900 font-black`, label `text-slate-400 text-xs`
- Separated by `·` or thin vertical dividers
- Animate: delay 0.4s

---

## Right Column — Floating Course Cards

Three course cards stacked with slight rotation and offset, creating a layered/floating effect.

### Card structure (each card)
```
┌────────────────────────────┐
│ [Category badge]   [★ 4.9] │
│ Course Title               │
│ ⏱ 8 Weeks  👤 850 learners │
└────────────────────────────┘
```

- `bg-white border border-slate-100 rounded-2xl shadow-xl p-5`
- Width: ~300px fixed on desktop
- Category badge: violet filled small pill
- Title: `font-bold text-slate-900 text-base`
- Meta row: `text-slate-400 text-xs` with Phosphor icons (Clock, Users)

### Positioning & Rotation
| Card | Course | Rotation | Offset |
|------|--------|----------|--------|
| Back (z-0) | General English Mastery | `rotate-[-6deg]` | translateY(16px), translateX(-8px) |
| Middle (z-10) | Business Communication | `rotate-[3deg]` | translateY(8px), translateX(8px) |
| Front (z-20) | IELTS Academic Success | `rotate-[0deg]` | no offset |

### Animation
- Wrapper: `animate` with `y: [0, -12, 0]` loop, duration 4s, ease "easeInOut" — gentle float
- Each card: `whileHover={{ scale: 1.03 }}`
- Entry: stagger in from bottom on mount

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| `< sm` (mobile) | Single column, cards hidden or shown below as small horizontal scroll |
| `sm – lg` (tablet) | Single column, cards shown smaller below text |
| `>= lg` (desktop) | Split 60/40, cards beside text |

- Padding: `py-20 lg:py-32`
- Max width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

---

## Files to Change

| File | Change |
|------|--------|
| `client/src/components/Courses.tsx` | Replace `{/* ─── HERO ─── */}` section (lines 231–322) with new light hero |

No new files needed. All other sections (Courses Grid, Learning Paths, FAQ, CTA) remain untouched.

---

## Constraints

- Keep all existing imports (`framer-motion`, `@phosphor-icons/react`)
- No new dependencies
- `dark:` variants not required for hero (it is explicitly light-only per spec)
- Use only Tailwind utility classes (no custom CSS)
- TypeScript strict — no `any`
