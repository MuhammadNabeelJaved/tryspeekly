# Instructor PricingType + Discount Suffix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pricingType selector (Full Course / Per Session / Monthly) to the instructor course creation/edit form, and show the pricingType suffix consistently on all student-facing price displays including when discounts or offers are applied.

**Architecture:** Three touch points — (1) instructor form gains a pricingType toggle, (2) CourseDetailsPage price display appends the suffix to both base and discounted prices, (3) PaymentSubmitModal receives pricingType as a prop and shows it in the price summary. All existing discount and coupon logic already operates on the base price and requires no changes — only the display layer needs the suffix.

**Tech Stack:** React 18, TypeScript strict, react-hook-form, Tailwind CSS, framer-motion, Phosphor icons. Backend: Express + Mongoose (course model already has `pricingType` field; teachers can already set it — only `price`/`priceUSD`/`currency` are blocked).

---

## File Map

| File | Change |
|------|--------|
| `client/src/pages/instructor/InstructorCourses.tsx` | Add `pricingType` to type, EMPTY_COURSE, mapBackendCourse, form UI, and payloads |
| `client/src/pages/CourseDetailsPage.tsx` | Add `pricingTypeSuffix` helper; append suffix to all price display spots |
| `client/src/pages/student/PaymentSubmitModal.tsx` | Add `pricingType` prop; append suffix in price summary lines |
| `client/src/pages/student/StudentCourses.tsx` | Pass `pricingType` through submitModal state and to the modal |
| `client/src/pages/student/StudentOverview.tsx` | Pass `pricingType` to PaymentSubmitModal |
| `client/src/pages/student/StudentPayments.tsx` | Pass `pricingType` through submitModal state and to the modal |
| `client/src/pages/student/CompleteEnrollmentPopup.tsx` | Pass `pricingType` to PaymentSubmitModal |

---

## Task 1: Add pricingType to InstructorCourses.tsx

**Files:**
- Modify: `client/src/pages/instructor/InstructorCourses.tsx`

### Step 1: Add `pricingType` to `InstructorCourse` type and `EMPTY_COURSE`

- [ ] In the `InstructorCourse` type (around line 26), add the field:

```typescript
type InstructorCourse = {
  id: string
  title: string
  students: number
  status: string
  nextClass: string
  progress: number
  pricingType?: 'full_course' | 'per_session' | 'monthly'   // ADD THIS
  level?: string
  // ... rest unchanged
}
```

- [ ] In `EMPTY_COURSE` (around line 51), add the default:

```typescript
const EMPTY_COURSE: InstructorCourse = {
  id: '',
  title: '',
  students: 0,
  status: 'draft',
  nextClass: 'TBD',
  progress: 0,
  pricingType: 'full_course',   // ADD THIS
  level: 'Beginner',
  // ... rest unchanged
}
```

### Step 2: Update `mapBackendCourse` to extract `pricingType`

- [ ] In `mapBackendCourse` (around line 92), add `pricingType` to the returned object:

```typescript
function mapBackendCourse(c: any): InstructorCourse {
  // ... existing statusMap
  return {
    id: String(c._id),
    title: c.title,
    students: c.enrolledStudents?.length || 0,
    status: statusMap[c.status] || c.status,
    nextClass: c.recurringSchedule?.[0] ? `${c.recurringSchedule[0].day}, ${c.recurringSchedule[0].time}` : 'TBD',
    progress: 0,
    pricingType: (c.pricingType as 'full_course' | 'per_session' | 'monthly') ?? 'full_course',  // ADD THIS
    totalClasses: c.totalSessions,
    maxStudents: c.maxStudents,
    level: c.level ? c.level.charAt(0).toUpperCase() + c.level.slice(1) : 'Beginner',
    duration: c.type,
    description: c.description,
    category: c.focus,
    price: c.price
      ? `${c.currency === 'PKR' ? 'Rs' : '$'}${c.price}${
          c.pricingType === 'monthly' ? '/mo'
          : c.pricingType === 'per_session' ? '/session'
          : ''
        }`
      : '',
    startDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
    image: c.thumbnail,
    language: 'English',
  }
}
```

### Step 3: Add pricingType toggle UI in the Pricing & Status section

- [ ] Find the "Pricing & Status" section (around line 817). Replace the existing amber "Pricing is managed by Admin" banner with this (keep it but add the toggle above it):

