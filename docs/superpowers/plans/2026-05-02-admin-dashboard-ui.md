# Admin Dashboard UI Improvement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the admin dashboard's visual style with the main EnglishPro website — violet/purple bento cards, ambient blur orbs, pill badges, bold typography, and grouped sidebar nav.

**Architecture:** Pure style changes to two files (`AdminPage.tsx` and `AdminOverview.tsx`). No logic, routing, or data changes. No new dependencies.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3, Framer Motion, Phosphor Icons (`@phosphor-icons/react`)

---

## File Map

| File | Changes |
|---|---|
| `client/src/pages/AdminPage.tsx` | Sidebar: gradient bg, nav type alias, two nav groups with labels, `renderNavItem` helper, pending badges, user profile card |
| `client/src/pages/admin/AdminOverview.tsx` | Ambient orbs, welcome strip, stat card variants (gradient/dark/normal), pill badges on panel headers, thicker progress bars, rotating avatar gradients, country flag emojis |

---

## Task 1: Sidebar Redesign

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

> Pure style changes — no behavior tests to write. Verify visually after each step.

- [ ] **Step 1: Add `NavItem` type alias and split into two nav arrays**

Replace the `NAV_ITEMS` constant (lines 42–52) with:

```ts
type NavItem = { view: AdminView; label: string; Icon: React.FC<{ size?: number; weight?: string; className?: string }> }

const NAV_ANALYTICS: NavItem[] = [
  { view: 'overview',     label: 'Overview',     Icon: ChartBar as NavItem['Icon'] },
  { view: 'students',     label: 'Students',     Icon: Users as NavItem['Icon'] },
  { view: 'instructors',  label: 'Instructors',  Icon: Chalkboard as NavItem['Icon'] },
]

const NAV_MANAGEMENT: NavItem[] = [
  { view: 'courses',        label: 'Courses',       Icon: BookOpen as NavItem['Icon'] },
  { view: 'payments',       label: 'Payments',      Icon: CreditCard as NavItem['Icon'] },
  { view: 'payments-setup', label: 'Pay. Setup',    Icon: Wallet as NavItem['Icon'] },
  { view: 'financial-aid',  label: 'Financial Aid', Icon: Handshake as NavItem['Icon'] },
  { view: 'cms',            label: 'CMS Editor',    Icon: PencilSimple as NavItem['Icon'] },
  { view: 'settings',       label: 'Settings',      Icon: GearSix as NavItem['Icon'] },
]
```

- [ ] **Step 2: Add computed badge counts inside the `AdminPage` component**

Add these two lines at the top of the `AdminPage` component body (right after the state declarations):

```ts
const paymentAlerts = students.filter(s => s.paymentStatus === 'pending' || s.paymentStatus === 'failed').length
const aidPending = financialAidApps.filter(a => a.status === 'pending' || a.status === 'under_review').length
```

- [ ] **Step 3: Add `renderNavItem` helper inside the component**

Add this arrow function inside `AdminPage` (after the computed values above):

```tsx
const renderNavItem = ({ view, label, Icon }: NavItem) => {
  const active = activeView === view
  const badge =
    view === 'students' ? students.length :
    view === 'payments' && paymentAlerts > 0 ? paymentAlerts :
    view === 'financial-aid' && aidPending > 0 ? aidPending :
    null

  return (
    <button
      key={view}
      onClick={() => { setActiveView(view); setSidebarOpen(false) }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
        active
          ? 'bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
          : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon size={18} weight={active ? 'fill' : 'regular'} />
      {label}
      {badge !== null && (
        <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full ${
          active ? 'bg-white/20 text-white' :
          view === 'students' ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' :
          'bg-amber-400 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 4: Apply gradient to the sidebar `<motion.aside>`**

Find the `<motion.aside>` className (around line 221). Replace `bg-white dark:bg-neutral-900` with `bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/20 dark:to-neutral-900`:

```tsx
<motion.aside
  className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/20 dark:to-neutral-900 border-r border-slate-100 dark:border-neutral-800 flex flex-col transition-transform duration-300 ${
    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
  }`}
>
```

- [ ] **Step 5: Replace the `<nav>` block with grouped rendering**

Replace the entire `<nav>` element (the one with `flex-1 px-3 py-4 space-y-0.5 overflow-y-auto`) with:

