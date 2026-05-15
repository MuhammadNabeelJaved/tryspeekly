# Hero Right Section — Live Classroom Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hero section's right-side dashboard cards with an animated "Live Classroom" scene — glassmorphism session card with animated sound waves, AI score bar, blinking timer, 4 floating badges, and a breathing glow orb.

**Architecture:** All changes isolated to one file: `client/src/components/Hero.tsx`. Four sub-components (`SoundWave`, `TimerColon`, `LessonDot`, `FloatingBadge`) are defined above the main export in the same file. Floating badges are positioned in the outer column div (outside the `overflow-hidden` dark container) so they can visually overflow the card edges.

**Tech Stack:** React 18, TypeScript, framer-motion v12 (already installed), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-05-16-hero-right-section-animation-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `client/src/components/Hero.tsx` | Modify | Add 4 sub-components + constants above `Hero`; replace entire right-panel JSX; update imports |
| `client/src/components/Hero.test.tsx` | Create | Render tests for new right-panel text content |

---

### Task 1: Write failing tests

**Files:**
- Create: `client/src/components/Hero.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
// client/src/components/Hero.test.tsx
import { render, screen } from '@testing-library/react'
import Hero from './Hero'

// globals: true in vitest.config.ts — no need to import describe/it/expect
// @testing-library/jest-dom is loaded via src/test/setup.ts

describe('Hero — Live Classroom scene', () => {
  it('renders the live session course name', () => {
    render(<Hero />)
    expect(screen.getByText('IELTS Speaking Practice')).toBeInTheDocument()
  })

  it('renders AI fluency score label', () => {
    render(<Hero />)
    expect(screen.getByText(/AI Fluency Score/i)).toBeInTheDocument()
  })

  it('renders the active lesson with TODAY badge', () => {
    render(<Hero />)
    expect(screen.getByText('Speaking Module')).toBeInTheDocument()
    expect(screen.getByText('TODAY')).toBeInTheDocument()
  })

  it('renders the 50K+ learners floating badge', () => {
    render(<Hero />)
    expect(screen.getByText('50K+')).toBeInTheDocument()
  })

  it('renders left-side CTAs unchanged', () => {
    render(<Hero />)
    expect(screen.getByText('Start Learning')).toBeInTheDocument()
    expect(screen.getByText('Watch Demo')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd "E:\Nabeel Javed\Web Portfolios\English Website\client" && npx vitest run src/components/Hero.test.tsx --reporter verbose
```

Expected: 4 tests FAIL (new content not yet in Hero.tsx). "Start Learning" and "Watch Demo" may already pass — that is fine.

---

### Task 2: Add constants and sub-components

**Files:**
- Modify: `client/src/components/Hero.tsx`

These go **above** the `export default function Hero()` declaration.

- [ ] **Step 1: Update the import block at the top of Hero.tsx**

Replace:
```tsx
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star, GraduationCap, Trophy } from '@phosphor-icons/react'
```

With:
```tsx
import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star } from '@phosphor-icons/react'
```