```tsx
<h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-neutral-800 pb-2 mt-8">Pricing & Status</h4>

{/* Pricing Type selector */}
<Field label="Pricing Type">
  <div className="flex gap-2">
    {([
      { value: 'full_course', label: 'Full Course' },
      { value: 'per_session', label: 'Per Session' },
      { value: 'monthly', label: 'Monthly' },
    ] as const).map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => setValue('pricingType', opt.value)}
        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
          watch('pricingType') === opt.value
            ? 'bg-violet-600 border-violet-600 text-white shadow-[0_2px_8px_rgba(124,58,237,0.3)]'
            : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
</Field>

{/* Existing amber info banner — updated text */}
<div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
  <span className="text-amber-500 text-lg shrink-0">₨</span>
  <div>
    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Pricing is managed by Admin</p>
    <p className="text-xs text-amber-600/80 dark:text-amber-500/70 mt-0.5 leading-relaxed">
      Your selected pricing type helps the admin price it correctly. The actual amount is set by admin at review.
    </p>
  </div>
</div>
```

Note: `setValue` and `watch` are already destructured from `useForm` in this component.

### Step 4: Send `pricingType` in `createCourse` payload

- [ ] In `onSave` → `modalType === 'add'` branch (around line 298), add `pricingType`:

```typescript
const res = await coursesService.createCourse({
  title: data.title,
  description: data.description || '',
  type: (data.category === 'Recorded Course' ? 'one-to-one' : data.category === 'Hybrid' ? 'hybrid' : 'group') as 'group' | 'one-to-one' | 'hybrid',
  level: (data.level?.toLowerCase() || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
  focus: 'general',
  thumbnail: thumbMode === 'url' ? (data.image || undefined) : undefined,
  totalSessions: data.totalClasses || 12,
  sessionDuration: 60,
  maxStudents: data.maxStudents,
  pricingType: data.pricingType || 'full_course',   // ADD THIS
})
```

### Step 5: Send `pricingType` in `updateCourse` payload

- [ ] In the `else` branch (around line 332), add `pricingType` to `updatePayload`:

```typescript
const updatePayload: any = {
  title: data.title,
  description: data.description,
  pricingType: data.pricingType || 'full_course',   // ADD THIS
}
```

### Step 6: Commit

- [ ] Run TypeScript check: `cd client && npx tsc --noEmit` — expect no errors
- [ ] Commit:
```bash
git add client/src/pages/instructor/InstructorCourses.tsx
git commit -m "feat: add pricingType selector to instructor course creation form"
```

---

## Task 2: Show pricingType suffix in CourseDetailsPage

**Files:**
- Modify: `client/src/pages/CourseDetailsPage.tsx`

### Step 1: Add a `pricingTypeSuffix` helper

- [ ] Near the top of the component (after the `priceResult` calculation around line 227), add:

```typescript
const pricingTypeSuffix =
  apiCourse?.pricingType === 'monthly' ? '/mo'
  : apiCourse?.pricingType === 'per_session' ? '/session'
  : ''
```

### Step 2: Update `activeCourse.price` to include suffix (the base price string)

- [ ] In the `activeCourse` build block (around line 185-187), update the `price` field:

```typescript
price: currency === 'PKR'
  ? `Rs.${(apiCourse.price ?? 0).toLocaleString()}${
      apiCourse.pricingType === 'monthly' ? '/mo'
      : apiCourse.pricingType === 'per_session' ? '/session'
      : ''
    }`
  : `$${apiCourse.priceUSD ?? 0}${
      apiCourse.pricingType === 'monthly' ? '/mo'
      : apiCourse.pricingType === 'per_session' ? '/session'
      : ''
    }`,
```

### Step 3: Update hero card discounted price to include suffix

- [ ] Find the hero card price display (around line 773–776). Change the `priceResult?.hasDiscount` branch:

```tsx
<span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
  {priceResult?.hasDiscount
    ? `Rs.${priceResult.discountedPrice.toLocaleString()}${pricingTypeSuffix}`
    : activeCourse.price}
</span>
{priceResult?.hasDiscount && (
  <span className="text-lg text-slate-400 dark:text-neutral-500 line-through mb-1 font-semibold">
    Rs.{priceResult.originalPrice.toLocaleString()}{pricingTypeSuffix}
  </span>
)}
```

### Step 4: Update mobile sticky bar discounted price to include suffix

- [ ] Find the mobile sticky bar price display (around line 1190–1193). Change it to:

```tsx
<div className="text-2xl font-black text-slate-900 dark:text-white">
  {priceResult?.hasDiscount
    ? `Rs.${priceResult.discountedPrice.toLocaleString()}${pricingTypeSuffix}`
    : activeCourse.price}
</div>
```

- [ ] Also update the strikethrough original price in the sticky bar (around line 1185–1187):

```tsx
{priceResult?.hasDiscount && (
  <div className="text-xs text-slate-500 dark:text-neutral-400 font-bold mb-0.5 line-through">
    Rs.{priceResult.originalPrice.toLocaleString()}{pricingTypeSuffix}
  </div>
)}
```

