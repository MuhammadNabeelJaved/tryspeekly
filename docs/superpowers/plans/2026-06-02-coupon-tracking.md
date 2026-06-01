# Coupon on Course Page + Admin Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move coupon input from the payment modal to the course details page only, make it fully update the displayed price, and add usage tracking views in the admin Coupons and Offers tabs.

**Architecture:** Three independent changes — (1) display-only fix on CourseDetailsPage to reflect coupon discount in the price area, (2) strip the coupon input from PaymentSubmitModal and instead receive and display coupon discount applied at enrollment time, (3) wire the already-written backend tracking controller to a route and surface it in AdminReferrals via a toggleable usage-log table under each relevant tab.

**Tech Stack:** React 18, TypeScript strict, Vite, Tailwind CSS, Express 5 (ESM), Mongoose, Phosphor Icons, Framer Motion, React Hot Toast, Axios

---

## File Map

| File | Change |
|------|--------|
| `server/src/routes/coupon.route.js` | Add `GET /tracking` route (1 line import + 1 route) |
| `client/src/services/coupons.service.ts` | Add `getUsageTracking` method |
| `client/src/pages/CourseDetailsPage.tsx` | Extend coupon result type; compute + display discounted price in sidebar and mobile bar |
| `client/src/pages/student/PaymentSubmitModal.tsx` | Remove coupon input/state; add `couponDiscountApplied` prop; show coupon discount label |
| `client/src/pages/student/CompleteEnrollmentPopup.tsx` | Remove `hasSavedDiscount`; pass `couponDiscountApplied` from `enrollment.discountApplied` |
| `client/src/pages/admin/AdminReferrals.tsx` | Add usage-log section to CouponsTab + OffersTab |

---

## Task 1: Wire the backend tracking route

**Files:**
- Modify: `server/src/routes/coupon.route.js`

- [ ] **Step 1: Add the import and route**

Open `server/src/routes/coupon.route.js`. The file currently imports 6 named exports from the controller. Add `getCouponUsageTracking` to that import and add a GET route for `/tracking` **before** the `/:id` route (otherwise Express will try to match `tracking` as an `:id`).

Replace the import line and add the route:

```js
import { Router } from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import {
  createCoupon, getCoupons, getCoupon, updateCoupon, deleteCoupon,
  validateCoupon, getCouponUsageTracking,
} from '../controllers/coupon.controller.js'

const router = Router()

router.route('/validate').post(authenticate, validateCoupon)

router.route('/tracking').get(authenticate, authorizeTeamPage('referrals'), getCouponUsageTracking)

router.route('/')
  .get(authenticate, authorizeTeamPage('referrals'), getCoupons)
  .post(authenticate, authorizeTeamPage('referrals'), createCoupon)

router.route('/:id')
  .get(authenticate, authorizeTeamPage('referrals'), getCoupon)
  .patch(authenticate, authorizeTeamPage('referrals'), updateCoupon)
  .delete(authenticate, authorizeTeamPage('referrals'), deleteCoupon)

export default router
```

- [ ] **Step 2: Verify the server restarts without errors**