```tsx
<nav className="flex-1 px-3 py-4 overflow-y-auto">
  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-600 px-3 mb-1">
    Analytics
  </p>
  <div className="space-y-0.5 mb-4">
    {NAV_ANALYTICS.map(renderNavItem)}
  </div>
  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-600 px-3 mb-1">
    Management
  </p>
  <div className="space-y-0.5">
    {NAV_MANAGEMENT.map(renderNavItem)}
  </div>
</nav>
```

- [ ] **Step 6: Add user profile card above logout button**

Find the sidebar bottom section (the `<div className="px-3 pb-4 border-t ...">` that contains the logout button). Add the profile card before the logout button:

```tsx
<div className="px-3 pb-4 border-t border-slate-100 dark:border-neutral-800 pt-3">
  {/* Profile card */}
  <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800 rounded-2xl px-3 py-2.5 mb-3">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.4)]">
      A
    </div>
    <div className="min-w-0">
      <p className="text-sm font-black text-slate-900 dark:text-white leading-none">Admin</p>
      <p className="text-[10px] text-slate-400 dark:text-neutral-600 mt-0.5 truncate">admin@englishpro.com</p>
    </div>
  </div>
  {/* Logout button — keep existing code unchanged */}
  <button
    onClick={handleLogout}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
  >
    <SignOut size={18} />
    Sign Out
  </button>
</div>
```

- [ ] **Step 7: Start dev server and verify sidebar visually**

```bash
cd client && npm run dev
```

Check:
- Sidebar has a subtle violet tint at top fading to white (light mode)
- Two nav group labels "ANALYTICS" and "MANAGEMENT" are visible
- Students item shows a count badge
- If any pending payments/financial aid exist in mock data, those nav items show amber badges
- Bottom shows profile card above logout button
- Active item has `rounded-2xl` shape

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/AdminPage.tsx
git commit -m "feat(admin): redesign sidebar with gradient, nav groups, badges, profile card"
```

---

## Task 2: Overview — Ambient Orbs + Welcome Strip

**Files:**
- Modify: `client/src/pages/admin/AdminOverview.tsx`

- [ ] **Step 1: Add `getGreeting` helper and constants at top of file**

Add these before the `card` animation constant (line 6):

```ts
const FLAG_MAP: Record<string, string> = {
  'Pakistan': '🇵🇰',
  'India': '🇮🇳',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Bangladesh': '🇧🇩',
}

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-orange-600',
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
```

- [ ] **Step 2: Wrap the return div in a relative container and add ambient orbs**

Change the outermost return div from:
```tsx
<div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
```
to:
```tsx
<div className="relative p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-hidden">
  {/* Ambient orbs */}
  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-200/30 dark:bg-violet-900/15 rounded-full blur-[100px] pointer-events-none" />
  <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-[80px] pointer-events-none" />
