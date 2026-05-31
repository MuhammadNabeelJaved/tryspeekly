# For Every Age Group — Home Page Section

**Date:** 2026-05-31
**Type:** Frontend UI Component
**Scope:** New section added to `client/src/pages/Home.tsx`

---

## Goal

Add a creative, visually rich section to the home page that communicates the platform teaches students of **every age group** — from young children to seniors. The section should feel welcoming, inclusive, and reinforce the platform's broad appeal.

---

## Component

**New file:** `client/src/components/ForEveryAge.tsx`
**Inserted in Home.tsx:** After `<Stats />` and before `<HomeCourses />` (high visibility position)

---

## Section Structure

### Header
- Small badge label: `• Built For Everyone` (violet dot + text, matching existing section badges)
- Main heading: `English For` + `Every Age` (gradient violet text, same gradient as Features/Hero)
- Subtext: *"From curious kids to seasoned professionals — we meet every learner where they are."*

### Cards Grid

Responsive layout: `grid-cols-2` (mobile) → `grid-cols-3` (tablet md+) → `grid-cols-3` with 2 rows (desktop)

6 cards total:

| # | Emoji | Age Range | Title | Description | Accent Color |
|---|-------|-----------|-------|-------------|--------------|
| 1 | 🧒 | Ages 5–12 | Young Learners | Fun, games-based English to build a strong foundation early | Violet |
| 2 | 🎒 | Ages 13–17 | Teenagers | School support, exam prep (O/A levels, IELTS Junior) | Blue |
| 3 | 🎓 | Ages 18–25 | Young Adults | University essays, interviews, and career launchpad | Emerald |
| 4 | 💼 | Ages 26–45 | Professionals | Business English, presentations, and workplace confidence | Amber |
| 5 | 🏡 | Ages 46–60 | Adults | Everyday communication, confidence, and social skills | Rose |
| 6 | 🌟 | Ages 60+ | Seniors | Travel, leisure, and connecting with the wider world | Cyan |

### Each Card Contains
1. **Emoji** — large, centered at top (text-5xl)
2. **Age range pill** — small soft-colored badge (e.g. "Ages 5–12")
3. **Bold title** — e.g. "Young Learners"
4. **1-line description** — muted text, concise
5. **Hover effect** — subtle gradient border glow matching the card's accent color
6. **Background** — very light tint of accent color (`bg-violet-50 dark:bg-violet-950/20` etc.)

---

## Animation

- Section uses `useInView` (Framer Motion) with `once: true, margin: '-80px'`
- Header fades in from bottom on scroll
- Cards stagger in with `delay: index * 0.08` — slide up from y:20 + fade in
- Hover: card lifts slightly (`y: -4`) with shadow increase

---

## Styling Conventions
- Follows existing component patterns (see `Features.tsx`, `Stats.tsx`)
- Uses `@phosphor-icons/react` if any icons needed (emoji used instead for personality)
- Tailwind classes only — no inline styles except for Framer Motion animation values
- Dark mode support via `dark:` variants on all background and text classes
- Section wrapper: `bg-gray-50 dark:bg-neutral-950 py-16 lg:py-24`

---

## File Changes

| File | Change |
|------|--------|
| `client/src/components/ForEveryAge.tsx` | Create new component |
| `client/src/pages/Home.tsx` | Import and insert `<ForEveryAge />` after `<Stats />` |

---

## Out of Scope
- No backend changes
- No routing changes
- No interactivity beyond hover animations (no tabs, no filtering)
