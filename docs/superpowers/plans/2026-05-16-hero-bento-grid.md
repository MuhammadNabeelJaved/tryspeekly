# Hero Bento Grid + Background Slideshow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the right side of `Hero.tsx` with a 6-card Bento Grid layered over a full-bleed auto-changing background slideshow.

**Architecture:** A single `relative` container holds two layers — `BackgroundSlideshow` (absolute, behind) and `BentoGrid` (relative z-10, in front). The grid uses CSS Grid with explicit `col-start`/`row-start` placement. All components are defined in `Hero.tsx` with no new files.

**Tech Stack:** React + TypeScript, Framer Motion (`motion`, `AnimatePresence`), Tailwind CSS, Vitest + React Testing Library

---

## Files

| File | Action |
|------|--------|
| `client/src/components/Hero.tsx` | Modify — replace right section, remove unused components |
| `client/src/components/Hero.test.tsx` | Modify — replace stale tests with new bento grid tests |

---

## Task 1: Update Hero.test.tsx with failing tests

**Files:**
- Modify: `client/src/components/Hero.test.tsx`

- [ ] **Step 1: Replace the entire Hero.test.tsx with new tests**

These tests will fail until implementation is complete (old tests reference removed components).

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero, { getTimeUntilNextClass } from './Hero'

describe('Hero — Bento Grid', () => {
  it('renders left-side CTAs unchanged', () => {
    render(<Hero />)
    expect(screen.getByText('Start Learning')).toBeInTheDocument()
    expect(screen.getByText('Watch Demo')).toBeInTheDocument()
  })

  it('renders IELTS Speaking Practice in Next Class card', () => {
    render(<Hero />)
    expect(screen.getByText('IELTS Speaking Practice')).toBeInTheDocument()
  })

  it('renders LIVE badge', () => {
    render(<Hero />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('renders rating card', () => {
    render(<Hero />)
    expect(screen.getByText('4.9')).toBeInTheDocument()
    expect(screen.getByText(/1,200\+/)).toBeInTheDocument()
  })

  it('renders streak card', () => {
    render(<Hero />)
    expect(screen.getByText(/7-Day Streak/i)).toBeInTheDocument()
  })

  it('renders certificate card', () => {
    render(<Hero />)
    expect(screen.getByText(/Certificate/i)).toBeInTheDocument()
  })

  it('renders speaking progress card', () => {
    render(<Hero />)
    expect(screen.getByText(/Speaking Progress/i)).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('renders 50K+ learners card', () => {
    render(<Hero />)
    expect(screen.getByText('50K+')).toBeInTheDocument()
  })
})

describe('getTimeUntilNextClass', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns correct hours/minutes/seconds when class is in the future', () => {
    vi.setSystemTime(new Date('2026-05-16T14:00:00'))
    const result = getTimeUntilNextClass()
    expect(result.h).toBe(4)
    expect(result.m).toBe(0)
    expect(result.s).toBe(0)
  })

  it('rolls over to next day when 6PM has already passed', () => {
    vi.setSystemTime(new Date('2026-05-16T19:00:00')) // 7 PM — past 6 PM
    const result = getTimeUntilNextClass()
    expect(result.h).toBe(23)
    expect(result.m).toBe(0)
    expect(result.s).toBe(0)
  })

  it('returns all-zero values at exactly 6PM', () => {
    vi.setSystemTime(new Date('2026-05-16T18:00:00'))
    const result = getTimeUntilNextClass()
    expect(result.h).toBe(0)
    expect(result.m).toBe(0)
    expect(result.s).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd client && npx vitest run src/components/Hero.test.tsx
```

Expected: Multiple failures — `getTimeUntilNextClass` not exported, bento grid elements not in DOM.

---

## Task 2: Clean up Hero.tsx — remove unused components and update imports

**Files:**
- Modify: `client/src/components/Hero.tsx`

- [ ] **Step 1: Replace the entire top of the file (imports + old constants + unused components)**

Replace everything from line 1 through the closing `}` of `ImageSlider` (line 356) with:

```tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'

// ─── Variants (left side — unchanged) ─────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&q=80',
]

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
]

const CARD_STYLE: CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.11)',
}

const pad = (n: number) => String(n).padStart(2, '0')
```

- [ ] **Step 2: Commit clean slate**

```bash
git add client/src/components/Hero.tsx client/src/components/Hero.test.tsx
git commit -m "refactor: remove unused hero components, add bento grid constants"
```

---

## Task 3: Export getTimeUntilNextClass + add BackgroundSlideshow

**Files:**
- Modify: `client/src/components/Hero.tsx`

- [ ] **Step 1: Add `getTimeUntilNextClass` as named export immediately after the constants**

```tsx
// ─── Countdown utility ──────────────────────────────────────────────────────────

export function getTimeUntilNextClass(): { h: number; m: number; s: number } {
  const now = new Date()
  const target = new Date()
  target.setHours(18, 0, 0, 0)
  if (now >= target) target.setDate(target.getDate() + 1)
  const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
  return {
    h: Math.floor(diff / 3600),
    m: Math.floor((diff % 3600) / 60),
    s: diff % 60,
  }
}
```

- [ ] **Step 2: Add BackgroundSlideshow component after the countdown utility**

```tsx
// ─── BackgroundSlideshow ────────────────────────────────────────────────────────

function BackgroundSlideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent(prev => (prev + 1) % BG_IMAGES.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl">
      <AnimatePresence mode="sync">
        <motion.img
          key={current}
          src={BG_IMAGES[current]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.08 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.8 },
            scale: { duration: 5, ease: 'linear' },
          }}
        />
      </AnimatePresence>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.62) 50%, rgba(10,10,10,0.80) 100%)',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Run countdown unit tests — they should pass now**

