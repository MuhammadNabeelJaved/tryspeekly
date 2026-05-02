# Courses Hero Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark-themed hero section in `Courses.tsx` with a clean, minimal, light-theme split-layout hero featuring floating course cards on the right.

**Architecture:** Single file edit — only the `{/* ─── HERO ─── */}` section (lines 231–322) inside `client/src/components/Courses.tsx` is replaced. A small inline `HeroCard` helper component is added above the main `Courses` export. No new files, no new dependencies.

**Tech Stack:** React 18, TypeScript (strict), Tailwind CSS v4, Framer Motion, @phosphor-icons/react

---

## File Map

| File | Action |
|------|--------|
| `client/src/components/Courses.tsx` | Replace lines 231–322 (HERO section) + add `HeroCard` helper above `Courses()` |

---

### Task 1: Add the `HeroCard` inline helper component

This small component renders a single floating course card. It lives above the `Courses` export so the hero JSX stays clean.

**Files:**
- Modify: `client/src/components/Courses.tsx` — add before `export default function Courses()`

- [ ] **Step 1: Insert `HeroCard` component**

Directly above the line `export default function Courses() {` in `client/src/components/Courses.tsx`, insert:

```tsx
function HeroCard({ course }: { course: (typeof COURSES)[0] }) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="px-3 py-1 bg-violet-600 text-white text-[11px] font-bold rounded-lg">
          {course.category}
        </span>
        <div className="flex items-center gap-1">
          <Star size={13} weight="fill" className="text-yellow-400" />
          <span className="text-slate-700 text-xs font-bold">{course.rating}</span>
        </div>
      </div>
      <h4 className="text-slate-900 font-bold text-sm leading-snug mb-3">{course.title}</h4>
      <div className="flex items-center gap-4 text-slate-400 text-xs">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>{course.duration}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={12} />
          <span>{course.students.toLocaleString()} learners</span>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript is happy**

Run: `cd "e:/Nabeel Javed/Web Portfolios/English Website/client" && npx tsc --noEmit`
Expected: No errors.

---

### Task 2: Replace the hero section — background + layout shell

Replace the entire `{/* ─── HERO ─── */}` section (from `<section className="relative overflow-hidden bg-slate-900 ...">` through its closing `</section>`) with the new light hero shell.

**Files:**
- Modify: `client/src/components/Courses.tsx` lines 231–322

- [ ] **Step 1: Replace the hero section**

Delete lines 231–322 (the old dark hero `<section>`) and replace with:

```tsx
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white py-20 lg:py-32">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />

        {/* Violet blob */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-violet-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-20">

            {/* ── Left column ── */}
            <div className="flex-1 lg:max-w-[55%]">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold mb-6"
              >
                <GraduationCap size={16} weight="fill" />
                20+ Expert Courses
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6"
              >
                Explore Our English{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                  Courses
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-slate-500 text-lg max-w-lg leading-relaxed mb-8"
              >
                From beginner basics to IELTS mastery — expert-led courses designed
                to get you speaking confidently, faster.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 mb-10"
              >
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-violet-200 transition-colors"
                >
                  Browse Courses <ArrowRight size={20} weight="bold" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 border border-slate-200 hover:border-violet-300 text-slate-700 hover:text-violet-600 font-semibold px-8 py-4 rounded-2xl transition-colors"
                >
                  <Play size={18} weight="fill" /> Free Trial Class
                </motion.button>
              </motion.div>

              {/* Stats strip */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center gap-x-8 gap-y-3"
              >
                {STATS.map(({ value, label, icon: Icon }, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Icon size={15} weight="fill" className="text-violet-500" />
                    <span className="text-slate-900 font-black text-sm">{value}</span>
                    <span className="text-slate-400 text-xs">{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Right column — floating cards ── */}
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-[300px] h-[260px]"
              >
                {/* Back card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="absolute top-6 -left-10 w-[272px] bg-white border border-slate-100 rounded-2xl shadow-md p-5 -rotate-6 z-0 opacity-70"
                >
                  <HeroCard course={COURSES[0]} />
                </motion.div>

                {/* Middle card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="absolute top-3 left-8 w-[272px] bg-white border border-slate-100 rounded-2xl shadow-lg p-5 rotate-3 z-10 opacity-85"
                >
                  <HeroCard course={COURSES[2]} />
                </motion.div>

                {/* Front card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative w-[272px] bg-white border border-slate-100 rounded-2xl shadow-xl p-5 z-20"
                >
                  <HeroCard course={COURSES[1]} />
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd "e:/Nabeel Javed/Web Portfolios/English Website/client" && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Start dev server and verify visually**

Run: `cd "e:/Nabeel Javed/Web Portfolios/English Website/client" && npm run dev`

Open `http://localhost:5173/courses` and verify:
- White background with soft violet blob top-right
- Faint dot grid visible
- Badge, heading, subtitle, CTAs, stats all visible on left
- 3 stacked floating cards visible on right (desktop)
- Gentle float animation on card stack
- All other sections (courses grid, FAQ, CTA etc.) untouched

- [ ] **Step 4: Check responsive layout**

In browser devtools, check:
- Mobile (375px): single column, cards hidden (`hidden lg:flex`), text centered looks good
- Tablet (768px): single column still, text left-aligned
- Desktop (1280px): split layout, cards beside text

- [ ] **Step 5: Commit**

```bash
git add "client/src/components/Courses.tsx"
git commit -m "feat(courses): redesign hero section with light theme split layout"
```

---

## Self-Review

**Spec coverage:**
- [x] Light theme (white bg) — Task 2
- [x] Soft violet gradient blob top-right — Task 2
- [x] Faint dot grid — Task 2
- [x] Split 60/40 layout — Task 2
- [x] Badge (GraduationCap + "20+ Expert Courses") — Task 2
- [x] Heading with violet gradient "Courses" — Task 2
- [x] Subtitle text — Task 2
- [x] CTA buttons (Browse Courses + Free Trial) — Task 2
- [x] Stats strip (inline, not card grid) — Task 2
- [x] 3 stacked floating cards with rotation — Task 2
- [x] HeroCard helper (category badge, title, rating, duration, learners) — Task 1
- [x] Gentle float animation on card stack — Task 2
- [x] Cards hidden on mobile (`hidden lg:flex`) — Task 2
- [x] Fully responsive — Task 2 Step 4
- [x] No new dependencies — uses existing framer-motion + phosphor-icons

**Placeholder scan:** No TBD/TODO found. All code is complete.

**Type consistency:** `HeroCard` receives `course: (typeof COURSES)[0]` which matches the `COURSES` array defined at the top of the file. `STATS` array (with `icon`, `value`, `label`) is reused from existing data — consistent.
