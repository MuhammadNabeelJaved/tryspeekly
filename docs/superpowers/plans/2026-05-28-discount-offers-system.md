# Discount Offers Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete discount offers system where admin creates time-bounded platform-wide or course-specific sales, students see auto-applied discounted prices on course pages, and the admin panel has an Offers tab and scrolling ticker.

**Architecture:** A new `Offer` Mongoose model stores offers. A shared server-side utility computes the effective price for a course given active offers. The payment controller validates submitted amounts against the discounted price. On the frontend, a mirrored utility + a React context-free data fetch enriches course cards and the detail page.

**Tech Stack:** Node.js/Express ESM, Mongoose, React + TypeScript + Tailwind, Phosphor Icons, Framer Motion, Axios

---

## File Map

### New files
| Path | Purpose |
|---|---|
| `server/src/models/offer.model.js` | Mongoose schema for offers |
| `server/src/utils/offerUtils.js` | `getEffectivePrice(courseId, offers)` pure helper |
| `server/src/controllers/offer.controller.js` | CRUD + active-offers handler |
| `server/src/routes/offer.route.js` | Express router |
| `client/src/services/offers.service.ts` | Frontend API calls |
| `client/src/utils/offerUtils.ts` | `getDiscountedPrice(course, offers)` client helper |

### Modified files
| Path | Change |
|---|---|
| `server/app.js` | Register `/api/v1/offers` route |
| `server/src/controllers/payment.controller.js` | Apply offer discount before saving payment |
| `client/src/pages/admin/AdminReferrals.tsx` | Add Offers tab + OffersTab + modals |
| `client/src/pages/AdminPage.tsx` | Add `<OffersMarquee />` above topbar |
| `client/src/components/Courses.tsx` | Fetch offers, show discounted prices on course cards |
| `client/src/pages/CourseDetailsPage.tsx` | Fetch offers, show discounted price in sidebar + header |
| `client/src/pages/student/PaymentSubmitModal.tsx` | Accept `offerDiscountedPrice` prop, pre-fill amount |

---

## Task 1: Offer Model

**Files:**
- Create: `server/src/models/offer.model.js`

- [ ] **Step 1: Create the model file**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const offerSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    bannerText: {
      type: String,
      trim: true,
      maxlength: [200, 'Banner text cannot exceed 200 characters'],
      default: '',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0.01, 'Discount value must be greater than 0'],
    },
    scope: {
      type: String,
      enum: ['platform', 'course'],
      required: [true, 'Scope is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      validate: {
        validator: function (v) {
          return this.scope !== 'course' || v != null
        },
        message: 'course is required when scope is "course"',
      },
    },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  { timestamps: true, versionKey: false }
)

// ─── Percentage upper bound ───────────────────────────────────────────────────
offerSchema.pre('validate', function () {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    this.invalidate('discountValue', 'Percentage discount cannot exceed 100')
  }
})

offerSchema.index({ isActive: 1, scope: 1 })
offerSchema.index({ course: 1, isActive: 1 })

const Offer = mongoose.models.Offer || model('Offer', offerSchema)

export default Offer
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd server && node --input-type=module < /dev/null || echo "check manually"
```
Just open the file and scan for obvious issues — no test runner needed for a model.

- [ ] **Step 3: Commit**

```bash
git add server/src/models/offer.model.js
git commit -m "feat: add Offer mongoose model"
```

---

## Task 2: Server-Side Offer Utility

**Files:**
- Create: `server/src/utils/offerUtils.js`

- [ ] **Step 1: Create the utility**

```js
import { Types } from 'mongoose'

/**
 * Returns the effective price for a course given an array of active offer docs.
 * Priority: course-specific offer > platform-wide offer (highest discount wins per type).
 *
 * @param {string|Types.ObjectId} courseId
 * @param {number} originalPrice  — in PKR (course.price)
 * @param {Array}  offers         — array of Offer documents
 * @returns {{ discountedPrice: number, offer: object|null }}
 */
