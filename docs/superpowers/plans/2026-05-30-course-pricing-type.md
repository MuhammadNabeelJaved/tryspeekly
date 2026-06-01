# Course Pricing Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `pricingType` (monthly / full_course / per_session) to courses so admin can label how the price is charged, and display that label everywhere a course price appears.

**Architecture:** Add a single `pricingType` enum field to the Mongoose `Course` model (default `full_course`). Propagate the field through the TypeScript interfaces, admin create/edit form (toggle buttons), admin review modal, and all price display sites (admin cards, student enrollments, instructor listing). For `per_session`, show both the per-session price and the computed total.

**Tech Stack:** Node.js + Mongoose (server), React + TypeScript + Tailwind + react-hook-form (client)

---

## Files

| File | Change |
|---|---|
| `server/src/models/course.model.js` | Add `pricingType` field to schema |
| `client/src/types/api.ts` | Add `pricingType` to `Course` and `CreateCourseDto` |
| `client/src/pages/admin/adminData.ts` | Add `pricingType` to local `Course` interface + INITIAL_COURSES |
| `client/src/pages/admin/AdminCourses.tsx` | Map field from API, add toggle in form, add badge in card, add to review modal, include in save DTO |
| `client/src/pages/student/StudentCourses.tsx` | Show pricing type badge next to price |
| `client/src/pages/instructor/InstructorCourses.tsx` | Show pricing type label in price string |

---

## Task 1: Backend — Add `pricingType` to Course model

**Files:**
- Modify: `server/src/models/course.model.js`

- [ ] **Step 1: Add the field to the schema**

In `server/src/models/course.model.js`, add after the `currency` field (line 63):

```js
pricingType: {
  type: String,
  enum: ['monthly', 'full_course', 'per_session'],
  default: 'full_course',
},
```

- [ ] **Step 2: Verify server still starts**

```bash
cd server && node --input-type=module <<'EOF'
import Course from './src/models/course.model.js'
console.log('pricingType default:', Course.schema.path('pricingType').options.default)
EOF
```
Expected output: `pricingType default: full_course`

- [ ] **Step 3: Commit**

```bash
git add server/src/models/course.model.js
git commit -m "feat: add pricingType field to Course model (monthly|full_course|per_session)"
```

---

## Task 2: TypeScript types — Add `pricingType` to interfaces

**Files:**
- Modify: `client/src/types/api.ts`

- [ ] **Step 1: Add to `Course` interface**

In `client/src/types/api.ts`, inside the `Course` interface after `priceUSD?: number;` (around line 124):

```ts
pricingType?: 'monthly' | 'full_course' | 'per_session';
```

- [ ] **Step 2: Add to `CreateCourseDto` interface**

In `client/src/types/api.ts`, inside the `CreateCourseDto` interface after `priceUSD?: number;` (around line 148):

```ts
pricingType?: 'monthly' | 'full_course' | 'per_session';
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts
git commit -m "feat: add pricingType to Course and CreateCourseDto TypeScript types"
```

---

## Task 3: Admin local data — Add `pricingType` to adminData.ts interface

**Files:**
- Modify: `client/src/pages/admin/adminData.ts`

- [ ] **Step 1: Add to local `Course` interface**

In `client/src/pages/admin/adminData.ts`, in the `Course` interface (around line 83) add after `priceUSD?: number`:

```ts
pricingType?: 'monthly' | 'full_course' | 'per_session'
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/admin/adminData.ts
git commit -m "feat: add pricingType to admin local Course interface"
```

---

## Task 4: AdminCourses — Map field from API response

**Files:**
- Modify: `client/src/pages/admin/AdminCourses.tsx`

The component maps API data to local `Course` objects in three places (lines ~80, ~210, ~277). Add `pricingType` to each mapping and to the `EMPTY` default object.

- [ ] **Step 1: Add to EMPTY constant**

Change the `EMPTY` constant at the top of `AdminCourses.tsx` (line 12-17) by adding `pricingType`:

```ts
const EMPTY: Course = {
  id: '', title: '', level: 'Beginner', duration: '', price: 0, currency: 'PKR',
  pricingType: 'full_course',
  instructorId: '', instructorName: '', totalStudents: 0, maxStudents: 15,
  status: 'active', description: '', startDate: new Date().toISOString().split('T')[0],
  schedule: '', nextClassTime: '', nextClassNumber: 1, meetingLink: '', meetingId: '', passcode: '', features: [],
}
```