In the terminal where the server runs (`npm run dev` inside `server/`), confirm no import/syntax error is logged.

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/coupon.route.js
git commit -m "feat: expose GET /api/v1/coupons/tracking route for admin usage log"
```

---

## Task 2: Add `getUsageTracking` to the coupons service

**Files:**
- Modify: `client/src/services/coupons.service.ts`

- [ ] **Step 1: Add the method**

The tracking endpoint accepts `?page=&limit=&type=coupon|offer` and returns `{ success, data: CouponUsageRecord[], pagination }`.

Add this method to the `couponsService` object (after `deleteCoupon`):

```ts
async getUsageTracking(params?: {
  page?: number
  limit?: number
  type?: 'coupon' | 'offer'
}) {
  const res = await axiosClient.get('/coupons/tracking', { params })
  return res.data as {
    success: boolean
    data: Array<{
      _id: string
      student: { _id: string; name: string; email: string } | null
      course: { _id: string; title: string; price?: number; priceUSD?: number; currency?: string } | null
      coupon: { _id: string; code: string; discountType: string; discountValue: number; source: string } | null
      offer: { _id: string; title: string; discountType: string; discountValue: number } | null
      discountApplied: number
      offerDiscountApplied: number
      totalDiscount: number
      isActive: boolean
      enrolledAt: string
    }>
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }
},
```

- [ ] **Step 2: Commit**

```bash
git add client/src/services/coupons.service.ts
git commit -m "feat: add getUsageTracking method to coupons service"
```

---

## Task 3: CourseDetailsPage — show coupon-adjusted price

**Files:**
- Modify: `client/src/pages/CourseDetailsPage.tsx`

The sidebar already validates a coupon and stores the result in `couponResult`. But when the coupon is valid the big price in the sidebar still shows the original/offer price — this task fixes that.

The coupon validate API (`POST /api/v1/coupons/validate`) returns:
```json
{ "valid": true, "discountAmount": 500, "finalPrice": 4500, "originalPrice": 5000, "discountType": "...", "discountValue": 10 }
```

`finalPrice` is the price after coupon only. If an offer is also active, we must further subtract `couponResult.discountAmount` from `priceResult.discountedPrice`.

- [ ] **Step 1: Extend the coupon result type**

Find the `useState` for `couponResult` (around line 142). Update its type to include `finalPrice` and `originalPrice`:

```ts
const [couponResult, setCouponResult] = useState<{
  valid: boolean
  reason?: string
  discountType?: string
  discountValue?: number
  discountAmount?: number
  finalPrice?: number
  originalPrice?: number
} | null>(null)
```

- [ ] **Step 2: Compute the combined display price**

Add this derived value after the `priceResult` computation (around line 257-259). Place it right after:
```ts
const priceResult = apiCourse && currency === 'PKR'
  ? getDiscountedPrice(apiCourse._id, apiCourse.price ?? 0, activeOffers)
  : null
```

Add:
```ts
const couponAdjustedPrice: number | null = (() => {
  if (!couponResult?.valid || couponResult.discountAmount == null) return null
  const base = priceResult?.hasDiscount ? priceResult.discountedPrice : (apiCourse?.price ?? 0)
  return Math.max(0, base - couponResult.discountAmount)
})()
```

- [ ] **Step 3: Update the sidebar price block**

Find the price display in the sticky sidebar (starts around line 807). Currently it renders:
```tsx
<span className="text-4xl font-black ...">
  {priceResult?.hasDiscount
    ? `Rs.${priceResult.discountedPrice.toLocaleString()}...`
    : activeCourse.price}
</span>
{priceResult?.hasDiscount && (
  <span className="... line-through ...">Rs.{priceResult.originalPrice}...</span>
)}
```

Replace the entire price + discount block (the `<div className="flex items-center justify-between mb-2">...</div>` through the offer-title line before the coupon input) with:

```tsx
<div className="flex items-center justify-between mb-2">
  <div className="flex items-end gap-3">
    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
      {couponAdjustedPrice != null
        ? `Rs.${couponAdjustedPrice.toLocaleString()}${pricingTypeSuffix}`
        : priceResult?.hasDiscount
          ? `Rs.${priceResult.discountedPrice.toLocaleString()}${pricingTypeSuffix}`
          : activeCourse.price}
    </span>
    {(couponAdjustedPrice != null || priceResult?.hasDiscount) && (
      <span className="text-lg text-slate-400 dark:text-neutral-500 line-through mb-1 font-semibold">
        {priceResult?.hasDiscount && couponAdjustedPrice != null
          ? `Rs.${priceResult.discountedPrice.toLocaleString()}${pricingTypeSuffix}`
          : priceResult?.hasDiscount
            ? `Rs.${priceResult.originalPrice.toLocaleString()}${pricingTypeSuffix}`
            : activeCourse.price}
      </span>
    )}
  </div>
  <div className="flex flex-col items-end gap-1">
    {priceResult?.hasDiscount && (
      <div className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
        <Tag size={12} weight="fill" />
        {priceResult.discountLabel}
      </div>
    )}
    {couponResult?.valid && (
      <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
        <Tag size={12} weight="fill" />
        Coupon applied
      </div>
    )}
  </div>