export function getEffectivePrice(courseId, originalPrice, offers) {
  if (!originalPrice || !offers || offers.length === 0) {
    return { discountedPrice: originalPrice, offer: null }
  }

  const now = new Date()
  const courseIdStr = courseId?.toString()

  const activeOffers = offers.filter(o => {
    if (!o.isActive) return false
    if (o.startsAt && o.startsAt > now) return false
    if (o.endsAt && o.endsAt < now) return false
    return true
  })

  // Separate course-specific and platform-wide
  const courseOffers = activeOffers.filter(
    o => o.scope === 'course' && o.course?.toString() === courseIdStr
  )
  const platformOffers = activeOffers.filter(o => o.scope === 'platform')

  // Pick best offer: course-specific first, else platform (highest discount)
  const candidates = courseOffers.length > 0 ? courseOffers : platformOffers
  if (candidates.length === 0) return { discountedPrice: originalPrice, offer: null }

  const best = candidates.reduce((prev, curr) => {
    const prevDiscount = prev.discountType === 'percentage'
      ? (originalPrice * prev.discountValue) / 100
      : prev.discountValue
    const currDiscount = curr.discountType === 'percentage'
      ? (originalPrice * curr.discountValue) / 100
      : curr.discountValue
    return currDiscount > prevDiscount ? curr : prev
  })

  let discountAmount = best.discountType === 'percentage'
    ? Math.round((originalPrice * best.discountValue) / 100)
    : Math.min(best.discountValue, originalPrice)

  const discountedPrice = Math.max(0, originalPrice - discountAmount)
  return { discountedPrice, offer: best }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/utils/offerUtils.js
git commit -m "feat: add server-side getEffectivePrice utility"
```

---

## Task 3: Offer Controller and Routes

**Files:**
- Create: `server/src/controllers/offer.controller.js`
- Create: `server/src/routes/offer.route.js`

- [ ] **Step 1: Create the controller**

```js
import asyncHandler from '../utils/asyncHandler.js'
import Offer from '../models/offer.model.js'
import { BadRequestError, NotFoundError } from '../utils/apiErrors.js'

// ─── GET /api/v1/offers/active (public) ──────────────────────────────────────
export const getActiveOffers = asyncHandler(async (req, res) => {
  const now = new Date()
  const offers = await Offer.find({
    isActive: true,
    $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
    $or: [{ endsAt: null }, { endsAt: { $gte: now } }],
  })
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, data: offers })
})

// ─── GET /api/v1/offers (admin) ───────────────────────────────────────────────
export const getAllOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find()
    .populate('course', 'title')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, data: offers })
})

// ─── POST /api/v1/offers (admin) ──────────────────────────────────────────────
export const createOffer = asyncHandler(async (req, res) => {
  const { title, bannerText, discountType, discountValue, scope, courseId, isActive, startsAt, endsAt } = req.body

  if (!title || !discountType || discountValue == null || !scope) {
    throw new BadRequestError('title, discountType, discountValue, and scope are required')
  }
  if (scope === 'course' && !courseId) {
    throw new BadRequestError('courseId is required when scope is "course"')
  }

  const offer = await Offer.create({
    title,
    bannerText: bannerText || '',
    discountType,
    discountValue: Number(discountValue),
    scope,
    course: scope === 'course' ? courseId : null,
    isActive: isActive !== false,
    startsAt: startsAt || null,
    endsAt: endsAt || null,
    createdBy: req.user.id,
  })

  await offer.populate('course', 'title')
  res.status(201).json({ success: true, message: 'Offer created', data: offer })
})

// ─── PATCH /api/v1/offers/:id (admin) ────────────────────────────────────────
export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
  if (!offer) throw new NotFoundError('Offer not found')

  const allowed = ['title', 'bannerText', 'discountType', 'discountValue', 'scope', 'isActive', 'startsAt', 'endsAt']
  allowed.forEach(key => {
    if (req.body[key] !== undefined) offer[key] = req.body[key]
  })
  if (req.body.courseId !== undefined) {
    offer.course = req.body.courseId || null
  }

  await offer.save()
  await offer.populate('course', 'title')
  res.json({ success: true, message: 'Offer updated', data: offer })
})

// ─── DELETE /api/v1/offers/:id (admin) ───────────────────────────────────────
export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id)
  if (!offer) throw new NotFoundError('Offer not found')
  res.status(204).send()
})
```

- [ ] **Step 2: Create the route file**

```js
import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { getActiveOffers, getAllOffers, createOffer, updateOffer, deleteOffer } from '../controllers/offer.controller.js'

const router = Router()

// Public
router.get('/active', getActiveOffers)

// Admin
router.route('/')
  .get(authenticate, authorize('admin'), getAllOffers)
  .post(authenticate, authorize('admin'), createOffer)

router.route('/:id')
  .patch(authenticate, authorize('admin'), updateOffer)
  .delete(authenticate, authorize('admin'), deleteOffer)

