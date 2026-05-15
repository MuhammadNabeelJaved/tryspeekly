# Hero Right Section — Creative Animation Design

**Date:** 2026-05-16
**Status:** Approved
**File:** `client/src/components/Hero.tsx`

---

## Goal

Replace the current static dashboard card composition on the hero's right side with a visually rich "Live Classroom" scene. The scene must communicate the platform's core value proposition — live expert sessions with real-time feedback — through animation rather than static content.

---

## What Changes

Only the right-side panel of `Hero.tsx` changes. The left-side text, CTAs, and social proof remain untouched.

---

## Design: Live Classroom Scene

### Main Card — Live Session

A glassmorphism card (`backdrop-filter: blur(20px)`) on a dark ambient background showing an in-progress IELTS Speaking session.

**Sections inside the card (top to bottom):**

1. **Header row**
   - Left: "LIVE SESSION" label (uppercase, tracking-widest) + course name "IELTS Speaking Practice"
   - Right: Pulsing red "REC" badge — `animate-pulse` on the dot, continuous

2. **Video grid (2 columns)**
   - **Left tile** (instructor — "Speaking" state):
     - Violet border glow, `box-shadow: 0 0 16px rgba(124,58,237,0.3)`
     - Avatar circle with initials "S"
     - "Speaking" micro-label top-left
     - 6 animated sound-wave bars at the bottom — `width: 3px`, heights cycle between `[3, 14]`, `[5, 18]`, `[3, 10]`, `[7, 20]`, `[4, 14]`, `[2, 9]` pixels respectively; durations `0.6, 0.5, 0.7, 0.4, 0.6, 0.8`s; framer-motion `animate` with `repeatType: "reverse"`, `repeat: Infinity`, staggered `delay` per bar (0, 0.1, 0.05, 0.15, 0.2, 0.08s)
   - **Right tile** (student — listening):
     - Dark background, no border highlight
     - Avatar "A" centered, no wave bars

3. **Timer row**
   - Centered chip: `⏱ 12:45 remaining`
   - Colon blinks every second (framer-motion opacity keyframe `[1, 0.3, 1]`, duration 1s, repeat Infinity)

4. **AI Fluency Score box**
   - Label "✦ AI Fluency Score" + value "8.2 / 9.0"
   - Progress bar: animates from `width: 0` → `width: 82%` on mount (delay 1.2s, duration 1.3s, ease easeOut)
   - After fill completes: continuous shimmer via `backgroundPosition` keyframe on a 200%-wide gradient

5. **Lesson list (4 rows)**
   - Reading Comprehension — done (strikethrough, violet dot)
   - Listening Practice — done (strikethrough, violet dot)
   - Speaking Module — **active** (bold white, glowing pulsing dot, "TODAY" chip)
   - Writing Task 2 — pending (muted, hollow dot)

### Floating Badges (4 total)

All badges use `backdrop-filter: blur(16px)` glassmorphism. Each animates in with a spring (`ease: backOut`) at staggered delays, then continuously floats on y-axis (`[0, -8, 0]`, 3–4s period, offset delays so they don't sync).

| Badge | Position | Content | Float period |
|-------|----------|---------|-------------|
| Band Score | Top-left of scene | ↑ +1.5 Band / Score improved (green) | 4.0s |
| Rating | Top-right | ★ 4.9 / 1,200+ Reviews | 3.5s |
| Learners | Bottom-left | 🎓 50K+ Learners | 3.8s |
| Certificate | Bottom-right | 🏆 Certificate / Awarded | 3.2s |

### Background Elements

- **Breathing glow orb:** `radial-gradient(violet → transparent)`, `scale` pulses from 1 → 1.08 over 4s, opacity 0.6 → 1. Created with a single `<div>` — no extra library.
- **Dot grid:** Two `radial-gradient` dot patterns (top-right and bottom-left corners), same as existing, opacity 0.15.

---

## Animation Inventory

| Element | Technique | Trigger |
|---------|-----------|---------|
| Main card entrance | `opacity 0→1, y 32→0`, ease easeOut, 0.4s delay | Mount |
| Sound wave bars | framer-motion `animate` keyframes, staggered | Continuous loop |
| Score bar fill | framer-motion `animate width`, delay 1.2s | Mount |
| Score bar shimmer | CSS `backgroundPosition` keyframe | After fill |
| Floating badges entrance | `scale 0.7→1`, `backOut` ease, staggered | Mount |
| Floating badges float | framer-motion `y` keyframe `[0,-8,0]` | Continuous loop |
| Glow orb breathe | framer-motion `scale + opacity` | Continuous loop |
| Live dot pulse | Tailwind `animate-pulse` | Continuous |
| Timer colon blink | framer-motion `opacity` keyframe | Continuous loop |

---

## Technical Constraints

- **No new libraries** — only framer-motion (already installed) + Tailwind CSS
- **Dark/light mode:** The scene is wrapped in a `rounded-3xl bg-neutral-950` container div inside the right column — it does not override the hero section's `bg-white dark:bg-neutral-950`. On light mode the dark rounded container creates strong contrast with the white hero background. On dark mode it blends seamlessly. The container has `overflow-hidden` so glow orbs don't spill outside.
- **Responsive:** On `lg:` breakpoint scene takes the right 48% column. Below `lg`, it centers at `max-width: 320px` and stacks above the text (same as current `order-1 lg:order-2` pattern).
- **Performance:** All animations use `transform` and `opacity` only — no layout-triggering properties. Sound wave bars use CSS custom properties for per-bar timing so framer-motion variants stay lean.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/Hero.tsx` | Replace right-side panel only — everything from `{/* ── RIGHT ── */}` div to its closing tag |

No new files needed. All animation logic stays inside `Hero.tsx`.

---

## Out of Scope

- Left side text/CTAs — unchanged
- Navigation, other sections
- Backend / API changes
- Dark mode toggle behavior (dark scene is always dark)