```bash
cd client && npx vitest run src/components/Hero.test.tsx
```

Expected: `getTimeUntilNextClass` describe block — 3 PASS. Hero bento grid tests — still FAIL (components not yet rendered).

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Hero.tsx
git commit -m "feat: add getTimeUntilNextClass utility and BackgroundSlideshow component"
```

---

## Task 4: Add NextClassCard

**Files:**
- Modify: `client/src/components/Hero.tsx`

- [ ] **Step 1: Add NextClassCard after BackgroundSlideshow**

```tsx
// ─── NextClassCard ──────────────────────────────────────────────────────────────

function NextClassCard() {
  const [time, setTime] = useState(getTimeUntilNextClass())

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeUntilNextClass()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
      className="col-start-1 col-end-3 row-start-1 row-end-3 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
      style={CARD_STYLE}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col h-full gap-3"
      >
        {/* LIVE badge */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live</span>
        </div>

        {/* Class info */}
        <div className="flex-1 flex flex-col justify-end gap-2">
          <p className="text-[10px] text-white/50 uppercase tracking-wider">📅 Next Live Class</p>
          <p className="text-lg font-black text-white leading-tight">IELTS Speaking Practice</p>
          <p className="text-[11px] text-white/60">Today · 6:00 PM</p>

          {/* Countdown */}
          <div
            className="rounded-xl px-3 py-2.5 mt-1"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <p className="text-[9px] text-violet-300 uppercase tracking-wider mb-1">Starts in</p>
            <div className="flex items-center gap-0.5 font-mono text-2xl font-black text-white">
              <span>{pad(time.h)}</span>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-violet-400"
              >:</motion.span>
              <span>{pad(time.m)}</span>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-violet-400"
              >:</motion.span>
              <span>{pad(time.s)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/Hero.tsx
git commit -m "feat: add NextClassCard with live countdown timer"
```

---

## Task 5: Add RatingCard, StreakCard, CertificateCard, LearnersCard

**Files:**
- Modify: `client/src/components/Hero.tsx`

- [ ] **Step 1: Add the four small cards after NextClassCard**

```tsx
// ─── Small bento cards ──────────────────────────────────────────────────────────

function RatingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
      className="col-start-3 row-start-1 rounded-2xl p-4 flex flex-col justify-center gap-1"
      style={CARD_STYLE}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={10} weight="fill" className="text-yellow-400" />
          ))}
        </div>
        <p className="text-xl font-black text-white">4.9</p>
        <p className="text-[10px] text-white/50">1,200+ Reviews</p>
      </motion.div>
    </motion.div>
  )
}

function StreakCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
      className="col-start-3 row-start-2 rounded-2xl p-4 flex flex-col justify-center gap-1"
      style={CARD_STYLE}
    >
      <span className="text-xl">🏆</span>
      <p className="text-sm font-bold text-white leading-tight">7-Day Streak</p>
      <p className="text-[10px] text-white/50">Speaking Master</p>
    </motion.div>
  )
}

function CertificateCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.5, ease: 'easeOut' }}
      className="col-start-3 row-start-3 rounded-2xl p-4 flex flex-col justify-center gap-1"
      style={CARD_STYLE}
    >
      <span className="text-xl">✦</span>
      <p className="text-sm font-bold text-white leading-tight">Certificate</p>
      <p className="text-[10px] text-white/50">Awarded</p>
    </motion.div>
  )
}

function LearnersCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.95, duration: 0.5, ease: 'easeOut' }}
      className="col-start-2 row-start-3 rounded-2xl p-4 flex flex-col justify-center gap-1"
      style={CARD_STYLE}
    >
      <span className="text-xl">🎓</span>
      <p className="text-xl font-black text-white">50K+</p>
      <p className="text-[10px] text-white/50">Learners</p>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/Hero.tsx
git commit -m "feat: add RatingCard, StreakCard, CertificateCard, LearnersCard"
```

---

## Task 6: Add ProgressCard

**Files:**
- Modify: `client/src/components/Hero.tsx`

- [ ] **Step 1: Add ProgressCard after the four small cards**

```tsx
// ─── ProgressCard ───────────────────────────────────────────────────────────────

function ProgressCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
      className="col-start-1 row-start-3 rounded-2xl p-4 flex flex-col justify-center gap-2 overflow-hidden"
      style={CARD_STYLE}
    >
      <p className="text-[10px] text-white/50 uppercase tracking-wider">Speaking Progress</p>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        {/* Fill bar */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}
          initial={{ width: '0%' }}
          animate={{ width: '82%' }}
          transition={{ delay: 1.0, duration: 1.4, ease: 'easeOut' }}
        />
        {/* Shimmer */}
        <motion.div
          className="absolute top-0 h-full w-[50px] rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)' }}
          animate={{ x: [-50, 220] }}
          transition={{ delay: 2.5, duration: 1.8, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
        />
      </div>
      <p className="text-right text-sm font-black text-violet-300">82%</p>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/Hero.tsx
git commit -m "feat: add ProgressCard with animated fill and shimmer"
```

---

## Task 7: Add BentoGrid + wire up right section

**Files:**
- Modify: `client/src/components/Hero.tsx`

- [ ] **Step 1: Add BentoGrid component after ProgressCard**

```tsx
// ─── BentoGrid ──────────────────────────────────────────────────────────────────

function BentoGrid() {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-3 w-full h-full">
      <NextClassCard />
      <RatingCard />
      <StreakCard />
      <ProgressCard />
      <LearnersCard />
      <CertificateCard />
    </div>
  )
}
```

- [ ] **Step 2: Replace the right section inside `Hero()` default export**

Find the comment `{/* ── RIGHT: Image Slider ── */}` and replace the entire right column div with:

```tsx
{/* ── RIGHT: Bento Grid ── */}
<div className="relative flex items-center justify-center order-1 lg:order-2 min-h-[calc(100dvh-80px)] py-8 lg:py-0">
  <div className="relative rounded-3xl overflow-hidden w-full max-w-[440px] h-[520px]">
    <BackgroundSlideshow />
    <div className="relative z-10 p-4 h-full">
      <BentoGrid />
    </div>
  </div>
</div>
```

- [ ] **Step 3: Also remove the old left-side gradient fade div** (it was connecting to ImageSlider — no longer needed)

Find and remove this div from the left section:
```tsx
{/* Gradient fade on right edge to connect with slider */}
<div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/90 dark:from-neutral-950/90 to-transparent pointer-events-none" />
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Hero.tsx
git commit -m "feat: add BentoGrid and wire hero right section"
```

---

## Task 8: Run all tests — verify passing

**Files:**
- `client/src/components/Hero.test.tsx`

- [ ] **Step 1: Run the full Hero test suite**

```bash
cd client && npx vitest run src/components/Hero.test.tsx
```

Expected output:
```
✓ Hero — Bento Grid > renders left-side CTAs unchanged
✓ Hero — Bento Grid > renders IELTS Speaking Practice in Next Class card
✓ Hero — Bento Grid > renders LIVE badge
✓ Hero — Bento Grid > renders rating card
✓ Hero — Bento Grid > renders streak card
✓ Hero — Bento Grid > renders certificate card
✓ Hero — Bento Grid > renders speaking progress card
✓ Hero — Bento Grid > renders 50K+ learners card
✓ getTimeUntilNextClass > returns correct hours/minutes/seconds when class is in the future
✓ getTimeUntilNextClass > rolls over to next day when 6PM has already passed
✓ getTimeUntilNextClass > returns all-zero values at exactly 6PM

Test Files  1 passed (1)
Tests       11 passed (11)
```

- [ ] **Step 2: If any test fails, fix the mismatch** (likely a text content difference — update the test string to match exact rendered text)

- [ ] **Step 3: Run the full client test suite to check for regressions**

```bash
cd client && npx vitest run
```

Expected: All previously passing tests still pass.

- [ ] **Step 4: Final commit**

```bash
git add client/src/components/Hero.tsx client/src/components/Hero.test.tsx
git commit -m "feat: hero bento grid with background slideshow complete"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Background: 5-6 images, crossfade, Ken Burns | Task 3 — BackgroundSlideshow |
| Dark gradient overlay | Task 3 — overlay div |
| 6 bento cards with correct grid positions | Tasks 4–6 — individual card components |
| NextClassCard: countdown timer, LIVE badge, float | Task 4 |
| RatingCard: 4.9, 1200+ reviews | Task 5 |
| StreakCard: 7-Day Streak | Task 5 |
| CertificateCard | Task 5 |
| LearnersCard: 50K+ | Task 5 |
| ProgressCard: 0→82% fill + shimmer | Task 6 |
| Staggered entry animations | Tasks 4–6 — per-card delay |
| Float on NextClassCard + RatingCard | Task 4 (NextClass), Task 5 (Rating) |
| Left side unchanged | Task 2 — only right section replaced |
| No new files | All tasks — Hero.tsx only |
| No new libraries | All tasks — Framer Motion + Tailwind only |
