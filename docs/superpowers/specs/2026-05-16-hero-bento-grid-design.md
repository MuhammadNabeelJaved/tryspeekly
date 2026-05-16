# Hero Right Section — Bento Grid + Background Slideshow

**Date:** 2026-05-16
**Status:** Approved
**File:** `client/src/components/Hero.tsx`

---

## Goal

Replace the current `ImageSlider` on the hero's right side with a **Bento Grid** composition layered over a full-bleed auto-changing background slideshow. The design communicates multiple platform value props simultaneously while creating a cinematic, depth-rich visual that outperforms the current single-image slider.

---

## What Changes

Only the right-side panel of `Hero.tsx` changes — everything from the `{/* ── RIGHT ── */}` div to its closing tag. The left-side text, CTAs, and social proof remain untouched.

The existing unused components (`QuizCard`, `AchievementCard`, `AvatarStack`, `SpeakingWave`, `ImageSlider`, `FloatingElement`, `AnimatedWord`, `ProgressRing`, `FloatingBadge`) are all removed — replaced by the new bento grid components defined below.

---

## Layer 1 — Background Slideshow

### Images
5–6 Unsplash images showing the learning experience:
- Students in live sessions
- Teacher explaining on screen
- Student studying with headphones
- Group video call / classroom
- Student celebrating achievement

Use the same Unsplash URL pattern already in the file (`?w=800&q=80`).

### Transition
- **Interval:** 5000ms (`setInterval`)
- **Crossfade:** `AnimatePresence mode="wait"` — outgoing image `opacity 1→0` (0.6s), incoming `opacity 0→1` (0.8s)
- **Ken Burns:** Each image animates `scale: 1 → 1.08` over the full 5s display period via Framer Motion, reset on slide change

### Overlay
Dark gradient over the image to ensure card readability:
```
background: linear-gradient(135deg,
  rgba(10,10,10,0.82) 0%,
  rgba(10,10,10,0.62) 50%,
  rgba(10,10,10,0.80) 100%
)
```
Applied as an `absolute inset-0` div above the image, below the cards.

---

## Layer 2 — Bento Grid

### Grid Structure

```
┌─────────────────────────┬─────────────────┐
│  📅 Next Live Class     │  ⭐ 4.9 Rating  │
│  Today · 6:00 PM        │  1,200+ Reviews │
│  IELTS Speaking         │                 │
│  [● LIVE in 2:45:00]    ├─────────────────┤
│                         │  🏆 7-Day       │
├─────────────┬───────────┤  Streak         │
│  Speaking   │  🎓 50K+  ├─────────────────┤
│  Progress   │  Learners │  ✦ Certificate  │
│  ████ 82%   │           │  Awarded        │
└─────────────┴───────────┴─────────────────┘
```

**CSS Grid:** `grid-cols-3`, explicit row sizing via `grid-row` spans.

### Card Specs

| # | Card | Grid Span | Content |
|---|------|-----------|---------|
| 1 | Next Live Class | col-span-2, row-span-2 | Class name, date/time chip, animated countdown, pulsing LIVE badge |
| 2 | Rating | col-span-1, row-span-1 | ⭐ 4.9 · 1,200+ Reviews |
| 3 | Streak | col-span-1, row-span-1 | 🏆 7-Day Streak · Speaking Master |
| 4 | Certificate | col-span-1, row-span-1 | ✦ Certificate Awarded badge |
| 5 | Speaking Progress | col-span-2, row-span-1 | Label + animated progress bar (0→82%) + shimmer |
| 6 | Learners | col-span-1, row-span-1 | 🎓 50K+ Learners |

### Card Style (all cards)
```css
background: rgba(255, 255, 255, 0.07)
backdrop-filter: blur(20px)
-webkit-backdrop-filter: blur(20px)
border: 1px solid rgba(255, 255, 255, 0.11)
border-radius: 16px (rounded-2xl)
color: white
```
Applied via inline `style` prop (not Tailwind backdrop utilities, for cross-browser reliability).

---

## Animations

### Entry — Staggered mount (one-time)

Each card animates in with `opacity: 0→1, y: 20→0`, `ease: easeOut`, `duration: 0.5s`:

| Card | Delay |
|------|-------|
| Next Live Class | 0.20s |
| Rating | 0.35s |
| Streak | 0.50s |
| Certificate | 0.65s |
| Speaking Progress | 0.80s |
| Learners | 0.95s |

### Continuous loops

| Element | Animation | Spec |
|---------|-----------|------|
| Next Live Class card | Float y | `[0, -6, 0]`, 4.0s, repeat Infinity, ease easeInOut |
| Rating card | Float y | `[0, -5, 0]`, 3.5s, delay 0.8s, repeat Infinity |
| LIVE badge dot | Pulse | Tailwind `animate-pulse` on the red dot |
| Countdown timer | Tick | `setInterval(1000)` — decrements seconds live, MM:SS format |
| Progress bar fill | Mount animation | `width: 0→82%`, delay 1.0s, duration 1.4s, ease easeOut |
| Progress bar shimmer | Loop after fill | `backgroundPosition` keyframe on a 200%-wide gradient, 1.8s loop |
| Background image | Ken Burns | `scale: 1→1.08`, duration 5s, ease linear, per-slide |
| Background image | Crossfade | `opacity 0→1` (0.8s in), `opacity 1→0` (0.6s out), `AnimatePresence` |

---

## Countdown Timer Logic

```ts
// Target: next class at 6:00 PM today
const TARGET_HOUR = 18 // 6 PM
const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })

useEffect(() => {
  const tick = () => {
    const now = new Date()
    const target = new Date()
    target.setHours(TARGET_HOUR, 0, 0, 0)
    if (now > target) target.setDate(target.getDate() + 1)
    const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
    setTimeLeft({
      h: Math.floor(diff / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: diff % 60,
    })
  }
  tick()
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)
}, [])
```

Displayed as `HH:MM:SS` with a colon blink (`opacity: [1, 0.3, 1]`, 1s loop).

---

## Responsive Behavior

- **`lg:` and above:** Right panel takes the 48% column, bento grid fills it
- **Below `lg:`:** Grid centers at `max-w-[340px]`, stacks above left text (`order-1 lg:order-2`) — same as current pattern
- Card font sizes scale down on small screens via `text-xs` / `text-sm`

---

## Performance Constraints

- All animations use `transform` (scale, y) and `opacity` only — no layout-triggering properties
- Background images preloaded via `<link rel="preload">` or eager `<img>` — no flicker on first slide
- `setInterval` for countdown cleaned up in `useEffect` return
- No new libraries — only Framer Motion + Tailwind CSS

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/Hero.tsx` | Replace right-side panel + remove unused components |

No new files. All logic stays inside `Hero.tsx`.

---

## Out of Scope

- Left side text, CTAs, social proof — unchanged
- Navigation, other sections
- Backend / API changes
- Dark mode toggle (scene is always dark — `rounded-3xl overflow-hidden` container)