(`GraduationCap` and `Trophy` are replaced by emoji in the new badges. `ReactNode` is needed for `FloatingBadge`'s `children` prop.)

- [ ] **Step 2: Replace the existing constants block**

Find and delete the current `AVATARS` and `LESSONS` constant declarations. Replace with:

```tsx
const WAVE_BARS = [
  { minH: 3, maxH: 14, dur: 0.6, delay: 0 },
  { minH: 5, maxH: 18, dur: 0.5, delay: 0.1 },
  { minH: 3, maxH: 10, dur: 0.7, delay: 0.05 },
  { minH: 7, maxH: 20, dur: 0.4, delay: 0.15 },
  { minH: 4, maxH: 14, dur: 0.6, delay: 0.2 },
  { minH: 2, maxH: 9,  dur: 0.8, delay: 0.08 },
] as const

const LESSONS_LIVE = [
  { label: 'Reading Comprehension', status: 'done'    as const },
  { label: 'Listening Practice',    status: 'done'    as const },
  { label: 'Speaking Module',       status: 'active'  as const },
  { label: 'Writing Task 2',        status: 'pending' as const },
]

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&q=80',
]
```

(`AVATARS` is kept — still used by the left-side social proof avatars.)

- [ ] **Step 3: Add SoundWave sub-component**

Paste this immediately after the constants, before `export default function Hero()`:

```tsx
function SoundWave() {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-[3px]">
      {WAVE_BARS.map((bar, i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-violet-400 rounded-full"
          style={{ height: bar.minH }}
          animate={{ height: [bar.minH, bar.maxH, bar.minH] }}
          transition={{ duration: bar.dur, delay: bar.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Add TimerColon sub-component**

```tsx
function TimerColon() {
  return (
    <motion.span
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="mx-[1px]"
    >
      :
    </motion.span>
  )
}
```

- [ ] **Step 5: Add LessonDot sub-component**

```tsx
function LessonDot({ status }: { status: 'done' | 'active' | 'pending' }) {
  if (status === 'done') {
    return <div className="w-[7px] h-[7px] rounded-full bg-violet-600 flex-shrink-0" />
  }
  if (status === 'active') {
    return (
      <motion.div
        className="w-[7px] h-[7px] rounded-full bg-violet-400 flex-shrink-0"
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    )
  }
  return <div className="w-[7px] h-[7px] rounded-full bg-white/10 flex-shrink-0" />
}
```

- [ ] **Step 6: Add FloatingBadge sub-component**

```tsx
function FloatingBadge({
  children,
  delay,
  floatDur,
  floatDelay,
  className = '',
}: {
  children: ReactNode
  delay: number
  floatDur: number
  floatDelay: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'backOut' }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: floatDur, delay: floatDelay, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl px-3 py-2.5"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
```

---

### Task 3: Replace the right-panel JSX

**Files:**
- Modify: `client/src/components/Hero.tsx`

- [ ] **Step 1: Locate the right panel**

In `Hero.tsx`, find this comment:
```
{/* ── RIGHT: Dashboard card composition ── */}
```

Delete everything from that `<div>` opening tag through its closing `</div>` — this is the entire right column block (currently ~175 lines).

- [ ] **Step 2: Paste the new right panel**

In its place, insert:

```tsx
{/* ── RIGHT: Live Classroom Scene ── */}
<div className="relative flex items-center justify-center order-1 lg:order-2 py-10 lg:py-0 min-h-[500px]">

  {/* Dark scene container — overflow-hidden keeps glow inside */}
  <div className="relative w-full max-w-[300px] mx-auto rounded-3xl bg-neutral-950 overflow-hidden p-6 min-h-[440px] flex items-center justify-center">

    {/* Breathing glow orb */}
    <motion.div
      animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 65%)' }}
    />

    {/* Dot grid — top right */}
    <div
      className="absolute top-6 right-6 w-24 h-24 opacity-40 pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }}
    />
    {/* Dot grid — bottom left */}
    <div
      className="absolute bottom-6 left-6 w-16 h-16 opacity-25 pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }}
    />

    {/* ── Main glassmorphism card ── */}
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
      className="relative z-10 w-full"
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[9px] text-neutral-400 font-bold tracking-[1.5px] uppercase mb-1">
            Live Session
          </p>
          <h3 className="text-[13px] font-extrabold text-white leading-tight">
            IELTS Speaking Practice
          </h3>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] text-red-400 font-bold tracking-wide">REC</span>
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Instructor tile — speaking */}
        <div
          className="relative rounded-2xl h-[72px] flex items-center justify-center overflow-hidden"
          style={{
            background: 'rgba(124,58,237,0.25)',
            border: '2px solid rgba(124,58,237,0.6)',
            boxShadow: '0 0 16px rgba(124,58,237,0.3)',
          }}
        >
          <span className="absolute top-1.5 left-2 text-[8px] text-violet-300 font-bold">
            Speaking
          </span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            S
          </div>
          <SoundWave />
        </div>

        {/* Student tile — listening */}
        <div
          className="relative rounded-2xl h-[72px] flex items-center justify-center"
          style={{ background: 'rgba(30,27,60,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}
          >
            A
          </div>
        </div>
      </div>

      {/* Timer row */}
      <div className="flex justify-center mb-4">
        <div
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
        >
          <span className="text-[12px]">⏱</span>
          <span className="text-[15px] font-extrabold text-violet-300 tabular-nums flex items-center">
            12<TimerColon />45
          </span>
          <span className="text-[9px] text-neutral-500">remaining</span>
        </div>
      </div>

      {/* AI Fluency Score */}
      <div
        className="mb-3 rounded-2xl p-3"
        style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-neutral-400 font-semibold">✦ AI Fluency Score</span>
          <span className="text-[13px] font-black text-violet-300">8.2 / 9.0</span>
        </div>
        <div
          className="h-[5px] rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '82%' }}
            transition={{ delay: 1.2, duration: 1.3, ease: 'easeOut' }}
            className="h-full rounded-full relative overflow-hidden"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)' }}
          >
            {/* Shimmer overlay — translates across after bar fills */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, delay: 2.7, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)' }}
            />
          </motion.div>
        </div>
      </div>

      {/* Lesson list */}
      <div>
        {LESSONS_LIVE.map((lesson, i) => (
          <div
            key={lesson.label}
            className="flex items-center gap-2 py-2"
            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : undefined }}
          >
            <LessonDot status={lesson.status} />
            <span className={`text-[10px] flex-1 leading-tight ${
              lesson.status === 'done'
                ? 'line-through text-neutral-600'
                : lesson.status === 'active'
                ? 'text-violet-200 font-bold'
                : 'text-neutral-700'
            }`}>
              {lesson.label}
            </span>
            {lesson.status === 'active' && (
              <span
                className="text-[8px] font-bold text-violet-400 px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.2)' }}
              >
                TODAY
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  </div>

  {/* ── Floating badges — outside the dark container so they can overflow ── */}

  {/* Rating — top right */}
  <FloatingBadge delay={0.8} floatDur={3.5} floatDelay={1.5} className="absolute top-[6%] right-[4%] sm:right-[8%] lg:right-[2%] z-20">
    <div className="text-center">
      <p className="text-[8px] text-neutral-400 uppercase tracking-wider mb-0.5">Avg Score</p>
      <p className="text-lg font-black text-yellow-400">4.9 ★</p>
      <p className="text-[8px] text-neutral-500">1,200+ Reviews</p>
    </div>
  </FloatingBadge>

  {/* Learners — bottom left */}
  <FloatingBadge delay={1.1} floatDur={3.8} floatDelay={2.0} className="absolute bottom-[6%] left-[4%] sm:left-[8%] lg:left-[2%] z-20">
    <div className="flex items-center gap-2">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: 'rgba(124,58,237,0.25)' }}
      >
        🎓
      </div>
      <div>
        <p className="text-[13px] font-black text-white">50K+</p>
        <p className="text-[8px] text-neutral-500 uppercase tracking-wider">Learners</p>
      </div>
    </div>
  </FloatingBadge>

  {/* Certificate — mid right */}
  <FloatingBadge
    delay={1.4}
    floatDur={3.2}
    floatDelay={1.8}
    className="absolute top-[48%] right-[2%] lg:right-[-2%] -translate-y-1/2 z-20 hidden sm:block"
  >
    <div className="flex items-center gap-2">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: 'rgba(251,191,36,0.15)' }}
      >
        🏆
      </div>
      <div>
        <p className="text-[11px] font-bold text-white">Certificate</p>
        <p className="text-[8px] text-neutral-500 uppercase tracking-wider">Awarded</p>
      </div>
    </div>
  </FloatingBadge>

  {/* Band score — top left */}
  <FloatingBadge delay={1.6} floatDur={4.0} floatDelay={2.2} className="absolute top-[20%] left-[2%] lg:left-[-2%] z-20">
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-emerald-400 font-black text-sm">↑</span>
        <span className="text-[11px] font-extrabold text-emerald-400">+1.5 Band</span>
      </div>
      <p className="text-[8px] text-neutral-500">Score improved</p>
    </div>
  </FloatingBadge>