</div>
{priceResult?.hasDiscount && priceResult.offer?.title && !couponResult?.valid && (
  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-bold mb-6">
    <Tag size={14} weight="bold" />
    <span>{priceResult.offer.title} applied</span>
  </div>
)}
{couponResult?.valid && (
  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-6">
    <Tag size={14} weight="bold" />
    <span>
      {couponResult.discountType === 'percentage'
        ? `${couponResult.discountValue}% coupon applied`
        : `PKR ${couponResult.discountAmount?.toLocaleString()} coupon applied`}
      {priceResult?.hasDiscount && ` + ${priceResult.discountLabel} offer`}
    </span>
  </div>
)}
```

- [ ] **Step 4: Update the mobile sticky bottom bar**

Find the mobile sticky bar (around line 1250). Currently:
```tsx
<div className="text-2xl font-black text-slate-900 dark:text-white">
  {priceResult?.hasDiscount ? `Rs.${priceResult.discountedPrice...}` : activeCourse.price}
</div>
```

Replace the price text with:
```tsx
<div className="text-2xl font-black text-slate-900 dark:text-white">
  {couponAdjustedPrice != null
    ? `Rs.${couponAdjustedPrice.toLocaleString()}${pricingTypeSuffix}`
    : priceResult?.hasDiscount
      ? `Rs.${priceResult.discountedPrice.toLocaleString()}${pricingTypeSuffix}`
      : activeCourse.price}