- [ ] **Step 2: Add to first API mapping (initial fetch, ~line 80)**

In the first `apiData.map()` block, add after `price: c.price ?? 0,`:

```ts
pricingType: c.pricingType ?? 'full_course',
```

- [ ] **Step 3: Add to second API mapping (after review action, ~line 210)**

In the second mapping block (inside `handleReview`), add after `price: c.price ?? 0,`:

```ts
pricingType: c.pricingType ?? 'full_course',
```

- [ ] **Step 4: Add to third API mapping (after add/edit save, ~line 280)**

In the third mapping block (inside `onSave`), add after `price: c.price ?? 0,`:

```ts
pricingType: c.pricingType ?? 'full_course',
```

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminCourses.tsx
git commit -m "feat: map pricingType from API in AdminCourses data fetching"
```

---

## Task 5: AdminCourses — Pricing type toggle in add/edit form

**Files:**
- Modify: `client/src/pages/admin/AdminCourses.tsx`

- [ ] **Step 1: Add pricing type state and watch**

The form uses `react-hook-form`. Add a `watch` call at the top of the component where `register, handleSubmit, reset, setValue` are destructured (around line 161):

```ts
const { register, handleSubmit, reset, setValue, watch } = useForm<Course & { featuresInput: string }>({
  defaultValues: { ...EMPTY, featuresInput: '' }
})
const watchedPricingType = watch('pricingType')
const watchedPrice = watch('price')
const watchedDuration = watch('duration')
```

- [ ] **Step 2: Add pricing type toggle in the form, after the USD Price field (~line 687)**

In the form grid inside the modal (`<div className="p-6 grid grid-cols-2 gap-4">`), after the USD Price `Field`, add:

```tsx
<div className="col-span-2">
  <Field label="Pricing Type">
    <div className="flex gap-2">
      {([
        { value: 'full_course', label: 'Full Course' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'per_session', label: 'Per Session' },
      ] as const).map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setValue('pricingType', opt.value)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
            watchedPricingType === opt.value
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-violet-400 bg-slate-50 dark:bg-neutral-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </Field>
</div>
{watchedPricingType === 'per_session' && Number(watchedPrice) > 0 && Number(watchedDuration) > 0 && (
  <div className="col-span-2">
    <p className="text-xs text-slate-500 dark:text-neutral-400 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/30 rounded-xl px-3 py-2">
      <span className="font-semibold text-violet-700 dark:text-violet-400">Total estimate:</span>{' '}
      ₨{(Number(watchedPrice) * Number(watchedDuration)).toLocaleString()} ({watchedDuration} sessions × ₨{Number(watchedPrice).toLocaleString()}/session)
    </p>
  </div>
)}
```

- [ ] **Step 3: Include `pricingType` in the save DTO (around line 249)**

In the `dto` object inside `onSave`, add `pricingType`:

```ts
const dto = {
  title: data.title,
  description: data.description || 'No description provided.',
  price: data.price,
  priceUSD: data.priceUSD ?? 0,
  currency: 'PKR',
  pricingType: data.pricingType ?? 'full_course',
  type: 'group',
  // ... rest unchanged
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/admin/AdminCourses.tsx
git commit -m "feat: add pricingType toggle to admin course create/edit form"
```

---

## Task 6: AdminCourses — Pricing type in review modal + display badge on cards

**Files:**
- Modify: `client/src/pages/admin/AdminCourses.tsx`

- [ ] **Step 1: Add `reviewPricingType` state**

Near the other review state declarations (around line 152-154), add:

```ts
const [reviewPricingType, setReviewPricingType] = useState<'monthly' | 'full_course' | 'per_session'>('full_course')
```

- [ ] **Step 2: Initialize in `openReview`**

In `openReview` function (around line 188), add after `setReviewPriceUSD(...)`:

```ts
setReviewPricingType((course.pricingType as any) ?? 'full_course')
```

- [ ] **Step 3: Include in review submit**

In `handleReview` (around line 202), update the accept payload:

```ts
action === 'accept'
  ? { price: reviewPrice, priceUSD: reviewPriceUSD, currency: reviewCurrency, pricingType: reviewPricingType }
  : undefined
```

- [ ] **Step 4: Add pricing type selector to review modal UI**

In the review modal grid (after the USD Price input, around line 780), add:

```tsx
<div className="col-span-2">
  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Pricing Type</p>
  <div className="flex gap-2">
    {([
      { value: 'full_course', label: 'Full Course' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'per_session', label: 'Per Session' },
    ] as const).map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => setReviewPricingType(opt.value)}
        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
          reviewPricingType === opt.value
            ? 'bg-violet-600 border-violet-600 text-white'
            : 'border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-violet-400 bg-slate-50 dark:bg-neutral-800'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 5: Add pricing type badge on course cards**

In the course card price display block (around line 555-558), replace it with:

```tsx
<div className="flex-shrink-0 text-right">
  <p className="text-sm font-black text-violet-600 dark:text-violet-400">
    ₨{course.price.toLocaleString()}
    <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 ml-1">
      {course.pricingType === 'monthly' ? '/mo' : course.pricingType === 'per_session' ? '/session' : ''}
    </span>
  </p>
  {(course.priceUSD ?? 0) > 0 && (
    <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">${course.priceUSD}</p>
  )}
  {course.pricingType === 'per_session' && (
    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500 mt-0.5">
      ₨{(course.price * parseInt(course.duration)).toLocaleString()} total
    </p>
  )}
</div>
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/admin/AdminCourses.tsx
git commit -m "feat: add pricingType to review modal and course card price display"
```

---

## Task 7: StudentCourses — Display pricing type with price

**Files:**
- Modify: `client/src/pages/student/StudentCourses.tsx`

- [ ] **Step 1: Find where price is displayed on enrolled course cards**

Search for the price display in the student courses card. Look for `enrollment.course.price` or `₨` in the JSX.

- [ ] **Step 2: Add `pricingType` label next to price wherever price is shown**

Find the price display block (search for `course.price` in JSX). Wherever price is rendered as text, append the pricing type suffix using this pattern:

```tsx
{/* Replace any plain price display like: */}
<span>₨{enrollment.course.price.toLocaleString()}</span>

{/* With: */}
<span>
  ₨{enrollment.course.price.toLocaleString()}
  {enrollment.course.pricingType === 'monthly' && (
    <span className="text-[10px] font-semibold text-slate-400 ml-1">/mo</span>
  )}
  {enrollment.course.pricingType === 'per_session' && (
    <span className="text-[10px] font-semibold text-slate-400 ml-1">/session</span>
  )}
</span>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/student/StudentCourses.tsx
git commit -m "feat: show pricing type suffix in student course price display"
```

---

## Task 8: InstructorCourses — Append pricing type to price string

**Files:**
- Modify: `client/src/pages/instructor/InstructorCourses.tsx`

- [ ] **Step 1: Update the `mapCourseToCard` function**

In `client/src/pages/instructor/InstructorCourses.tsx`, the `mapCourseToCard` function (around line 113) currently builds a price string:

```ts
price: c.price ? `${c.currency === 'PKR' ? 'Rs' : '$'}${c.price}` : '',
```

Replace with:

```ts
price: c.price
  ? `${c.currency === 'PKR' ? 'Rs' : '$'}${c.price}${
      c.pricingType === 'monthly' ? '/mo'
      : c.pricingType === 'per_session' ? '/session'
      : ''
    }`
  : '',
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/instructor/InstructorCourses.tsx
git commit -m "feat: append pricingType suffix to instructor course price display"
```

---

## Task 9: Manual end-to-end verification

- [ ] **Step 1: Start dev server**

```bash
cd client && npm run dev
```

- [ ] **Step 2: Test admin create flow**
  - Go to `/admin/courses` → New Course
  - Set price = 500, select "Per Session", set duration = 20
  - Verify preview shows: "20 sessions × ₨500 = ₨10,000 total"
  - Save and verify card shows "₨500/session" + "₨10,000 total"

- [ ] **Step 3: Test admin edit flow**
  - Edit an existing course
  - Switch pricing type to "Monthly"
  - Save and verify card shows "₨8,000/mo"

- [ ] **Step 4: Test review modal**
  - Go to Pending tab → Review a course
  - Verify Pricing Type selector is visible
  - Select "Per Session", approve, verify card reflects it

- [ ] **Step 5: Test student view**
  - Log in as student
  - Go to enrolled courses
  - Verify pricing type suffix appears next to price

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: course pricing type — full end-to-end (monthly/full_course/per_session)"
```