```

- [ ] **Step 3: Add welcome strip as first child inside the wrapper (before the alert strip)**

Insert this block right after the two orb divs, before the existing alert strip `{(pendingPayments > 0 ...`:

```tsx
{/* Welcome strip */}
<motion.div {...card} className="relative">
  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
    {getGreeting()}, Admin 👋
  </h2>
  <p className="text-sm text-slate-400 dark:text-neutral-500 mt-0.5">
    {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
  </p>
</motion.div>
```

- [ ] **Step 4: Verify visually**

Check:
- Soft violet glow visible at top-right corner of overview content area
- Welcome strip shows correct greeting (morning/afternoon/evening) and today's date

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminOverview.tsx
git commit -m "feat(admin): add ambient orbs and welcome strip to overview"
```

---

## Task 3: Overview — Stat Cards Redesign

**Files:**
- Modify: `client/src/pages/admin/AdminOverview.tsx`

- [ ] **Step 1: Update `STAT_CARDS` to include `variant` and `borderColor`**

Replace the entire `STAT_CARDS` array with:

```ts
const STAT_CARDS = [
  {
    label: 'Total Students',
    value: students.length,
    sub: `${activeStudents} active`,
    Icon: Users,
    variant: 'gradient' as const,
    color: 'from-violet-600 via-purple-600 to-indigo-700',
    glow: 'rgba(124,58,237,0.35)',
    borderColor: '',
    view: 'students' as AdminView,
  },
  {
    label: 'Total Courses',
    value: courses.filter(c => c.status === 'active').length,
    sub: `${courses.length} total`,
    Icon: BookOpen,
    variant: 'normal' as const,
    color: 'from-blue-500 to-blue-700',
    glow: 'rgba(59,130,246,0.35)',
    borderColor: 'border-l-blue-500',
    view: 'courses' as AdminView,
  },
  {
    label: 'Instructors',
    value: instructors.length,
    sub: `${instructors.filter(i => i.status === 'active').length} active`,
    Icon: Student,
    variant: 'normal' as const,
    color: 'from-emerald-500 to-emerald-700',
    glow: 'rgba(16,185,129,0.35)',
    borderColor: 'border-l-emerald-500',
    view: 'instructors' as AdminView,
  },
  {
    label: 'Revenue (PKR)',
    value: `₨${totalRevenuePKR.toLocaleString()}`,
    sub: `${students.filter(s => s.paymentStatus === 'paid').length} paid`,
    Icon: CreditCard,
    variant: 'dark' as const,
    color: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.35)',
    borderColor: '',
    view: 'payments' as AdminView,
  },
  {
    label: 'Financial Aid',
    value: financialAidApps.length,
    sub: `${financialAidApps.filter(a => a.status === 'pending' || a.status === 'under_review').length} pending/review`,
    Icon: Handshake,
    variant: 'normal' as const,
    color: 'from-pink-500 to-rose-600',
    glow: 'rgba(244,63,94,0.35)',
    borderColor: 'border-l-pink-500',
    view: 'financial-aid' as AdminView,
  },
]
```

- [ ] **Step 2: Replace the stat cards render block with variant-aware rendering**

Replace the entire `{/* Stat cards */}` section with:

```tsx
{/* Stat cards */}
<div className="grid grid-cols-2 lg:grid-cols-5 gap-4 relative">
  {STAT_CARDS.map((s, i) => {
    if (s.variant === 'gradient') {
      return (
        <motion.button
          key={s.label}
          {...card}
          transition={{ delay: i * 0.06 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onNavigate(s.view)}
          className="group relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-4 sm:p-5 text-left overflow-hidden"
        >
          <span className="absolute -top-2 -right-2 text-[80px] font-black text-white/10 leading-none select-none pointer-events-none" aria-hidden="true">
            {typeof s.value === 'number' ? s.value : ''}
          </span>
          <div className="flex items-start justify-between mb-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <s.Icon size={18} weight="fill" className="text-white" />
            </div>
            <ArrowRight size={14} className="text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white leading-none mb-1 relative z-10">{s.value}</p>
          <p className="text-xs text-white/70 font-medium relative z-10">{s.label}</p>
          <p className="text-[10px] text-white/50 mt-0.5 relative z-10">{s.sub}</p>
        </motion.button>
      )
    }

    if (s.variant === 'dark') {
      return (
        <motion.button
          key={s.label}
          {...card}
          transition={{ delay: i * 0.06 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onNavigate(s.view)}
          className="group relative bg-slate-900 dark:bg-neutral-800 rounded-3xl p-4 sm:p-5 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between mb-3 relative z-10">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`} style={{ boxShadow: `0 4px 12px ${s.glow}` }}>
              <s.Icon size={18} weight="fill" className="text-white" />
            </div>
            <ArrowRight size={14} className="text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white leading-none mb-1 relative z-10">{s.value}</p>
          <p className="text-xs text-slate-400 font-medium relative z-10">{s.label}</p>
          <p className="text-[10px] text-slate-600 mt-0.5 relative z-10">{s.sub}</p>
        </motion.button>
      )
    }

    return (
      <motion.button
        key={s.label}
        {...card}
        transition={{ delay: i * 0.06 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => onNavigate(s.view)}
        className={`group relative bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 border-l-4 ${s.borderColor} p-4 sm:p-5 text-left hover:shadow-lg hover:shadow-violet-100/30 dark:hover:shadow-violet-950/20 transition-all duration-200 overflow-hidden`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`} style={{ boxShadow: `0 4px 12px ${s.glow}` }}>
            <s.Icon size={18} weight="fill" className="text-white" />
          </div>
          <ArrowRight size={14} className="text-slate-300 dark:text-neutral-700 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
        </div>
        <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{s.value}</p>
        <p className="text-xs text-slate-400 dark:text-neutral-500 font-medium">{s.label}</p>
        <p className="text-[10px] text-slate-300 dark:text-neutral-700 mt-0.5">{s.sub}</p>
      </motion.button>
    )
  })}
</div>
```

- [ ] **Step 3: Verify visually**

Check:
- First card (Total Students): violet gradient bg with white text and faint watermark number
- Fourth card (Revenue): dark slate bg with violet glow blob in corner
- Other 3 cards: white bg with colored left border accent (blue, emerald, pink)
- All cards have `rounded-3xl` and scale slightly on hover

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/admin/AdminOverview.tsx
git commit -m "feat(admin): redesign overview stat cards with gradient/dark/normal variants"
```

---

## Task 4: Overview — Panel Headers, Progress Bars, Avatar Colors, Country Flags

**Files:**
- Modify: `client/src/pages/admin/AdminOverview.tsx`

- [ ] **Step 1: Update Recent Enrollments panel header to pill badge**

Find the `{/* Recent enrollments */}` panel header div and replace it:

```tsx
<div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/50">
    <TrendUp size={13} weight="fill" className="text-violet-600 dark:text-violet-400" />
    <span className="text-violet-700 dark:text-violet-300 text-xs font-bold tracking-wide uppercase">Recent Enrollments</span>
  </div>
  <button onClick={() => onNavigate('students')} className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline flex items-center gap-1">
    View all <ArrowRight size={11} />
  </button>
</div>
```

- [ ] **Step 2: Update Students by Country panel header**

Replace the `<div className="flex items-center gap-2 px-5 py-4 border-b ...">` of the Countries panel with:

```tsx
<div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50">
    <Globe size={13} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
    <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide uppercase">Students by Country</span>
  </div>
</div>
```

- [ ] **Step 3: Update Payment Methods panel header**

```tsx
<div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50">
    <ChartPieSlice size={13} weight="fill" className="text-blue-600 dark:text-blue-400" />
    <span className="text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase">Payment Methods</span>
  </div>
</div>
```

- [ ] **Step 4: Update Enrollment by Course panel header**

```tsx
<div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50">
    <BookOpen size={13} weight="fill" className="text-amber-600 dark:text-amber-400" />
    <span className="text-amber-700 dark:text-amber-300 text-xs font-bold tracking-wide uppercase">Enrollment by Course</span>
  </div>
</div>
```

- [ ] **Step 5: Update Countries progress bars (height only)**

In the Countries panel, change `h-1.5` → `h-2.5` on both the track and fill divs:

```tsx
<div className="h-2.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${(count / students.length) * 100}%` }}
    transition={{ duration: 0.8, delay: 0.3 }}
    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
  />
</div>
```

- [ ] **Step 6: Update Payment Methods progress bars (height + colored bg)**

Change `h-1.5` → `h-2.5` and `bg-slate-100 dark:bg-neutral-800` → `bg-blue-50 dark:bg-blue-950/20`:

```tsx
<div className="h-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${(count / students.length) * 100}%` }}
    transition={{ duration: 0.8, delay: 0.4 }}
    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
  />
</div>
```

- [ ] **Step 7: Update Enrollment by Course progress bars (height + colored bg)**

Change `h-1.5` → `h-2.5` and background to `bg-amber-50 dark:bg-amber-950/20`:

```tsx
<div className="h-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${(count / students.length) * 100}%` }}
    transition={{ duration: 0.8, delay: 0.4 }}
    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
  />
</div>
```

- [ ] **Step 8: Update Recent Enrollments avatar colors to rotate per index**

Find the `recentStudents.map(s => (...)` call and add an index parameter, then update the avatar div:

```tsx
{recentStudents.map((s, idx) => (
  <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[idx % 4]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {s.avatar}
    </div>
    {/* rest of row unchanged */}
```

- [ ] **Step 9: Add country flag emojis to Countries panel**

Find `<span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 truncate">{country}</span>` inside the Countries panel and update it:

```tsx
<span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 truncate">
  {FLAG_MAP[country] ? `${FLAG_MAP[country]} ` : ''}{country}
</span>
```

- [ ] **Step 10: Verify visually**

Check:
- All 4 panel headers show colored pill badges matching their accent color (violet, emerald, blue, amber)
- Progress bars are noticeably thicker (`h-2.5`) compared to before
- Payment and course bars have a subtle colored background track
- Recent enrollment avatars cycle through 4 different gradient colors
- Countries show flag emoji before the country name (for known countries)

- [ ] **Step 11: Commit**

```bash
git add client/src/pages/admin/AdminOverview.tsx
git commit -m "feat(admin): add pill badges, thicker bars, rotating avatars, country flags"
```

---

## Done

All four tasks complete. The admin dashboard now matches the main website's visual language:
- Sidebar: violet gradient, grouped nav, pending badges, profile card
- Overview: ambient orbs, welcome greeting, gradient/dark/normal stat cards, pill section headers, richer progress bars, colorful avatars, flag emojis