</div>
```

---

### Task 4: TypeScript check + tests green

**Files:**
- Modify: `client/src/components/Hero.tsx` (verify no unused vars remain)

- [ ] **Step 1: Verify TypeScript compiles cleanly**

```bash
cd "E:\Nabeel Javed\Web Portfolios\English Website\client" && npx tsc --noEmit
```

Expected: No output (zero errors). If you see `'GraduationCap' is declared but its value is never read` — the import update in Task 2 Step 1 was not saved correctly. Re-check the import line.

- [ ] **Step 2: Run tests**

```bash
cd "E:\Nabeel Javed\Web Portfolios\English Website\client" && npx vitest run src/components/Hero.test.tsx --reporter verbose
```

Expected:
```
✓ Hero — Live Classroom scene > renders the live session course name
✓ Hero — Live Classroom scene > renders AI fluency score label
✓ Hero — Live Classroom scene > renders the active lesson with TODAY badge
✓ Hero — Live Classroom scene > renders the 50K+ learners floating badge
✓ Hero — Live Classroom scene > renders left-side CTAs unchanged

Test Files  1 passed (1)
Tests       5 passed (5)
```

If `renders AI fluency score label` fails: the `✦` character in `✦ AI Fluency Score` might be causing a regex mismatch. In Hero.tsx the text is `✦ AI Fluency Score` — the test uses `/AI Fluency Score/i` which matches the substring, so the `✦` is irrelevant. If it still fails, check that the span text is not split across child elements.

- [ ] **Step 3: Visual check in browser**

```bash
cd "E:\Nabeel Javed\Web Portfolios\English Website\client" && npm run dev
```

Open http://localhost:5173. Check:

| What to verify | Expected |
|----------------|----------|
| Dark rounded container on right | Visible, `rounded-3xl`, `bg-neutral-950` |
| Glow orb | Purple radial glow breathing in/out |
| Sound wave bars | 6 bars animating at different heights + speeds |
| REC dot | Red, pulsing via `animate-pulse` |
| Score bar | Slides in ~1.2s after page load, then shimmer sweeps across |
| Timer colon | Blinks every second |
| Active lesson dot | Violet, scale-pulse animation |
| Floating badges | Pop in with spring bounce, then gently float up/down |
| Light mode | Dark container contrasts against white hero background |
| Dark mode | Dark container blends, glows pop |
| Mobile (`< 1024px`) | Scene stacks above text, centered, max-width 300px |
| Tablet (`sm:` 640px+) | Certificate badge becomes visible |

---

### Task 5: Commit

- [ ] **Step 1: Stage and commit**

```bash
cd "E:\Nabeel Javed\Web Portfolios\English Website"
git add client/src/components/Hero.tsx client/src/components/Hero.test.tsx
git commit -m "$(cat <<'EOF'
feat: replace hero right section with animated live classroom scene

- Add SoundWave, TimerColon, LessonDot, FloatingBadge sub-components
- Replace static dashboard card with glassmorphism live session card
- Animate sound wave bars, score bar fill + shimmer, timer colon blink
- Add 4 floating badges with staggered spring entrance and y-float loop
- Add breathing glow orb background element
- Remove unused GraduationCap and Trophy icon imports

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected:
```
[main xxxxxxx] feat: replace hero right section with animated live classroom scene
 2 files changed, ...
```