export default router
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/offer.controller.js server/src/routes/offer.route.js
git commit -m "feat: add offer controller and routes"
```

---

## Task 4: Register Route in app.js

**Files:**
- Modify: `server/app.js`

- [ ] **Step 1: Add import after the existing referralRoutes import (line 80)**

```js
import offerRoutes from './src/routes/offer.route.js'
```

- [ ] **Step 2: Mount the router after line `app.use('/api/v1/referrals', referralRoutes)` (line 106)**

```js
app.use('/api/v1/offers', offerRoutes)
```

- [ ] **Step 3: Verify server starts without errors**

```bash
cd server && node index.js
```
Expected: `Server running on port 5000` — no import errors.

- [ ] **Step 4: Commit**

```bash
git add server/app.js
git commit -m "feat: register /api/v1/offers route"
```

---

## Task 5: Integrate Offer Discount in Payment Controller

**Files:**
- Modify: `server/src/controllers/payment.controller.js`

- [ ] **Step 1: Add import at top of the file (after existing imports)**

```js
import Offer from '../models/offer.model.js'
import { getEffectivePrice } from '../utils/offerUtils.js'
```

- [ ] **Step 2: Inside `createPayment`, after the coupon discount block (after line ~47), add offer discount resolution**

Find this existing code:
```js
    let couponDoc = null
    let discountApplied = 0
```

Replace it with:
```js
    let couponDoc = null
    let discountApplied = 0
    let offerDiscountApplied = 0
    let offerDoc = null
```

- [ ] **Step 3: After the coupon block ends (after the closing `}` of the `if (couponCode)` block, around line 47), add the offer calculation block**

Add this code between the coupon block and `Payment.create`:
```js
    // ─── Apply active offer discount ──────────────────────────────────────────
    const now = new Date()
    const activeOffers = await Offer.find({
      isActive: true,
      $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
    }).lean()
    const filteredOffers = activeOffers.filter(o => !o.endsAt || o.endsAt >= now)

    const course = await Course.findById(courseId)
    if (course) {
      const { discountedPrice, offer } = getEffectivePrice(courseId, course.price, filteredOffers)
      if (offer) {
        offerDiscountApplied = course.price - discountedPrice
        offerDoc = offer
      }
    }
```

- [ ] **Step 4: Update `Payment.create` call to include offer fields**

Find:
```js
    const payment = await Payment.create({
      student: req.user.id,
      course: courseId,
      teacher: teacherId,
      method,
      transactionId,
      screenshotUrl: result.secure_url,
      amount,
      currency: currency || 'PKR',
      coupon: couponDoc ? couponDoc._id : null,
      discountApplied,
    })
```

Replace with:
```js
    const payment = await Payment.create({
      student: req.user.id,
      course: courseId,
      teacher: teacherId,
      method,
      transactionId,
      screenshotUrl: result.secure_url,
      amount,
      currency: currency || 'PKR',
      coupon: couponDoc ? couponDoc._id : null,
      discountApplied: discountApplied + offerDiscountApplied,
      offerDiscountApplied,
      offer: offerDoc ? offerDoc._id : null,
    })
```

- [ ] **Step 5: Add `offerDiscountApplied` and `offer` fields to the Payment model**

Open `server/src/models/payment.model.js`, find the schema definition, and add these fields alongside the existing `coupon` and `discountApplied` fields:
```js
    offerDiscountApplied: { type: Number, default: 0 },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
```

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/payment.controller.js server/src/models/payment.model.js
git commit -m "feat: apply active offer discount in payment submission"
```

---

## Task 6: Frontend Offer Service

**Files:**
- Create: `client/src/services/offers.service.ts`

- [ ] **Step 1: Create the service**

```ts
import { axiosClient } from '../lib/axiosClient'

export interface Offer {
  _id: string
  title: string
  bannerText: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  scope: 'platform' | 'course'
  course: { _id: string; title: string } | null
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

export const offersService = {
  async getActiveOffers(): Promise<{ success: boolean; data: Offer[] }> {
    const res = await axiosClient.get('/offers/active')
    return res.data
  },

  async getAdminOffers(): Promise<{ success: boolean; data: Offer[] }> {
    const res = await axiosClient.get('/offers')
    return res.data
  },

  async createOffer(dto: {
    title: string
    bannerText: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    scope: 'platform' | 'course'
    courseId?: string
    isActive: boolean
    startsAt?: string | null
    endsAt?: string | null
  }): Promise<{ success: boolean; data: Offer }> {
    const res = await axiosClient.post('/offers', dto)
    return res.data
  },

  async updateOffer(id: string, dto: Partial<{
    title: string
    bannerText: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    scope: 'platform' | 'course'
    courseId: string | null
    isActive: boolean
    startsAt: string | null
    endsAt: string | null
  }>): Promise<{ success: boolean; data: Offer }> {
    const res = await axiosClient.patch(`/offers/${id}`, dto)
    return res.data
  },

  async deleteOffer(id: string): Promise<void> {
    await axiosClient.delete(`/offers/${id}`)
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/services/offers.service.ts
git commit -m "feat: add frontend offers service"
```