</div>
```

Also update the line-through display in the mobile bar if present (the `priceResult?.hasDiscount` strikethrough block) to also show the original price when only coupon is applied:
```tsx
{(couponAdjustedPrice != null || priceResult?.hasDiscount) && (
  <div className="text-xs text-slate-500 dark:text-neutral-400 font-bold mb-0.5 line-through">
    {priceResult?.hasDiscount && couponAdjustedPrice != null
      ? `Rs.${priceResult.discountedPrice.toLocaleString()}${pricingTypeSuffix}`
      : priceResult?.hasDiscount
        ? `Rs.${priceResult.originalPrice.toLocaleString()}${pricingTypeSuffix}`
        : activeCourse.price}
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/CourseDetailsPage.tsx
git commit -m "feat: show coupon-adjusted price in course details sidebar and mobile bar"
```

---

## Task 4: PaymentSubmitModal — remove coupon input, add coupon discount label

**Files:**
- Modify: `client/src/pages/student/PaymentSubmitModal.tsx`

The goal: remove ALL coupon-related state, logic and UI. Add a `couponDiscountApplied?: number` prop so the modal can display a "Coupon applied" label without needing user input.

- [ ] **Step 1: Remove `Tag` and `Spinner` from the icon import**

Find the import at the top (line 7):
```ts
import {
  X, UploadSimple, CheckCircle, WarningCircle, Phone, Envelope,
  ArrowRight, ShieldCheck, Clock, Sparkle, Bank, ArrowLeft, Globe,
  Tag, Spinner, BookOpen,
} from '@phosphor-icons/react'
```

Remove `Tag` and `Spinner`:
```ts
import {
  X, UploadSimple, CheckCircle, WarningCircle, Phone, Envelope,
  ArrowRight, ShieldCheck, Clock, Sparkle, Bank, ArrowLeft, Globe,
  BookOpen,
} from '@phosphor-icons/react'
```

- [ ] **Step 2: Remove the `couponsService` import**

Delete the line:
```ts
import { couponsService } from '@/services/coupons.service'
```

- [ ] **Step 3: Update the Props interface**

Find the `interface Props` block. Remove `hasSavedDiscount` and add `couponDiscountApplied`:

```ts
interface Props {
  courseId: string
  teacherId: string
  courseName?: string
  coursePrice?: number
  courseCurrency?: 'PKR' | 'USD'
  pricingType?: 'monthly' | 'full_course' | 'per_session'
  offerDiscountedPrice?: number | null
  offerLabel?: string
  couponDiscountApplied?: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

- [ ] **Step 4: Update the destructured props**

Find the function signature:
```ts
export default function PaymentSubmitModal({
  courseId, teacherId, courseName, coursePrice, courseCurrency,
  pricingType,
  offerDiscountedPrice, offerLabel, hasSavedDiscount, isOpen, onClose, onSuccess
}: Props) {
```

Replace with:
```ts
export default function PaymentSubmitModal({
  courseId, teacherId, courseName, coursePrice, courseCurrency,
  pricingType,
  offerDiscountedPrice, offerLabel, couponDiscountApplied,
  isOpen, onClose, onSuccess
}: Props) {
```

- [ ] **Step 5: Remove coupon state and handler**

Delete the following lines entirely (they are near the top of the function body, around lines 194–197 and 227–243):

```ts
const [couponCode, setCouponCode] = useState('')
const [couponValidating, setCouponValidating] = useState(false)
const [couponResult, setCouponResult] = useState<{ valid: boolean; reason?: string; discountType?: string; discountValue?: number; discountAmount?: number } | null>(null)
const couponDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
```

And the `handleCouponChange` function:
```ts
const handleCouponChange = (value: string) => {
  setCouponCode(value)
  setCouponResult(null)
  if (couponDebounceTimer.current) clearTimeout(couponDebounceTimer.current)
  if (!value.trim()) { setCouponValidating(false); return }
  setCouponValidating(true)
  couponDebounceTimer.current = setTimeout(async () => {
    try {
      const res = await couponsService.validateCoupon(value.trim(), courseId)
      setCouponResult(res.data)
    } catch {
      setCouponResult({ valid: false, reason: 'Unable to validate coupon' })
    } finally {
      setCouponValidating(false)
    }
  }, 500)
}
```

- [ ] **Step 6: Update the `reset` function**

Find the `reset` function. Remove these lines from it:
```ts
setCouponCode('')
setCouponResult(null)
setCouponValidating(false)
if (couponDebounceTimer.current) clearTimeout(couponDebounceTimer.current)
```

- [ ] **Step 7: Remove coupon code from `handleSubmit`**

Find inside `handleSubmit`:
```ts
couponCode: couponResult?.valid ? couponCode.trim().toUpperCase() : undefined,
```
Delete that line entirely. The coupon is now stored on the enrollment, not re-sent with payment.

- [ ] **Step 8: Remove the coupon input JSX block**

In Step 2 of the form (inside `{selectedId && selectedMethod && (...)}`) find and delete the entire block:
```tsx
{!hasSavedDiscount && (
  <div>
    <label className="block text-xs font-bold ...">
      Coupon Code <span className="normal-case font-normal">(optional)</span>
    </label>
    <div className="relative">
      <Tag ... />
      <input
        value={couponCode}
        onChange={e => handleCouponChange(e.target.value)}
        ...
      />
      {couponValidating && <Spinner ... />}
      {!couponValidating && couponResult?.valid && <CheckCircle ... />}
      {!couponValidating && couponResult && !couponResult.valid && <WarningCircle ... />}
    </div>
    {couponResult?.valid && (<p ...>✓ ...</p>)}
    {couponResult && !couponResult.valid && (<p ...>{couponResult.reason}</p>)}
  </div>
)}
```

- [ ] **Step 9: Add the coupon discount label below the amount field**

Find the block after the amount input that shows `offerLabel`:
```tsx
{offerLabel && offerDiscountedPrice && (
  <p className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 mt-1 font-semibold">
    <CheckCircle size={12} weight="fill" />
    {offerLabel} applied — pay {courseCurrency === 'USD' ? `$${offerDiscountedPrice}...` : `Rs.${offerDiscountedPrice.toLocaleString()}...`}
  </p>
)}
```

Add immediately after it:
```tsx
{couponDiscountApplied != null && couponDiscountApplied > 0 && (
  <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
    <CheckCircle size={12} weight="fill" />
    Coupon discount applied — {currency === 'USD' ? `$${couponDiscountApplied}` : `Rs.${couponDiscountApplied.toLocaleString()}`} off
  </p>
)}
```

- [ ] **Step 10: Commit**

```bash
git add client/src/pages/student/PaymentSubmitModal.tsx
git commit -m "feat: remove coupon input from payment modal, add coupon discount label"
```

---

## Task 5: CompleteEnrollmentPopup — pass coupon discount separately

**Files:**
- Modify: `client/src/pages/student/CompleteEnrollmentPopup.tsx`

The enrollment record already stores `discountApplied` (from coupon) and `offerDiscountApplied` (from offer) separately. Pass them separately to `PaymentSubmitModal`.

- [ ] **Step 1: Update the PaymentSubmitModal invocation**

Find the IIFE block that builds the `PaymentSubmitModal` call (starting around line 116). Currently:
```tsx
const savedDiscount = (selectedEnrollment.discountApplied || 0) + (selectedEnrollment.offerDiscountApplied || 0)
const hasSavedDiscount = savedDiscount > 0
const discountedPrice = hasSavedDiscount ? Math.max(0, originalPrice - savedDiscount) : undefined
return (
  <PaymentSubmitModal
    ...
    offerDiscountedPrice={hasSavedDiscount ? discountedPrice : undefined}
    offerLabel={hasSavedDiscount ? 'Discount' : undefined}
    hasSavedDiscount={hasSavedDiscount}
    ...
  />
)
```

Replace it with:
```tsx
const couponDiscount = selectedEnrollment.discountApplied || 0
const offerDiscount = selectedEnrollment.offerDiscountApplied || 0
const totalDiscount = couponDiscount + offerDiscount
const discountedPrice = totalDiscount > 0 ? Math.max(0, originalPrice - totalDiscount) : undefined
return (
  <PaymentSubmitModal
    courseId={selectedEnrollment.course._id}
    teacherId={selectedEnrollment.teacher._id}
    courseName={selectedEnrollment.course.title}
    coursePrice={originalPrice}
    courseCurrency={selectedEnrollment.course.currency}
    pricingType={selectedEnrollment.course.pricingType}
    offerDiscountedPrice={discountedPrice}
    offerLabel={offerDiscount > 0 ? 'Offer discount' : undefined}
    couponDiscountApplied={couponDiscount > 0 ? couponDiscount : undefined}
    isOpen={true}
    onClose={() => setSelectedEnrollment(null)}
    onSuccess={() => {
      setSelectedEnrollment(null)
      onPaymentSuccess()
    }}
  />
)
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/student/CompleteEnrollmentPopup.tsx
git commit -m "feat: pass coupon and offer discounts separately to payment modal"
```

---

## Task 6: Admin — add usage tracking to Coupons and Offers tabs

**Files:**
- Modify: `client/src/pages/admin/AdminReferrals.tsx`

Add a toggleable "Usage Log" table at the bottom of `CouponsTab` and `OffersTab`. Both use the same `couponsService.getUsageTracking()` call, filtered by type.

- [ ] **Step 1: Add state and data-fetching logic to `CouponsTab`**

In `CouponsTab`, add state for the usage log section:
```tsx
const [showTracking, setShowTracking] = useState(false)
const [tracking, setTracking] = useState<any[]>([])
const [trackingLoading, setTrackingLoading] = useState(false)
const [trackingTotal, setTrackingTotal] = useState(0)
```

Add a `loadTracking` function inside `CouponsTab`:
```tsx
const loadTracking = useCallback(async () => {
  setTrackingLoading(true)
  try {
    const res = await couponsService.getUsageTracking({ type: 'coupon', limit: 50 })
    if (res.success) {
      setTracking(res.data)
      setTrackingTotal(res.pagination.total)
    }
  } catch { toast.error('Failed to load usage tracking') }
  finally { setTrackingLoading(false) }
}, [])
```

Call it when the toggle is turned on:
```tsx
const handleToggleTracking = () => {
  if (!showTracking && tracking.length === 0) loadTracking()
  setShowTracking(s => !s)
}
```

- [ ] **Step 2: Add the tracking toggle button to `CouponsTab` header**

In the `<div className="flex items-center justify-between mb-4 ...">` that contains the filters and "Create Coupon" button, add a third button between them:

```tsx
<button
  onClick={handleToggleTracking}
  className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
>
  <ChartBar size={15} />
  {showTracking ? 'Hide Usage Log' : `Usage Log${trackingTotal > 0 ? ` (${trackingTotal})` : ''}`}
</button>
```

Add `ChartBar` to the Phosphor import at the top of the file.

- [ ] **Step 3: Add the tracking table below the coupons table in `CouponsTab`**

After the coupon table and after the `{showModal && ...}` and `<ConfirmModal ...>` blocks, add:

```tsx
{showTracking && (
  <div className="mt-6">
    <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-200 mb-3">
      Coupon Usage Log
      {trackingTotal > 0 && (
        <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-neutral-500">
          ({trackingTotal} total uses)
        </span>
      )}
    </h3>
    {trackingLoading ? (
      <div className="text-center py-8 text-slate-400">Loading…</div>
    ) : tracking.length === 0 ? (
      <div className="text-center py-8 text-slate-400">No coupon usage recorded yet</div>
    ) : (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
            <tr>
              {['Date', 'Student', 'Course', 'Code', 'Discount Type', 'Amount Saved', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
            {tracking.map(t => (
              <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(t.enrolledAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">{t.student?.name ?? '—'}</p>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500">{t.student?.email ?? ''}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-neutral-300 text-xs max-w-[160px] truncate">
                  {t.course?.title ?? '—'}
                </td>
                <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400 text-xs">
                  {t.coupon?.code ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-neutral-400 text-xs">
                  {t.coupon?.discountType === 'percentage' ? `${t.coupon.discountValue}%` : `PKR ${t.coupon?.discountValue ?? 0}`}
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  PKR {t.discountApplied.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                    {t.isActive ? 'Active' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 4: Add usage tracking to `OffersTab`**

In `OffersTab`, add the same state pattern and a different toggle for offer tracking:

```tsx
const [showOfferTracking, setShowOfferTracking] = useState(false)
const [offerTracking, setOfferTracking] = useState<any[]>([])
const [offerTrackingLoading, setOfferTrackingLoading] = useState(false)
const [offerTrackingTotal, setOfferTrackingTotal] = useState(0)

const loadOfferTracking = useCallback(async () => {
  setOfferTrackingLoading(true)
  try {
    const res = await couponsService.getUsageTracking({ type: 'offer', limit: 50 })
    if (res.success) {
      setOfferTracking(res.data)
      setOfferTrackingTotal(res.pagination.total)
    }
  } catch { toast.error('Failed to load offer tracking') }
  finally { setOfferTrackingLoading(false) }
}, [])

const handleToggleOfferTracking = () => {
  if (!showOfferTracking && offerTracking.length === 0) loadOfferTracking()
  setShowOfferTracking(s => !s)
}
```

Add the toggle button to the OffersTab header (next to "Refresh" and "Create Offer"):

```tsx
<button
  onClick={handleToggleOfferTracking}
  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-neutral-700 rounded-xl transition-colors"
>
  <ChartBar size={15} />
  {showOfferTracking ? 'Hide Usage' : `Usage Log${offerTrackingTotal > 0 ? ` (${offerTrackingTotal})` : ''}`}
</button>
```

Add the offer tracking table below the offers table and modals (same structure as coupon tracking but uses `offerTracking` state and shows offer name column instead of coupon code):

```tsx
{showOfferTracking && (
  <div className="mt-6">
    <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-200 mb-3">
      Offer Usage Log
      {offerTrackingTotal > 0 && (
        <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-neutral-500">
          ({offerTrackingTotal} total applications)
        </span>
      )}
    </h3>
    {offerTrackingLoading ? (
      <div className="text-center py-8 text-slate-400">Loading…</div>
    ) : offerTracking.length === 0 ? (
      <div className="text-center py-8 text-slate-400">No offer usage recorded yet</div>
    ) : (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
            <tr>
              {['Date', 'Student', 'Course', 'Offer Name', 'Discount', 'Amount Saved', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
            {offerTracking.map(t => (
              <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(t.enrolledAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">{t.student?.name ?? '—'}</p>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500">{t.student?.email ?? ''}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-neutral-300 text-xs max-w-[160px] truncate">
                  {t.course?.title ?? '—'}
                </td>
                <td className="px-4 py-3 font-semibold text-violet-600 dark:text-violet-400 text-xs">
                  {t.offer?.title ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-neutral-400 text-xs">
                  {t.offer?.discountType === 'percentage' ? `${t.offer.discountValue}%` : `PKR ${t.offer?.discountValue ?? 0}`}
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  PKR {t.offerDiscountApplied.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                    {t.isActive ? 'Active' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: Add `ChartBar` to the Phosphor import at the top of AdminReferrals.tsx**

Find:
```ts
import { Tag, Gift, Users, Wallet, Plus, Trash, ToggleLeft, ToggleRight, Copy, Check, X, Percent, PencilSimple } from '@phosphor-icons/react'
```

Add `ChartBar`:
```ts
import { Tag, Gift, Users, Wallet, Plus, Trash, ToggleLeft, ToggleRight, Copy, Check, X, Percent, PencilSimple, ChartBar } from '@phosphor-icons/react'
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/admin/AdminReferrals.tsx
git commit -m "feat: add usage log tracking to admin coupons and offers tabs"
```

---

## Task 7: Final integration check

- [ ] **Step 1: Start both dev servers and verify the course details page**

Run `npm run dev` in `server/` and `npm run dev` in `client/`. Navigate to a course details page that has a price. Enter a valid coupon code in the sidebar input. Verify:
- The big price in the sidebar updates to show the discounted amount
- A strikethrough of the pre-coupon price appears
- "Coupon applied" badge appears
- The mobile sticky bar (scroll down) also shows the updated price

- [ ] **Step 2: Verify the payment modal has no coupon input**

From the student dashboard (`/dashboard/courses`), open "Complete Enrollment" for a pending enrollment. Verify:
- There is NO coupon code input field in the payment form
- If the enrollment has `discountApplied > 0`, the modal shows the discounted amount in the course info banner and the "Coupon discount applied: PKR X off" label under the amount field

- [ ] **Step 3: Verify admin tracking**

Log in as admin, go to "Referrals & Coupons" → "Coupon Codes" tab. Click "Usage Log" button. Verify the table loads (may be empty if no coupons used yet — that is fine). Go to "Offers & Discounts" tab, click "Usage Log", verify the same.

- [ ] **Step 4: Final commit**

```bash
git add -A
git status  # verify only expected files changed
git commit -m "feat: coupon on course page, remove from payment modal, admin usage tracking"
```
