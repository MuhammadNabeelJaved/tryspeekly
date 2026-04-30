# Hero Creative Redesign — Design Spec

**Date:** 2026-04-30
**Scope:** Redesign the Hero section (`client/src/components/Hero.tsx`) with an immersive full-bleed animated gradient background. Single-column centered layout replaces the current two-column image split. Same color scheme (violet/purple/slate). Light and dark mode both supported.

---

## Problem

The current hero is a standard two-column layout (text left, stock image right) with balanced proportions. It works but is visually predictable. The goal is to elevate it to feel premium and aspirational through an immersive background and bolder typographic hierarchy.

---

## Design

### Layout

- **Full-width, vertically centered single column** — drops the two-column image split
- Max content width: `max-w-3xl` centered
- Minimum height: `100dvh` (full viewport)
- Content stacked vertically with generous spacing

### Background

- **Three large animated gradient orbs** positioned at different corners, rotating slowly with scale pulses:
  - Top-right: `violet-600 → purple-700`, `w-[700px] h-[700px]`, `blur-[120px]`
  - Bottom-left: `indigo-700 → violet-800`, `w-[600px] h-[600px]`, `blur-[100px]`
  - Center: `purple-600 → pink-600/20`, `w-[400px] h-[400px]`, `blur-[80px]`, lower opacity — adds warmth
- Noise texture overlay at `opacity-[0.04]` (existing pattern, keep URL)
- Light mode: orbs at `opacity-[0.35]`, `mix-blend-multiply`
- Dark mode: orbs at `opacity-[0.5]`, `mix-blend-screen`
- Section bg: `bg-[#fafafa] dark:bg-slate-950` (unchanged from current)

### Content Stack (center-aligned)

1. **Animated badge pill** — keep exactly as current (Sparkle icon + "Trusted by 50,000+ learners")
2. **Headline** — two lines:
   - Line 1: `Master English` — `text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black`
   - Line 2: `<Typewriter />` in gradient text — same words, same animation, same gradient
   - Tighter line-height: `leading-[1.0]`
3. **Subtext** — single line, shortened to ~60 chars: "AI-powered lessons, expert tutors, and real results — at your pace."
   - `text-lg md:text-xl text-gray-500 dark:text-gray-400`
4. **CTA row** — same two buttons (Start Learning Free + Watch Demo), `flex-row` always, centered
5. **Social proof row** — avatar stack + stars + rating text, centered, keep existing markup

### Floating Accent Cards

Two glassmorphism cards repositioned for depth effect:
- **Card 1** ("1,000+ Hrs / Course Content") — `absolute`, positioned upper-left of content area, `top-[20%] left-[8%]` on large screens, hidden on mobile
- **Card 2** ("24/7 AI Tutor / Instant Help") — `absolute`, positioned lower-right, `bottom-[20%] right-[8%]` on large screens, hidden on mobile
- Both use existing glass styles: `bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl`
- Both keep existing floating animation

### Scroll Indicator

- `absolute bottom-8 left-1/2 -translate-x-1/2`
- Animated chevron-down icon (Phosphor `CaretDown`) with `animate-bounce`
- `text-gray-400 dark:text-gray-600`, hidden on mobile

---

## Removed

- Stock photo image (`<img>` of girl with book) — removed entirely
- Right column / grid layout — replaced with centered single column
- Decorative rotating circle borders around image

---

## Preserved

- Typewriter component — unchanged
- Badge pill — unchanged
- CTA buttons — unchanged
- Social proof — unchanged
- Two floating stat cards — repositioned, same content and styles
- Section background color tokens — unchanged
- All Framer Motion entrance animations — unchanged
- Responsive behavior — content stacks vertically on all screen sizes (it's already single column)

---

## Non-Goals

- No new components
- No new dependencies
- No changes to other sections
- No change to the color scheme