### Step 5: Commit

- [ ] Run TypeScript check: `cd client && npx tsc --noEmit` — expect no errors
- [ ] Commit:
```bash
git add client/src/pages/CourseDetailsPage.tsx
git commit -m "feat: show pricingType suffix on discounted prices in CourseDetailsPage"
```

---

## Task 3: Add pricingType prop to PaymentSubmitModal

**Files:**
- Modify: `client/src/pages/student/PaymentSubmitModal.tsx`

### Step 1: Add `pricingType` to Props interface and destructure it

- [ ] In the `Props` interface (around line 158), add:

```typescript
interface Props {
  courseId: string
  teacherId: string
  courseName?: string
  coursePrice?: number
  courseCurrency?: 'PKR' | 'USD'
  pricingType?: 'monthly' | 'full_course' | 'per_session'   // ADD THIS
  offerDiscountedPrice?: number | null
  offerLabel?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

- [ ] Add `pricingType` to the destructured params in the function signature (line 171):

```typescript
export default function PaymentSubmitModal({
  courseId, teacherId, courseName, coursePrice, courseCurrency,
  pricingType,                                                // ADD THIS
  offerDiscountedPrice, offerLabel, isOpen, onClose, onSuccess
}: Props) {
```

### Step 2: Add a local suffix helper

- [ ] Inside the component (right after the props destructuring), add:

```typescript
const priceSuffix =
  pricingType === 'monthly' ? '/mo'
  : pricingType === 'per_session' ? '/session'
  : ''
```

### Step 3: Append suffix wherever the price is displayed

The modal shows the course price in multiple spots. Find every place `coursePrice` or `offerDiscountedPrice` is rendered as a formatted string and append `{priceSuffix}`.

- [ ] Find all price display occurrences using this pattern in the file:
```
Rs.${...}   or   $${...}
```
For each one, append the suffix. Specifically look for (approximately lines 356–365 and 479–490 and 584–590):

```tsx
{/* Example: wherever Rs.${offerDiscountedPrice} appears, change to: */}
Rs.{offerDiscountedPrice.toLocaleString()}{priceSuffix}

{/* Wherever coursePrice appears formatted, change to: */}
{courseCurrency === 'USD' ? `$${coursePrice}${priceSuffix}` : `Rs.${coursePrice?.toLocaleString()}${priceSuffix}`}
```

Read lines 350–370, 475–495, 580–640 to find the exact JSX price display nodes and add `{priceSuffix}` after each price value.

### Step 4: Commit

- [ ] Run TypeScript check: `cd client && npx tsc --noEmit` — expect no errors
- [ ] Commit:
```bash
git add client/src/pages/student/PaymentSubmitModal.tsx
git commit -m "feat: add pricingType suffix to PaymentSubmitModal price display"
```

---

## Task 4: Pass pricingType from callers to PaymentSubmitModal

**Files:**
- Modify: `client/src/pages/student/StudentCourses.tsx`
- Modify: `client/src/pages/student/StudentOverview.tsx`
- Modify: `client/src/pages/student/StudentPayments.tsx`
- Modify: `client/src/pages/student/CompleteEnrollmentPopup.tsx`

The `Course` API type (`client/src/types/api.ts:126`) already has `pricingType?: 'monthly' | 'full_course' | 'per_session'` — so `enrollment.course.pricingType` is already typed correctly.

### Step 1: StudentCourses.tsx

- [ ] Update the `submitModal` state type (around line 246) to include `pricingType`:

```typescript
const [submitModal, setSubmitModal] = useState<{
  courseId: string
  teacherId: string
  courseName?: string
  coursePrice?: number
  courseCurrency?: 'PKR' | 'USD'
  pricingType?: 'monthly' | 'full_course' | 'per_session'   // ADD
  offerDiscountedPrice?: number
  offerLabel?: string
} | null>(null)
```

- [ ] In the `setSubmitModal` call (around line 285–293), add `pricingType`:

```typescript
setSubmitModal({
  courseId: enrollment.course._id,
  teacherId: enrollment.teacher._id,
  courseName: enrollment.course.title,
  coursePrice: originalPrice,
  courseCurrency: enrollment.course.currency,
  pricingType: enrollment.course.pricingType,   // ADD THIS
  offerDiscountedPrice: result?.hasDiscount ? result.discountedPrice : undefined,
  offerLabel: result?.hasDiscount ? result.offer?.title : undefined,
})
```

- [ ] In the `<PaymentSubmitModal>` JSX (around line 401–410), pass `pricingType`:

```tsx
<PaymentSubmitModal
  courseId={submitModal.courseId}
  teacherId={submitModal.teacherId}
  courseName={submitModal.courseName}
  coursePrice={submitModal.coursePrice}
  courseCurrency={submitModal.courseCurrency}
  pricingType={submitModal.pricingType}           {/* ADD THIS */}
  offerDiscountedPrice={submitModal.offerDiscountedPrice}
  offerLabel={submitModal.offerLabel}
  isOpen={!!submitModal}
  onClose={() => setSubmitModal(null)}
  onSuccess={() => { setSubmitModal(null); fetchData() }}
/>
```

### Step 2: StudentOverview.tsx

- [ ] In the `<PaymentSubmitModal>` JSX (around line 573–590), add `pricingType` prop:

```tsx
<PaymentSubmitModal
  courseId={selectedPayEnrollment.course._id}
  teacherId={selectedPayEnrollment.teacher._id}
  courseName={selectedPayEnrollment.course.title}
  coursePrice={selectedPayEnrollment.course.currency === 'USD'
    ? (selectedPayEnrollment.course.priceUSD ?? 0)
    : (selectedPayEnrollment.course.price ?? 0)}
  courseCurrency={selectedPayEnrollment.course.currency}
  pricingType={selectedPayEnrollment.course.pricingType}    {/* ADD THIS */}
  isOpen={true}
  onClose={() => setSelectedPayEnrollment(null)}
  onSuccess={...}
/>
```

### Step 3: StudentPayments.tsx

- [ ] Update the `submitModal` state type (line 22) to include `pricingType`:

```typescript
const [submitModal, setSubmitModal] = useState<{
  courseId: string
  teacherId: string
  courseName?: string
  coursePrice?: number
  courseCurrency?: 'PKR' | 'USD'
  pricingType?: 'monthly' | 'full_course' | 'per_session'   // ADD
} | null>(null)
```

- [ ] In the `setSubmitModal` call (line 76), add `pricingType`:

```typescript
onClick={() => setSubmitModal({
  courseId: e.course._id,
  teacherId: e.teacher._id,
  courseName: e.course.title,
  coursePrice: e.course.currency === 'USD' ? (e.course.priceUSD ?? 0) : (e.course.price ?? 0),
  courseCurrency: e.course.currency,
  pricingType: e.course.pricingType,   // ADD THIS
})}
```

- [ ] In the `<PaymentSubmitModal>` JSX (around line 195–203), add `pricingType` prop:

```tsx
<PaymentSubmitModal
  courseId={submitModal.courseId}
  teacherId={submitModal.teacherId}
  courseName={submitModal.courseName}
  coursePrice={submitModal.coursePrice}
  courseCurrency={submitModal.courseCurrency}
  pricingType={submitModal.pricingType}    {/* ADD THIS */}
  isOpen={!!submitModal}
  onClose={() => setSubmitModal(null)}
  onSuccess={() => setSubmitModal(null)}
/>
```

### Step 4: CompleteEnrollmentPopup.tsx

- [ ] In the `<PaymentSubmitModal>` JSX (around line 118–127), the enrollment is typed as `selectedEnrollment`. Pass `pricingType`:

```tsx
{selectedEnrollment && (
  <PaymentSubmitModal
    courseId={selectedEnrollment.course._id}
    teacherId={selectedEnrollment.teacher._id}
    pricingType={selectedEnrollment.course.pricingType}    {/* ADD THIS */}
    isOpen={true}
    onClose={() => setSelectedEnrollment(null)}
    onSuccess={() => { setSelectedEnrollment(null); onPaymentSuccess() }}
  />
)}
```

### Step 5: Final TypeScript check and commit

- [ ] Run TypeScript check: `cd client && npx tsc --noEmit` — expect no errors
- [ ] Commit:
```bash
git add client/src/pages/student/StudentCourses.tsx \
        client/src/pages/student/StudentOverview.tsx \
        client/src/pages/student/StudentPayments.tsx \
        client/src/pages/student/CompleteEnrollmentPopup.tsx
git commit -m "feat: pass pricingType to PaymentSubmitModal from all callers"
```

---

## Self-Review Notes

- ✅ Instructor can select pricingType (Full Course / Per Session / Monthly) during create and edit
- ✅ pricingType sent in both create and update API payloads
- ✅ Backend already accepts pricingType from teachers (only price/priceUSD/currency are blocked)
- ✅ CourseDetailsPage hero card and mobile sticky bar show suffix on both base and discounted prices
- ✅ PaymentSubmitModal shows suffix in all price display lines
- ✅ All 4 callers of PaymentSubmitModal updated to pass pricingType
- ✅ Discount (offer) and coupon logic unchanged — they operate on base price and already apply to all pricing types
- ✅ `Course` API type already has `pricingType` field — no types/api.ts changes needed
