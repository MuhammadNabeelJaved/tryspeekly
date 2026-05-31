# For Every Age Group Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `ForEveryAge` section to the home page showing 6 age-group cards (Kids → Seniors) with staggered scroll-triggered animations.

**Architecture:** One new component `ForEveryAge.tsx` following existing patterns (Stats.tsx / HowItWorks.tsx). Section header matches existing badge + gradient-heading style. Cards use a `containerVariants` + `cardVariants` stagger driven by `useInView`. Component inserted into `Home.tsx` after `<Stats />`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion (`motion`, `useInView`), `@phosphor-icons/react` (badge dot only — no extra icons needed)

---

## File Map

| Action | Path |
|--------|------|
| **Create** | `client/src/components/ForEveryAge.tsx` |
| **Modify** | `client/src/pages/Home.tsx` |

---

### Task 1: Create `ForEveryAge.tsx` component

**Files:**
- Create: `client/src/components/ForEveryAge.tsx`

- [ ] **Step 1: Create the file with full implementation**

Create `client/src/components/ForEveryAge.tsx` with the following content:

```tsx
import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'

// ─── Age Group Data ────────────────────────────────────────────────────────────

const AGE_GROUPS = [
  {
    emoji: '🧒',
    range: 'Ages 5–12',
    title: 'Young Learners',
    description: 'Fun, games-based English to build a strong foundation early.',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    pill: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    glow: 'hover:shadow-[0_8px_30px_rgba(124,58,237,0.18)] hover:border-violet-300 dark:hover:border-violet-700',
  },
  {
    emoji: '🎒',
    range: 'Ages 13–17',
    title: 'Teenagers',
    description: 'School support and exam prep for O/A levels and IELTS Junior.',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    pill: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    glow: 'hover:shadow-[0_8px_30px_rgba(59,130,246,0.18)] hover:border-blue-300 dark:hover:border-blue-700',
  },
  {
    emoji: '🎓',
    range: 'Ages 18–25',
    title: 'Young Adults',
    description: 'University essays, interviews, and career launchpad skills.',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    pill: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    glow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.18)] hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  {
    emoji: '💼',
    range: 'Ages 26–45',
    title: 'Professionals',
    description: 'Business English, presentations, and workplace confidence.',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    pill: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    glow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.18)] hover:border-amber-300 dark:hover:border-amber-700',
  },
  {
    emoji: '🏡',
    range: 'Ages 46–60',
    title: 'Adults',
    description: 'Everyday communication, confidence, and social skills.',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    pill: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    glow: 'hover:shadow-[0_8px_30px_rgba(244,63,94,0.18)] hover:border-rose-300 dark:hover:border-rose-700',
  },
  {
    emoji: '🌟',
    range: 'Ages 60+',
    title: 'Seniors',
    description: 'Travel, leisure, and connecting with the wider world.',
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    pill: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    glow: 'hover:shadow-[0_8px_30px_rgba(6,182,212,0.18)] hover:border-cyan-300 dark:hover:border-cyan-700',
  },
]

// ─── Animation Variants ────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ForEveryAge() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-gray-50 dark:bg-neutral-950 py-16 lg:py-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-300 text-sm font-semibold mb-5"
          >
            <span className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full" />
            Built For Everyone
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight max-w-3xl mx-auto"
          >
            English For{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 drop-shadow-[0_0_8px_rgba(124,58,237,0.2)] dark:drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]">
              Every Age
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="mt-4 text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto"
          >
            From curious kids to seasoned professionals — we meet every learner where they are.
          </motion.p>
        </div>

        {/* Age group cards */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5"
        >
          {AGE_GROUPS.map((group) => (
            <motion.div
              key={group.title}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className={[
                'relative rounded-2xl border border-gray-200 dark:border-neutral-800',
                'p-5 sm:p-6 flex flex-col items-center text-center',
                'transition-all duration-300 cursor-default',
                group.bg,
                group.glow,
              ].join(' ')}
            >
              <span
                className="text-5xl mb-4 leading-none"
                role="img"
                aria-label={group.title}
              >
                {group.emoji}
              </span>

              <span
                className={[
                  'text-[11px] font-bold uppercase tracking-wider',
                  'px-3 py-1 rounded-full mb-3',
                  group.pill,
                ].join(' ')}
              >
                {group.range}
              </span>

              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mb-2 leading-snug">
                {group.title}
              </h3>

              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {group.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles with no errors**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ForEveryAge.tsx
git commit -m "feat: add ForEveryAge section component with staggered age group cards"
```

---

### Task 2: Wire component into Home page

**Files:**
- Modify: `client/src/pages/Home.tsx`

- [ ] **Step 1: Add import to Home.tsx**

In `client/src/pages/Home.tsx`, add this import after the `Stats` import line:

```tsx
import ForEveryAge from '@/components/ForEveryAge'
```

- [ ] **Step 2: Insert component after `<Stats />`**

In the JSX, insert `<ForEveryAge />` immediately after the `<Stats />` motion wrapper:

```tsx
<motion.div variants={sectionVariants}><Stats /></motion.div>
<motion.div variants={sectionVariants}><ForEveryAge /></motion.div>
<motion.div variants={sectionVariants}><HomeCourses /></motion.div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Start dev server and verify visually**

```bash
cd client && npm run dev
```

Open `http://localhost:5173` in the browser. Scroll past the Stats section and confirm:
- Section heading "English For **Every Age**" appears with violet gradient on "Every Age"
- 6 cards render in a 2-col (mobile) / 3-col (desktop) grid
- Cards animate in (stagger up + fade) on scroll
- Each card has correct emoji, colored pill badge, title, and description
- Hovering a card lifts it slightly (`y: -4`) with a matching color glow shadow
- Dark mode toggle works — cards invert to dark tints correctly

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: insert ForEveryAge section into home page after Stats"
```