---

## Task 7: Frontend Offer Utility

**Files:**
- Create: `client/src/utils/offerUtils.ts`

- [ ] **Step 1: Create the utility**

```ts
import type { Offer } from '@/services/offers.service'

export interface DiscountResult {
  originalPrice: number
  discountedPrice: number
  discountLabel: string
  hasDiscount: boolean
  offer: Offer | null
}

/**
 * Mirrors the server-side getEffectivePrice logic.
 * courseId — the course _id string
 * originalPrice — PKR price (course.price or pricePKR)
 * offers — from offersService.getActiveOffers()
 */
export function getDiscountedPrice(
  courseId: string,
  originalPrice: number,
  offers: Offer[]
): DiscountResult {
  const empty: DiscountResult = {
    originalPrice,
    discountedPrice: originalPrice,
    discountLabel: '',
    hasDiscount: false,
    offer: null,
  }

  if (!originalPrice || offers.length === 0) return empty

  const now = new Date()
  const active = offers.filter(o => {
    if (!o.isActive) return false
    if (o.startsAt && new Date(o.startsAt) > now) return false
    if (o.endsAt && new Date(o.endsAt) < now) return false
    return true
  })

  const courseOffers = active.filter(
    o => o.scope === 'course' && o.course?._id === courseId
  )
  const platformOffers = active.filter(o => o.scope === 'platform')
  const candidates = courseOffers.length > 0 ? courseOffers : platformOffers

  if (candidates.length === 0) return empty

  const best = candidates.reduce((prev, curr) => {
    const prevAmt = prev.discountType === 'percentage'
      ? (originalPrice * prev.discountValue) / 100
      : prev.discountValue
    const currAmt = curr.discountType === 'percentage'
      ? (originalPrice * curr.discountValue) / 100
      : curr.discountValue
    return currAmt > prevAmt ? curr : prev
  })

  const discountAmount = best.discountType === 'percentage'
    ? Math.round((originalPrice * best.discountValue) / 100)
    : Math.min(best.discountValue, originalPrice)

  const discountedPrice = Math.max(0, originalPrice - discountAmount)
  const discountLabel = best.discountType === 'percentage'
    ? `${best.discountValue}% OFF`
    : `PKR ${best.discountValue} OFF`

  return { originalPrice, discountedPrice, discountLabel, hasDiscount: true, offer: best }
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/utils/offerUtils.ts
git commit -m "feat: add client-side getDiscountedPrice utility"
```

---

## Task 8: Offers Tab in AdminReferrals

**Files:**
- Modify: `client/src/pages/admin/AdminReferrals.tsx`

- [ ] **Step 1: Add imports at the top of the file**

After the existing imports, add:
```tsx
import { Percent, PencilSimple } from '@phosphor-icons/react'
import { offersService } from '@/services/offers.service'
import type { Offer } from '@/services/offers.service'
```

- [ ] **Step 2: Update the `Tab` type and `tabs` array**

Find:
```tsx
type Tab = 'coupons' | 'settings' | 'rewards' | 'payouts'
```
Replace with:
```tsx
type Tab = 'coupons' | 'settings' | 'rewards' | 'payouts' | 'offers'
```

Find:
```tsx
  const tabs: { key: Tab; label: string; Icon: React.FC<any> }[] = [
    { key: 'coupons',  label: 'Coupon Codes',      Icon: Tag },
    { key: 'settings', label: 'Referral Settings',  Icon: Gift },
    { key: 'rewards',  label: 'Referral Rewards',   Icon: Users },
    { key: 'payouts',  label: 'Payout Requests',    Icon: Wallet },
  ]
```
Replace with:
```tsx
  const tabs: { key: Tab; label: string; Icon: React.FC<any> }[] = [
    { key: 'offers',   label: 'Offers & Discounts', Icon: Percent },
    { key: 'coupons',  label: 'Coupon Codes',       Icon: Tag },
    { key: 'settings', label: 'Referral Settings',  Icon: Gift },
    { key: 'rewards',  label: 'Referral Rewards',   Icon: Users },
    { key: 'payouts',  label: 'Payout Requests',    Icon: Wallet },
  ]
```

- [ ] **Step 3: Add the tab render in the return block**

Find:
```tsx
      {activeTab === 'coupons'  && <CouponsTab />}
```
Add a line before it:
```tsx
      {activeTab === 'offers'   && <OffersTab />}
```

- [ ] **Step 4: Add the OffersTab component at the bottom of the file (before the `StatusBadge` function)**

```tsx
// ─── Tab 0: Offers & Discounts ────────────────────────────────────────────────

function OffersTab() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editOffer, setEditOffer] = useState<Offer | null>(null)
  const [courses, setCourses] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await offersService.getAdminOffers()
      if (res.success) setOffers(res.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    coursesService.getAdminCourses({ limit: 100 }).then(r => {
      if (r.success) setCourses(r.data)
    }).catch(() => {})
  }, [])

  async function handleToggle(id: string, current: boolean) {
    try {
      await offersService.updateOffer(id, { isActive: !current })
      load()
      toast.success(`Offer ${current ? 'deactivated' : 'activated'}`)
    } catch { toast.error('Failed to update offer') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this offer?')) return
    try {
      await offersService.deleteOffer(id)
      load()
      toast.success('Offer deleted')
    } catch { toast.error('Failed to delete offer') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          Auto-applied discounts shown on course pages. Course-specific offers take priority over platform-wide.
        </p>
        <button
          onClick={() => { setEditOffer(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus size={15} weight="bold" />
          Create Offer
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No offers yet</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
              <tr>
                {['Title', 'Discount', 'Scope', 'Duration', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {offers.map(o => (
                <tr key={o._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {o.title}
                    {o.bannerText && (
                      <p className="text-[11px] text-slate-400 dark:text-neutral-500 font-normal mt-0.5 truncate max-w-[200px]">{o.bannerText}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-violet-600 dark:text-violet-400">
                    {o.discountType === 'percentage' ? `${o.discountValue}%` : `PKR ${o.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                    {o.scope === 'course' ? (o.course?.title || 'Course') : 'All Courses'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {o.startsAt ? new Date(o.startsAt).toLocaleDateString() : '—'}
                    {' → '}
                    {o.endsAt ? new Date(o.endsAt).toLocaleDateString() : 'No end'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(o._id, o.isActive)} className="transition-colors">
                      {o.isActive
                        ? <ToggleRight size={22} weight="fill" className="text-violet-600" />
                        : <ToggleLeft size={22} className="text-slate-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditOffer(o); setShowModal(true) }}
                        className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <PencilSimple size={15} />
                      </button>
                      <button onClick={() => handleDelete(o._id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <OfferModal
          courses={courses}
          offer={editOffer}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}

function OfferModal({
  courses, offer, onClose, onSuccess,
}: { courses: any[]; offer: Offer | null; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!offer
  const [form, setForm] = useState({
    title: offer?.title ?? '',
    bannerText: offer?.bannerText ?? '',
    discountType: offer?.discountType ?? 'percentage',
    discountValue: offer?.discountValue?.toString() ?? '',
    scope: offer?.scope ?? 'platform',
    courseId: offer?.course?._id ?? '',
    isActive: offer?.isActive ?? true,
    startsAt: offer?.startsAt ? offer.startsAt.slice(0, 10) : '',
    endsAt: offer?.endsAt ? offer.endsAt.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.discountValue) return toast.error('Title and discount value are required')
    if (form.scope === 'course' && !form.courseId) return toast.error('Select a course')
    setSaving(true)
    try {
      const dto = {
        title: form.title,
        bannerText: form.bannerText,
        discountType: form.discountType as 'percentage' | 'fixed',
        discountValue: Number(form.discountValue),
        scope: form.scope as 'platform' | 'course',
        courseId: form.scope === 'course' ? form.courseId : undefined,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      }
      if (isEdit && offer) {
        await offersService.updateOffer(offer._id, dto)
        toast.success('Offer updated')
      } else {
        await offersService.createOffer(dto)
        toast.success('Offer created')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to save offer')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-slate-900 dark:text-white">{isEdit ? 'Edit Offer' : 'Create Offer'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Eid Sale"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Banner Text (shown in ticker)</label>
            <input value={form.bannerText} onChange={e => setForm(f => ({ ...f, bannerText: e.target.value }))}
              placeholder="🎉 Eid Sale — 30% off all courses!"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Type</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (PKR)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Value</label>
              <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'percentage' ? '30' : '500'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Scope</label>
            <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
              <option value="platform">All Courses (Platform-wide)</option>
              <option value="course">Specific Course</option>
            </select>
          </div>
          {form.scope === 'course' && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Course</label>
              <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
                <option value="">Select course…</option>
                {courses.map((c: any) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Start Date (optional)</label>
              <input type="date" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">End Date (optional)</label>
              <input type="date" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
              {form.isActive
                ? <ToggleRight size={24} weight="fill" className="text-violet-600" />
                : <ToggleLeft size={24} className="text-slate-400" />
              }
            </button>
            <span className="text-sm text-slate-600 dark:text-neutral-300">{form.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors mt-2">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Offer'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminReferrals.tsx
git commit -m "feat: add Offers & Discounts tab to AdminReferrals"
```

---

## Task 9: Offers Marquee Ticker in Admin Topbar

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

- [ ] **Step 1: Add imports at the top of AdminPage.tsx**

After existing imports, add:
```tsx
import { offersService } from '../services/offers.service'
import type { Offer } from '../services/offers.service'
```

- [ ] **Step 2: Add state and data-fetch inside the `AdminPage` component function, after the existing `useState` declarations**

```tsx
  const [activeOffers, setActiveOffers] = useState<Offer[]>([])

  useEffect(() => {
    offersService.getActiveOffers()
      .then(r => {
        if (r.success) setActiveOffers(r.data.filter(o => o.bannerText?.trim()))
      })
      .catch(() => {})
  }, [])
```

- [ ] **Step 3: Add the `OffersMarquee` component at the bottom of AdminPage.tsx (outside the `AdminPage` function, after all other components)**

```tsx
// ─── Offers Marquee Ticker ────────────────────────────────────────────────────

function OffersMarquee({ offers, onNavigate }: { offers: Offer[]; onNavigate: () => void }) {
  if (offers.length === 0) return null

  const items = [...offers, ...offers] // duplicate for seamless loop

  return (
    <div
      className="h-8 bg-violet-600 flex items-center overflow-hidden flex-shrink-0 cursor-pointer"
      onClick={onNavigate}
      title="Click to manage offers"
    >
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .offers-marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .offers-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="offers-marquee-track">
        {items.map((o, i) => (
          <span key={i} className="flex items-center gap-2 px-6 text-xs font-bold text-white whitespace-nowrap">
            <span className="text-violet-300">%</span>
            {o.bannerText}
            <span className="text-violet-300 mx-2">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Render the ticker inside the main admin layout, just above the `<header>` topbar**

Find:
```tsx
      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-[64px]
```

Add the `OffersMarquee` between the outer `div` and the `header`:
```tsx
      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <OffersMarquee
          offers={activeOffers}
          onNavigate={() => navigate('/admin/referrals')}
        />

        {/* Topbar */}
        <header className="h-[64px]
```

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/AdminPage.tsx
git commit -m "feat: add offers marquee ticker to admin topbar"
```

---

## Task 10: Discounted Prices on Course Cards (Courses.tsx)

**Files:**
- Modify: `client/src/components/Courses.tsx`

- [ ] **Step 1: Add imports at top of Courses.tsx**

```tsx
import { offersService } from '../services/offers.service'
import { getDiscountedPrice } from '../utils/offerUtils'
import type { Offer } from '../services/offers.service'
```

- [ ] **Step 2: Add offers state in the `Courses` component (or whatever the main export function is called)**

Find the `useState` declarations inside the courses component. Add:
```tsx
  const [activeOffers, setActiveOffers] = useState<Offer[]>([])
```

- [ ] **Step 3: Add offers fetch in the `useEffect` that fetches courses (or a separate one)**

Add a `useEffect` alongside the existing ones:
```tsx
  useEffect(() => {
    offersService.getActiveOffers()
      .then(r => { if (r.success) setActiveOffers(r.data) })
      .catch(() => {})
  }, [])
```

- [ ] **Step 4: Update the price display block in the course card**

Find the existing price display (around line 645–652 in Courses.tsx):
```tsx
                      <span className="flex-shrink-0 text-xl font-black text-violet-600 dark:text-violet-400">
                        {course.pricePKR !== undefined || course.priceUSD !== undefined
                          ? currency === 'PKR'
                            ? `Rs.${(course.pricePKR ?? 0).toLocaleString()}`
                            : `$${course.priceUSD ?? 0}`
                          : course.price}
                      </span>
```

Replace with:
```tsx
                      {(() => {
                        const originalPKR = course.pricePKR ?? 0
                        const { discountedPrice, discountLabel, hasDiscount } = getDiscountedPrice(
                          course.id, originalPKR, activeOffers
                        )
                        return (
                          <div className="flex flex-col items-end">
                            {hasDiscount && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full mb-0.5">
                                {discountLabel}
                              </span>
                            )}
                            <span className="text-xl font-black text-violet-600 dark:text-violet-400">
                              {course.pricePKR !== undefined || course.priceUSD !== undefined
                                ? currency === 'PKR'
                                  ? `Rs.${discountedPrice.toLocaleString()}`
                                  : `$${course.priceUSD ?? 0}`
                                : course.price}
                            </span>
                            {hasDiscount && currency === 'PKR' && (
                              <span className="text-xs text-slate-400 line-through font-normal">
                                Rs.{originalPKR.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )
                      })()}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Courses.tsx
git commit -m "feat: show auto-applied discount prices on course cards"
```

---

## Task 11: Discounted Price on Course Detail Page

**Files:**
- Modify: `client/src/pages/CourseDetailsPage.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { offersService } from '../services/offers.service'
import { getDiscountedPrice } from '../utils/offerUtils'
import type { Offer } from '../services/offers.service'
```

- [ ] **Step 2: Add state in the component**

After existing `useState` declarations:
```tsx
  const [activeOffers, setActiveOffers] = useState<Offer[]>([])
```

- [ ] **Step 3: Add fetch in an existing or new `useEffect`**

```tsx
  useEffect(() => {
    offersService.getActiveOffers()
      .then(r => { if (r.success) setActiveOffers(r.data) })
      .catch(() => {})
  }, [])
```

- [ ] **Step 4: Compute discount result once — add this computed variable after the state declarations**

```tsx
  const priceResult = activeCourse?.id
    ? getDiscountedPrice(
        activeCourse.id,
        activeCourse.pricePKR ?? 0,
        activeOffers
      )
    : null
```

- [ ] **Step 5: Update the sidebar price block (around line 755–758)**

Find:
```tsx
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{activeCourse.price}</span>
                      <span className="text-lg text-slate-400 dark:text-neutral-500 line-through mb-1 font-semibold">{activeCourse.originalPrice}</span>
```

Replace with:
```tsx
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {priceResult?.hasDiscount
                          ? `Rs.${priceResult.discountedPrice.toLocaleString()}`
                          : activeCourse.price}
                      </span>
                      {priceResult?.hasDiscount && (
                        <span className="text-lg text-slate-400 dark:text-neutral-500 line-through mb-1 font-semibold">
                          Rs.{priceResult.originalPrice.toLocaleString()}
                        </span>
                      )}
                      {priceResult?.hasDiscount && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                          {priceResult.discountLabel}
                        </span>
                      )}
```

- [ ] **Step 6: Update the bottom price summary block (around line 1154–1156)**

Find:
```tsx
                <div className="text-xs text-slate-500 dark:text-neutral-400 font-bold mb-0.5 line-through">{activeCourse.originalPrice}</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{activeCourse.price}</div>
```

Replace with:
```tsx
                {priceResult?.hasDiscount && (
                  <div className="text-xs text-slate-500 dark:text-neutral-400 font-bold mb-0.5 line-through">
                    Rs.{priceResult.originalPrice.toLocaleString()}
                  </div>
                )}
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {priceResult?.hasDiscount
                    ? `Rs.${priceResult.discountedPrice.toLocaleString()}`
                    : activeCourse.price}
                </div>
```

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/CourseDetailsPage.tsx
git commit -m "feat: show auto-applied discount price on course detail page"
```

---

## Task 12: Pre-fill Discounted Price in PaymentSubmitModal

**Files:**
- Modify: `client/src/pages/student/PaymentSubmitModal.tsx`

- [ ] **Step 1: Update the Props interface**

Find:
```tsx
interface Props {
  courseId: string
  teacherId: string
  courseName?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

Replace with:
```tsx
interface Props {
  courseId: string
  teacherId: string
  courseName?: string
  offerDiscountedPrice?: number | null
  offerLabel?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

- [ ] **Step 2: Update the component signature and add pre-fill logic**

Find:
```tsx
export default function PaymentSubmitModal({ courseId, teacherId, courseName, isOpen, onClose, onSuccess }: Props) {
```

Replace with:
```tsx
export default function PaymentSubmitModal({ courseId, teacherId, courseName, offerDiscountedPrice, offerLabel, isOpen, onClose, onSuccess }: Props) {
```

- [ ] **Step 3: Pre-fill the amount when the modal opens**

Find the `reset` function and the state declarations. Add a `useEffect` after the state declarations:
```tsx
  useEffect(() => {
    if (isOpen && offerDiscountedPrice && offerDiscountedPrice > 0) {
      setAmount(String(offerDiscountedPrice))
    }
  }, [isOpen, offerDiscountedPrice])
```

- [ ] **Step 4: Show offer badge below the amount input**

Find the amount input section in the form. Look for where `amount` state is used as a text input value and add a note beneath it:
```tsx
                {offerLabel && offerDiscountedPrice && (
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 font-semibold">
                    ✓ {offerLabel} applied — pay Rs.{offerDiscountedPrice.toLocaleString()}
                  </p>
                )}
```

- [ ] **Step 5: Find all places in the codebase that open `PaymentSubmitModal` and pass the new props**

Search for `PaymentSubmitModal` usage:
```bash
grep -r "PaymentSubmitModal" client/src --include="*.tsx" -l
```

For each file found, locate where `<PaymentSubmitModal` is rendered and add the props using data already computed in that component (the `priceResult` from Task 11, or equivalent). Pass:
```tsx
offerDiscountedPrice={priceResult?.hasDiscount ? priceResult.discountedPrice : undefined}
offerLabel={priceResult?.hasDiscount ? priceResult.discountLabel : undefined}
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/student/PaymentSubmitModal.tsx
git add client/src/pages/student/StudentCourses.tsx  # or whichever file opens the modal
git commit -m "feat: pre-fill discounted price in payment modal"
```

---

## Task 13: Fix `$or` Query Bug in Offer Controller

**Files:**
- Modify: `server/src/controllers/offer.controller.js`

MongoDB does not allow two `$or` keys at the same level. The `getActiveOffers` handler uses `$or` twice — fix it to use `$and`.

- [ ] **Step 1: Fix the query in `getActiveOffers`**

Find:
```js
  const offers = await Offer.find({
    isActive: true,
    $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
    $or: [{ endsAt: null }, { endsAt: { $gte: now } }],
  })
```

Replace with:
```js
  const offers = await Offer.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  })
```

- [ ] **Step 2: Apply the same fix in `payment.controller.js`**

Find:
```js
    const activeOffers = await Offer.find({
      isActive: true,
      $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
    }).lean()
    const filteredOffers = activeOffers.filter(o => !o.endsAt || o.endsAt >= now)
```

Replace with:
```js
    const activeOffers = await Offer.find({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    }).lean()
    const filteredOffers = activeOffers
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/offer.controller.js server/src/controllers/payment.controller.js
git commit -m "fix: use $and for dual $or clauses in offer queries"
```

---

## Task 14: Final Integration Check

- [ ] **Step 1: Start both servers**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

- [ ] **Step 2: Smoke test the admin flow**

1. Navigate to `/admin/referrals`
2. Click the **Offers & Discounts** tab
3. Create a platform-wide offer: `Eid Sale`, `30%`, platform scope, active
4. Verify the row appears in the table
5. Verify the ticker appears above the admin topbar with the banner text

- [ ] **Step 3: Smoke test the student flow**

1. Navigate to `/courses`
2. Verify course cards show the discounted price with strikethrough original
3. Click a course → verify detail page sidebar shows discounted price + badge
4. Enroll → go to dashboard → open the payment modal
5. Verify the amount field is pre-filled with the discounted price

- [ ] **Step 4: Test course-specific offer**

1. Create a second offer with scope = `course`, pick one course, set `20%`
2. Navigate to that specific course's detail page → verify 20% (course-specific) beats 30% platform rule (this only applies if course-specific should take priority; the platform-wide 30% would otherwise be higher — test with a course-specific offer that has a *higher* discount to confirm priority works)

- [ ] **Step 5: Commit any fixes found during smoke testing**

```bash
git add -A
git commit -m "fix: integration fixes from smoke testing"
```
