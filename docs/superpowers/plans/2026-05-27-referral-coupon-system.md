# Referral & Coupon System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full referral and coupon system — students earn wallet credits by referring others, admins manage coupon codes and reward rates, discount applies at payment checkout.

**Architecture:** Three new Mongoose models (Coupon, ReferralReward, ReferralWallet) plus a separate PayoutRequest model. Referral codes ARE coupons (`source: 'referral'`). Reward crediting is triggered as a side-effect of payment approval. Two new API route groups (`/api/v1/coupons`, `/api/v1/referrals`). Two new dashboard pages (admin + student).

**Tech Stack:** Node.js/Express ESM, Mongoose, React + TypeScript, Tailwind CSS, @phosphor-icons/react, axios, react-hot-toast

---

## File Map

### New server files
- `server/src/models/coupon.model.js`
- `server/src/models/referral-reward.model.js`
- `server/src/models/referral-wallet.model.js`
- `server/src/models/payout-request.model.js`
- `server/src/controllers/coupon.controller.js`
- `server/src/controllers/referral.controller.js`
- `server/src/routes/coupon.route.js`
- `server/src/routes/referral.route.js`

### Modified server files
- `server/src/models/payment.model.js` — add `coupon`, `discountApplied`
- `server/src/models/site-settings.model.js` — add `referral` sub-document
- `server/src/controllers/payment.controller.js` — coupon on create, reward on approve
- `server/app.js` — register two new route groups

### New client files
- `client/src/services/coupons.service.ts`
- `client/src/services/referrals.service.ts`
- `client/src/pages/admin/AdminReferrals.tsx`
- `client/src/pages/student/StudentReferrals.tsx`

### Modified client files
- `client/src/pages/student/PaymentSubmitModal.tsx` — coupon code input
- `client/src/pages/AdminPage.tsx` — nav + route + type
- `client/src/pages/StudentDashboardPage.tsx` — nav + route + type

---

## Task 1: Coupon Model

**Files:**
- Create: `server/src/models/coupon.model.js`

- [ ] **Step 1: Create the file**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['admin', 'referral'],
      required: [true, 'Source is required'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    scope: {
      type: String,
      enum: ['platform', 'course'],
      required: [true, 'Scope is required'],
    },
    course: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
    maxUses: { type: Number, default: null, min: [1, 'Max uses must be at least 1'] },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Creator is required'] },
    referrer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, versionKey: false }
)

couponSchema.index({ referrer: 1, course: 1 })
couponSchema.index({ source: 1, isActive: 1 })

const Coupon = mongoose.models.Coupon || model('Coupon', couponSchema)

export default Coupon
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/coupon.model.js
git commit -m "feat: add Coupon model"
```

---

## Task 2: ReferralReward Model

**Files:**
- Create: `server/src/models/referral-reward.model.js`

- [ ] **Step 1: Create the file**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const referralRewardSchema = new Schema(
  {
    referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    discountGiven: { type: Number, required: [true, 'Discount given is required'] },
    rewardAmount: { type: Number, required: [true, 'Reward amount is required'] },
    status: {
      type: String,
      enum: ['pending', 'credited', 'paid_out'],
      default: 'pending',
    },
    creditedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
)

referralRewardSchema.index({ referrer: 1, status: 1 })
referralRewardSchema.index({ referee: 1 })
referralRewardSchema.index({ payment: 1 }, { unique: true })

const ReferralReward = mongoose.models.ReferralReward || model('ReferralReward', referralRewardSchema)

export default ReferralReward
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/referral-reward.model.js
git commit -m "feat: add ReferralReward model"
```

---

## Task 3: ReferralWallet + PayoutRequest Models

**Files:**
- Create: `server/src/models/referral-wallet.model.js`
- Create: `server/src/models/payout-request.model.js`

- [ ] **Step 1: Create referral-wallet.model.js**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const transactionSchema = new Schema(
  {
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: true }
)

const referralWalletSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalPaidOut: { type: Number, default: 0 },
    transactions: [transactionSchema],
  },
  { timestamps: true, versionKey: false }
)

const ReferralWallet = mongoose.models.ReferralWallet || model('ReferralWallet', referralWalletSchema)

export default ReferralWallet
```

- [ ] **Step 2: Create payout-request.model.js**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const payoutRequestSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wallet: { type: Schema.Types.ObjectId, ref: 'ReferralWallet', required: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [1, 'Amount must be at least 1'] },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
)

payoutRequestSchema.index({ student: 1, status: 1 })
payoutRequestSchema.index({ status: 1, createdAt: -1 })

const PayoutRequest = mongoose.models.PayoutRequest || model('PayoutRequest', payoutRequestSchema)

export default PayoutRequest
```

- [ ] **Step 3: Commit**

```bash
git add server/src/models/referral-wallet.model.js server/src/models/payout-request.model.js
git commit -m "feat: add ReferralWallet and PayoutRequest models"
```

---

## Task 4: Extend Payment + SiteSettings Models

**Files:**
- Modify: `server/src/models/payment.model.js`
- Modify: `server/src/models/site-settings.model.js`

- [ ] **Step 1: Add coupon fields to payment.model.js**

In `server/src/models/payment.model.js`, add these two fields inside `paymentSchema` after the `rejectionReason` field:

```js
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    discountApplied: { type: Number, default: 0 },
```

The top of the file needs `import mongoose from 'mongoose'` which is already present. The Schema.Types.ObjectId reference is already used — just add the two fields.

- [ ] **Step 2: Add referral sub-document to site-settings.model.js**

In `server/src/models/site-settings.model.js`, add this block inside `siteSettingsSchema` after the `homepage` field (before the closing `}`):

```js
    referral: {
      enabled: { type: Boolean, default: false },
      refereeDiscountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      refereeDiscountValue: { type: Number, default: 0 },
      referrerRewardType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      referrerRewardValue: { type: Number, default: 0 },
    },
```

- [ ] **Step 3: Commit**

```bash
git add server/src/models/payment.model.js server/src/models/site-settings.model.js
git commit -m "feat: extend Payment and SiteSettings models for referral/coupon system"
```

---

## Task 5: Coupon Controller + Route

**Files:**
- Create: `server/src/controllers/coupon.controller.js`
- Create: `server/src/routes/coupon.route.js`

- [ ] **Step 1: Create coupon.controller.js**

```js
import asyncHandler from '../utils/asyncHandler.js'
import Coupon from '../models/coupon.model.js'
import Course from '../models/course.model.js'
import Enrollment from '../models/enrollment.model.js'
import SiteSettings from '../models/site-settings.model.js'

// ─── Admin: Create coupon ──────────────────────────────────────────────────────
export const createCoupon = asyncHandler(async (req, res) => {
  try {
    const { code, discountType, discountValue, scope, courseId, maxUses, expiresAt } = req.body

    if (!code || !discountType || discountValue === undefined || !scope) {
      return res.status(400).json({ success: false, error: { message: 'code, discountType, discountValue, and scope are required' } })
    }
    if (scope === 'course' && !courseId) {
      return res.status(400).json({ success: false, error: { message: 'courseId is required when scope is course' } })
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() })
    if (existing) return res.status(409).json({ success: false, error: { message: 'Coupon code already exists' } })

    if (scope === 'course') {
      const course = await Course.findById(courseId)
      if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      source: 'admin',
      discountType,
      discountValue: Number(discountValue),
      scope,
      course: scope === 'course' ? courseId : null,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
      createdBy: req.user.id,
    })

    res.status(201).json({ success: true, message: 'Coupon created', data: { coupon } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: List coupons ───────────────────────────────────────────────────────
export const getCoupons = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, source, isActive, scope } = req.query
    const filter = {}
    if (source) filter.source = source
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (scope) filter.scope = scope

    const skip = (Number(page) - 1) * Number(limit)
    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .populate('course', 'title')
        .populate('referrer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Coupon.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: coupons,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Get single coupon ──────────────────────────────────────────────────
export const getCoupon = asyncHandler(async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('course', 'title')
      .populate('referrer', 'name email')
      .populate('createdBy', 'name')
    if (!coupon) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } })
    res.json({ success: true, data: { coupon } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Update coupon ──────────────────────────────────────────────────────
export const updateCoupon = asyncHandler(async (req, res) => {
  try {
    const allowed = {}
    if (req.body.isActive !== undefined) allowed.isActive = req.body.isActive
    if (req.body.maxUses !== undefined) allowed.maxUses = req.body.maxUses === null ? null : Number(req.body.maxUses)
    if (req.body.expiresAt !== undefined) allowed.expiresAt = req.body.expiresAt || null
    if (req.body.discountValue !== undefined) allowed.discountValue = Number(req.body.discountValue)

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true })
    if (!coupon) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } })
    res.json({ success: true, message: 'Coupon updated', data: { coupon } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Delete coupon ──────────────────────────────────────────────────────
export const deleteCoupon = asyncHandler(async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id)
    if (!coupon) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } })
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Validate coupon ──────────────────────────────────────────────────
export const validateCoupon = asyncHandler(async (req, res) => {
  try {
    const { code, courseId } = req.body
    if (!code || !courseId) {
      return res.status(400).json({ success: false, error: { message: 'code and courseId are required' } })
    }

    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() })

    if (!coupon || !coupon.isActive) {
      return res.json({ success: true, data: { valid: false, reason: 'Invalid or inactive coupon' } })
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.json({ success: true, data: { valid: false, reason: 'Coupon has expired' } })
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.json({ success: true, data: { valid: false, reason: 'Coupon usage limit reached' } })
    }
    if (coupon.scope === 'course' && coupon.course?.toString() !== courseId) {
      return res.json({ success: true, data: { valid: false, reason: 'Coupon is not valid for this course' } })
    }
    if (coupon.source === 'referral' && coupon.referrer?.toString() === req.user.id.toString()) {
      return res.json({ success: true, data: { valid: false, reason: 'You cannot use your own referral code' } })
    }

    // Check referral system enabled for referral coupons
    if (coupon.source === 'referral') {
      const settings = await SiteSettings.findOne()
      if (!settings?.referral?.enabled) {
        return res.json({ success: true, data: { valid: false, reason: 'Referral system is currently disabled' } })
      }
    }

    // Check not already enrolled
    const alreadyEnrolled = await Enrollment.findOne({ student: req.user.id, course: courseId })
    if (alreadyEnrolled) {
      return res.json({ success: true, data: { valid: false, reason: 'You are already enrolled in this course' } })
    }

    const coursePrice = course.currency === 'USD' ? course.priceUSD : course.price
    let discountAmount = 0
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((coursePrice * coupon.discountValue) / 100)
    } else {
      discountAmount = Math.min(coupon.discountValue, coursePrice)
    }
    const finalPrice = Math.max(0, coursePrice - discountAmount)

    res.json({
      success: true,
      data: {
        valid: true,
        couponId: coupon._id,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalPrice,
        currency: course.currency,
        originalPrice: coursePrice,
      },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 2: Create coupon.route.js**

```js
import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  createCoupon, getCoupons, getCoupon, updateCoupon, deleteCoupon, validateCoupon,
} from '../controllers/coupon.controller.js'

const router = Router()

router.route('/validate').post(authenticate, validateCoupon)

router.route('/')
  .get(authenticate, authorize('admin'), getCoupons)
  .post(authenticate, authorize('admin'), createCoupon)

router.route('/:id')
  .get(authenticate, authorize('admin'), getCoupon)
  .patch(authenticate, authorize('admin'), updateCoupon)
  .delete(authenticate, authorize('admin'), deleteCoupon)

export default router
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/coupon.controller.js server/src/routes/coupon.route.js
git commit -m "feat: add coupon controller and routes"
```

---

## Task 6: Referral Controller + Route

**Files:**
- Create: `server/src/controllers/referral.controller.js`
- Create: `server/src/routes/referral.route.js`

- [ ] **Step 1: Create referral.controller.js**

```js
import asyncHandler from '../utils/asyncHandler.js'
import Coupon from '../models/coupon.model.js'
import ReferralReward from '../models/referral-reward.model.js'
import ReferralWallet from '../models/referral-wallet.model.js'
import PayoutRequest from '../models/payout-request.model.js'
import SiteSettings from '../models/site-settings.model.js'
import Course from '../models/course.model.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(userId) {
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `REF-${userId.toString().slice(-4).toUpperCase()}-${suffix}`
}

// ─── Student: Generate referral code ─────────────────────────────────────────
export const generateReferralCode = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.body

    const settings = await SiteSettings.findOne()
    if (!settings?.referral?.enabled) {
      return res.status(400).json({ success: false, error: { message: 'Referral system is currently disabled' } })
    }

    if (courseId) {
      const course = await Course.findById(courseId)
      if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    }

    // Idempotent: return existing code if already generated
    const existing = await Coupon.findOne({
      source: 'referral',
      referrer: req.user.id,
      course: courseId || null,
    }).populate('course', 'title')

    if (existing) {
      const shareUrl = courseId
        ? `${process.env.CLIENT_URL}/courses/${courseId}?coupon=${existing.code}`
        : `${process.env.CLIENT_URL}/courses?coupon=${existing.code}`
      return res.json({ success: true, data: { coupon: existing, shareUrl } })
    }

    const { refereeDiscountType, refereeDiscountValue } = settings.referral

    const coupon = await Coupon.create({
      code: generateCode(req.user.id),
      source: 'referral',
      discountType: refereeDiscountType,
      discountValue: refereeDiscountValue,
      scope: courseId ? 'course' : 'platform',
      course: courseId || null,
      maxUses: null,
      expiresAt: null,
      createdBy: req.user.id,
      referrer: req.user.id,
    })

    const shareUrl = courseId
      ? `${process.env.CLIENT_URL}/courses/${courseId}?coupon=${coupon.code}`
      : `${process.env.CLIENT_URL}/courses?coupon=${coupon.code}`

    res.status(201).json({ success: true, message: 'Referral code generated', data: { coupon, shareUrl } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Get my referral codes ──────────────────────────────────────────
export const getMyReferralCodes = asyncHandler(async (req, res) => {
  try {
    const coupons = await Coupon.find({ source: 'referral', referrer: req.user.id })
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })

    const settings = await SiteSettings.findOne()
    const clientUrl = process.env.CLIENT_URL || ''

    const data = coupons.map(c => ({
      ...c.toObject(),
      shareUrl: c.course
        ? `${clientUrl}/courses/${c.course._id}?coupon=${c.code}`
        : `${clientUrl}/courses?coupon=${c.code}`,
    }))

    res.json({ success: true, data, settings: settings?.referral || {} })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Get my reward history ──────────────────────────────────────────
export const getMyRewards = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const [rewards, total] = await Promise.all([
      ReferralReward.find({ referrer: req.user.id })
        .populate('referee', 'name')
        .populate('course', 'title')
        .populate('coupon', 'code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReferralReward.countDocuments({ referrer: req.user.id }),
    ])

    res.json({
      success: true,
      data: rewards,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Get my wallet ───────────────────────────────────────────────────
export const getMyWallet = asyncHandler(async (req, res) => {
  try {
    let wallet = await ReferralWallet.findOne({ student: req.user.id })
    if (!wallet) {
      wallet = { student: req.user.id, balance: 0, totalEarned: 0, totalPaidOut: 0, transactions: [] }
    }

    const pendingPayout = await PayoutRequest.findOne({ student: req.user.id, status: 'pending' })

    res.json({ success: true, data: { wallet, pendingPayout: pendingPayout || null } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Request payout ──────────────────────────────────────────────────
export const createPayoutRequest = asyncHandler(async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || Number(amount) < 1) {
      return res.status(400).json({ success: false, error: { message: 'Amount must be at least 1' } })
    }

    const wallet = await ReferralWallet.findOne({ student: req.user.id })
    if (!wallet || wallet.balance < Number(amount)) {
      return res.status(400).json({ success: false, error: { message: 'Insufficient wallet balance' } })
    }

    const pendingExists = await PayoutRequest.findOne({ student: req.user.id, status: 'pending' })
    if (pendingExists) {
      return res.status(409).json({ success: false, error: { message: 'You already have a pending payout request' } })
    }

    const payoutRequest = await PayoutRequest.create({
      student: req.user.id,
      wallet: wallet._id,
      amount: Number(amount),
    })

    res.status(201).json({ success: true, message: 'Payout request submitted', data: { payoutRequest } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Public: Get referral settings ───────────────────────────────────────────
export const getPublicSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await SiteSettings.findOne()
    res.json({ success: true, data: settings?.referral || { enabled: false } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: List all referral rewards ────────────────────────────────────────
export const getAllRewards = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = status ? { status } : {}
    const skip = (Number(page) - 1) * Number(limit)

    const [rewards, total] = await Promise.all([
      ReferralReward.find(filter)
        .populate('referrer', 'name email')
        .populate('referee', 'name email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReferralReward.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: rewards,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: List payout requests ─────────────────────────────────────────────
export const getPayoutRequests = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = status ? { status } : {}
    const skip = (Number(page) - 1) * Number(limit)

    const [requests, total] = await Promise.all([
      PayoutRequest.find(filter)
        .populate('student', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PayoutRequest.countDocuments(filter),
    ])

    // Attach wallet balance for each request
    const wallets = await ReferralWallet.find({
      student: { $in: requests.map(r => r.student._id) },
    }).select('student balance')
    const walletMap = {}
    wallets.forEach(w => { walletMap[w.student.toString()] = w.balance })

    const data = requests.map(r => ({
      ...r.toObject(),
      walletBalance: walletMap[r.student._id.toString()] ?? 0,
    }))

    res.json({
      success: true,
      data,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Process payout request ───────────────────────────────────────────
export const processPayoutRequest = asyncHandler(async (req, res) => {
  try {
    const { action, adminNote } = req.body
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: { message: 'action must be approve or reject' } })
    }

    const request = await PayoutRequest.findById(req.params.requestId)
    if (!request) return res.status(404).json({ success: false, error: { message: 'Payout request not found' } })
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: { message: 'Request is already processed' } })
    }

    if (action === 'approve') {
      const wallet = await ReferralWallet.findById(request.wallet)
      if (!wallet || wallet.balance < request.amount) {
        return res.status(400).json({ success: false, error: { message: 'Insufficient wallet balance' } })
      }
      wallet.balance -= request.amount
      wallet.totalPaidOut += request.amount
      wallet.transactions.push({ type: 'debit', amount: request.amount, description: 'Payout approved by admin' })
      await wallet.save()

      // Update all credited rewards to paid_out for this student
      await ReferralReward.updateMany({ referrer: request.student, status: 'credited' }, { status: 'paid_out' })

      request.status = 'approved'
    } else {
      request.status = 'rejected'
    }

    request.adminNote = adminNote || null
    request.processedAt = new Date()
    await request.save()

    res.json({ success: true, message: `Payout request ${action}d`, data: { request } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Get referral settings ────────────────────────────────────────────
export const getReferralSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await SiteSettings.findOne()
    res.json({ success: true, data: settings?.referral || { enabled: false } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Update referral settings ─────────────────────────────────────────
export const updateReferralSettings = asyncHandler(async (req, res) => {
  try {
    const { enabled, refereeDiscountType, refereeDiscountValue, referrerRewardType, referrerRewardValue } = req.body
    const update = {}
    if (enabled !== undefined) update['referral.enabled'] = enabled
    if (refereeDiscountType) update['referral.refereeDiscountType'] = refereeDiscountType
    if (refereeDiscountValue !== undefined) update['referral.refereeDiscountValue'] = Number(refereeDiscountValue)
    if (referrerRewardType) update['referral.referrerRewardType'] = referrerRewardType
    if (referrerRewardValue !== undefined) update['referral.referrerRewardValue'] = Number(referrerRewardValue)

    const settings = await SiteSettings.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true })
    res.json({ success: true, message: 'Referral settings updated', data: settings.referral })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 2: Create referral.route.js**

```js
import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  generateReferralCode,
  getMyReferralCodes,
  getMyRewards,
  getMyWallet,
  createPayoutRequest,
  getPublicSettings,
  getAllRewards,
  getPayoutRequests,
  processPayoutRequest,
  getReferralSettings,
  updateReferralSettings,
} from '../controllers/referral.controller.js'

const router = Router()

// Public
router.get('/public-settings', getPublicSettings)

// Student
router.post('/generate', authenticate, authorize('student'), generateReferralCode)
router.get('/my-codes', authenticate, authorize('student'), getMyReferralCodes)
router.get('/my-rewards', authenticate, authorize('student'), getMyRewards)
router.get('/my-wallet', authenticate, authorize('student'), getMyWallet)
router.post('/payout-request', authenticate, authorize('student'), createPayoutRequest)

// Admin
router.get('/', authenticate, authorize('admin'), getAllRewards)
router.get('/payout-requests', authenticate, authorize('admin'), getPayoutRequests)
router.patch('/payout-requests/:requestId', authenticate, authorize('admin'), processPayoutRequest)
router.get('/settings', authenticate, authorize('admin'), getReferralSettings)
router.patch('/settings', authenticate, authorize('admin'), updateReferralSettings)

export default router
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/referral.controller.js server/src/routes/referral.route.js
git commit -m "feat: add referral controller and routes"
```

---

## Task 7: Modify Payment Controller

**Files:**
- Modify: `server/src/controllers/payment.controller.js`

- [ ] **Step 1: Add imports at the top of payment.controller.js**

After the existing imports, add:

```js
import Coupon from '../models/coupon.model.js'
import ReferralReward from '../models/referral-reward.model.js'
import ReferralWallet from '../models/referral-wallet.model.js'
import SiteSettings from '../models/site-settings.model.js'
```

- [ ] **Step 2: Modify createPayment to attach coupon**

In `createPayment`, after destructuring `req.body`, add `couponCode` to the destructure:

```js
const { courseId, teacherId, method, transactionId, amount, currency, couponCode } = req.body
```

After the `uploadPaymentScreenshot` call and before `Payment.create(...)`, add coupon validation:

```js
    let couponDoc = null
    let discountApplied = 0

    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase().trim() })
      if (couponDoc && couponDoc.isActive) {
        const course = await Course.findById(courseId)
        if (course) {
          const coursePrice = course.currency === 'USD' ? course.priceUSD : course.price
          if (couponDoc.discountType === 'percentage') {
            discountApplied = Math.round((coursePrice * couponDoc.discountValue) / 100)
          } else {
            discountApplied = Math.min(couponDoc.discountValue, coursePrice)
          }
        }
      }
    }
```

In `Payment.create(...)`, add the two new fields:

```js
      coupon: couponDoc ? couponDoc._id : null,
      discountApplied,
```

- [ ] **Step 3: Modify approvePayment to credit referrer wallet**

In `approvePayment`, after `await payment.save()` and before the enrollment update, add:

```js
    // ─── Referral reward crediting ──────────────────────────────────────────
    if (payment.coupon) {
      const coupon = await Coupon.findById(payment.coupon)
      if (coupon && coupon.source === 'referral' && coupon.referrer) {
        const alreadyRewarded = await ReferralReward.findOne({ payment: payment._id })
        if (!alreadyRewarded) {
          const settings = await SiteSettings.findOne()
          const referral = settings?.referral

          if (referral?.enabled) {
            const course = await Course.findById(payment.course._id || payment.course)
            const coursePrice = course?.currency === 'USD' ? course.priceUSD : course?.price || 0

            let rewardAmount = 0
            if (referral.referrerRewardType === 'percentage') {
              rewardAmount = Math.round((coursePrice * referral.referrerRewardValue) / 100)
            } else {
              rewardAmount = referral.referrerRewardValue
            }

            const enrollment = await Enrollment.findOne({ student: payment.student, course: payment.course._id || payment.course })

            await ReferralReward.create({
              referrer: coupon.referrer,
              referee: payment.student,
              coupon: coupon._id,
              course: payment.course._id || payment.course,
              enrollment: enrollment?._id,
              payment: payment._id,
              discountGiven: payment.discountApplied || 0,
              rewardAmount,
              status: 'credited',
              creditedAt: new Date(),
            })

            await ReferralWallet.findOneAndUpdate(
              { student: coupon.referrer },
              {
                $inc: { balance: rewardAmount, totalEarned: rewardAmount },
                $push: {
                  transactions: {
                    type: 'credit',
                    amount: rewardAmount,
                    description: `Referral reward for ${course?.title || 'a course'}`,
                    date: new Date(),
                  },
                },
              },
              { upsert: true, new: true }
            )

            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })
          }
        }
      }
    }
```

Also add `Course` to existing imports if not already imported (it isn't currently — add it):

```js
import Course from '../models/course.model.js'
```

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/payment.controller.js
git commit -m "feat: attach coupon to payment and credit referral wallet on approval"
```

---

## Task 8: Register Routes in app.js

**Files:**
- Modify: `server/app.js`

- [ ] **Step 1: Add imports**

After the last import line (currently `import aiChatRoutes ...`), add:

```js
import couponRoutes from './src/routes/coupon.route.js'
import referralRoutes from './src/routes/referral.route.js'
```

- [ ] **Step 2: Register routes**

After `app.use('/api/v1/ai-chat', aiChatRoutes)`, add:

```js
app.use('/api/v1/coupons', couponRoutes)
app.use('/api/v1/referrals', referralRoutes)
```

- [ ] **Step 3: Commit**

```bash
git add server/app.js
git commit -m "feat: register coupon and referral routes"
```

---

## Task 9: Client Service Files

**Files:**
- Create: `client/src/services/coupons.service.ts`
- Create: `client/src/services/referrals.service.ts`

- [ ] **Step 1: Create coupons.service.ts**

```ts
import { axiosClient } from '../lib/axiosClient'

export const couponsService = {
  async validateCoupon(code: string, courseId: string) {
    const res = await axiosClient.post('/coupons/validate', { code, courseId })
    return res.data
  },

  async getCoupons(params?: { page?: number; limit?: number; source?: string; isActive?: boolean; scope?: string }) {
    const res = await axiosClient.get('/coupons', { params })
    return res.data
  },

  async createCoupon(dto: {
    code: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    scope: 'platform' | 'course'
    courseId?: string
    maxUses?: number | null
    expiresAt?: string | null
  }) {
    const res = await axiosClient.post('/coupons', dto)
    return res.data
  },

  async updateCoupon(id: string, dto: { isActive?: boolean; maxUses?: number | null; expiresAt?: string | null; discountValue?: number }) {
    const res = await axiosClient.patch(`/coupons/${id}`, dto)
    return res.data
  },

  async deleteCoupon(id: string) {
    await axiosClient.delete(`/coupons/${id}`)
  },
}
```

- [ ] **Step 2: Create referrals.service.ts**

```ts
import { axiosClient } from '../lib/axiosClient'

export const referralsService = {
  async getPublicSettings() {
    const res = await axiosClient.get('/referrals/public-settings')
    return res.data
  },

  async generateCode(courseId?: string) {
    const res = await axiosClient.post('/referrals/generate', { courseId })
    return res.data
  },

  async getMyCodes() {
    const res = await axiosClient.get('/referrals/my-codes')
    return res.data
  },

  async getMyRewards(params?: { page?: number; limit?: number }) {
    const res = await axiosClient.get('/referrals/my-rewards', { params })
    return res.data
  },

  async getMyWallet() {
    const res = await axiosClient.get('/referrals/my-wallet')
    return res.data
  },

  async createPayoutRequest(amount: number) {
    const res = await axiosClient.post('/referrals/payout-request', { amount })
    return res.data
  },

  async getAllRewards(params?: { page?: number; limit?: number; status?: string }) {
    const res = await axiosClient.get('/referrals', { params })
    return res.data
  },

  async getPayoutRequests(params?: { page?: number; limit?: number; status?: string }) {
    const res = await axiosClient.get('/referrals/payout-requests', { params })
    return res.data
  },

  async processPayoutRequest(requestId: string, action: 'approve' | 'reject', adminNote?: string) {
    const res = await axiosClient.patch(`/referrals/payout-requests/${requestId}`, { action, adminNote })
    return res.data
  },

  async getReferralSettings() {
    const res = await axiosClient.get('/referrals/settings')
    return res.data
  },

  async updateReferralSettings(dto: {
    enabled?: boolean
    refereeDiscountType?: 'percentage' | 'fixed'
    refereeDiscountValue?: number
    referrerRewardType?: 'percentage' | 'fixed'
    referrerRewardValue?: number
  }) {
    const res = await axiosClient.patch('/referrals/settings', dto)
    return res.data
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/services/coupons.service.ts client/src/services/referrals.service.ts
git commit -m "feat: add coupons and referrals service files"
```

---

## Task 10: AdminReferrals.tsx

**Files:**
- Create: `client/src/pages/admin/AdminReferrals.tsx`

- [ ] **Step 1: Create AdminReferrals.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Tag, Gift, Users, Wallet, Plus, Trash, ToggleLeft, ToggleRight, Copy, Check, X } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { couponsService } from '@/services/coupons.service'
import { referralsService } from '@/services/referrals.service'
import { coursesService } from '@/services/courses.service'

type Tab = 'coupons' | 'settings' | 'rewards' | 'payouts'

export default function AdminReferrals() {
  const [activeTab, setActiveTab] = useState<Tab>('coupons')

  const tabs: { key: Tab; label: string; Icon: React.FC<any> }[] = [
    { key: 'coupons',  label: 'Coupon Codes',      Icon: Tag },
    { key: 'settings', label: 'Referral Settings',  Icon: Gift },
    { key: 'rewards',  label: 'Referral Rewards',   Icon: Users },
    { key: 'payouts',  label: 'Payout Requests',    Icon: Wallet },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Referrals & Coupons</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Manage coupon codes, referral reward rates, and payout requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-2xl mb-6 w-fit">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === key
                ? 'bg-white dark:bg-neutral-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'coupons'  && <CouponsTab />}
      {activeTab === 'settings' && <SettingsTab />}
      {activeTab === 'rewards'  && <RewardsTab />}
      {activeTab === 'payouts'  && <PayoutsTab />}
    </div>
  )
}

// ─── Tab 1: Coupon Codes ──────────────────────────────────────────────────────

function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterSource, setFilterSource] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [courses, setCourses] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterSource) params.source = filterSource
      if (filterActive !== '') params.isActive = filterActive
      const res = await couponsService.getCoupons(params)
      if (res.success) setCoupons(res.data)
    } finally {
      setLoading(false)
    }
  }, [filterSource, filterActive])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    coursesService.getCourses({ limit: 100 }).then(r => { if (r.success) setCourses(r.data) }).catch(() => {})
  }, [])

  async function handleToggle(id: string, current: boolean) {
    try {
      await couponsService.updateCoupon(id, { isActive: !current })
      load()
      toast.success(`Coupon ${current ? 'deactivated' : 'activated'}`)
    } catch { toast.error('Failed to update coupon') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return
    try {
      await couponsService.deleteCoupon(id)
      load()
      toast.success('Coupon deleted')
    } catch { toast.error('Failed to delete coupon') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-700 dark:text-neutral-200"
          >
            <option value="">All Types</option>
            <option value="admin">Manual</option>
            <option value="referral">Referral</option>
          </select>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-700 dark:text-neutral-200"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus size={15} weight="bold" />
          Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No coupons found</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
              <tr>
                {['Code', 'Type', 'Discount', 'Scope', 'Uses', 'Expiry', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {coupons.map(c => (
                <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{c.code}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${c.source === 'referral' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                      {c.source === 'referral' ? 'Referral' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-neutral-300">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `PKR ${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                    {c.scope === 'course' ? (c.course?.title || 'Course') : 'Platform-wide'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                    {c.usedCount}{c.maxUses !== null ? `/${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(c._id, c.isActive)} className="transition-colors">
                      {c.isActive
                        ? <ToggleRight size={22} weight="fill" className="text-violet-600" />
                        : <ToggleLeft size={22} className="text-slate-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {c.source === 'admin' && (
                      <button onClick={() => handleDelete(c._id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CreateCouponModal
          courses={courses}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}

function CreateCouponModal({ courses, onClose, onSuccess }: { courses: any[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    code: '', discountType: 'percentage', discountValue: '', scope: 'platform', courseId: '', maxUses: '', expiresAt: '',
  })
  const [saving, setSaving] = useState(false)

  function autoGenerate() {
    setForm(f => ({ ...f, code: 'PROMO-' + Math.random().toString(36).substring(2, 7).toUpperCase() }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.discountValue) return toast.error('Code and discount value are required')
    setSaving(true)
    try {
      await couponsService.createCoupon({
        code: form.code,
        discountType: form.discountType as 'percentage' | 'fixed',
        discountValue: Number(form.discountValue),
        scope: form.scope as 'platform' | 'course',
        courseId: form.scope === 'course' ? form.courseId : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      })
      toast.success('Coupon created')
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-slate-900 dark:text-white">Create Coupon</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Code</label>
            <div className="flex gap-2">
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-mono text-slate-900 dark:text-white"
              />
              <button type="button" onClick={autoGenerate} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-500 hover:text-violet-600 dark:text-neutral-400 dark:hover:text-violet-400 transition-colors">Auto</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Type</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Value</label>
              <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'percentage' ? '15' : '500'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Scope</label>
            <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
              <option value="platform">Platform-wide (any course)</option>
              <option value="course">Specific course</option>
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
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Max Uses (optional)</label>
              <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Expiry Date (optional)</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors mt-2">
            {saving ? 'Creating…' : 'Create Coupon'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Tab 2: Referral Settings ─────────────────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState({
    enabled: false,
    refereeDiscountType: 'percentage',
    refereeDiscountValue: 0,
    referrerRewardType: 'percentage',
    referrerRewardValue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    referralsService.getReferralSettings()
      .then(r => { if (r.success) setSettings(s => ({ ...s, ...r.data })) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await referralsService.updateReferralSettings(settings)
      toast.success('Referral settings saved')
    } catch { toast.error('Failed to save settings') } finally { setSaving(false) }
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading…</div>

  return (
    <div className="max-w-lg">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">Enable Referral System</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Allow students to generate referral links</p>
          </div>
          <button onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))} className="transition-colors">
            {settings.enabled
              ? <ToggleRight size={28} weight="fill" className="text-violet-600" />
              : <ToggleLeft size={28} className="text-slate-400" />
            }
          </button>
        </div>

        <hr className="border-slate-100 dark:border-neutral-800" />

        {/* Referee discount */}
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">New Student Discount</p>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mb-3">Discount given to the referred (new) student</p>
          <div className="flex gap-3">
            <select value={settings.refereeDiscountType} onChange={e => setSettings(s => ({ ...s, refereeDiscountType: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (PKR)</option>
            </select>
            <input type="number" value={settings.refereeDiscountValue}
              onChange={e => setSettings(s => ({ ...s, refereeDiscountValue: Number(e.target.value) }))}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
          </div>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">
            Preview: New student gets {settings.refereeDiscountType === 'percentage' ? `${settings.refereeDiscountValue}% off` : `PKR ${settings.refereeDiscountValue} off`}
          </p>
        </div>

        {/* Referrer reward */}
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Referrer Reward</p>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mb-3">Reward earned by the student who referred</p>
          <div className="flex gap-3">
            <select value={settings.referrerRewardType} onChange={e => setSettings(s => ({ ...s, referrerRewardType: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
              <option value="percentage">% of Course Price</option>
              <option value="fixed">Fixed Amount (PKR)</option>
            </select>
            <input type="number" value={settings.referrerRewardValue}
              onChange={e => setSettings(s => ({ ...s, referrerRewardValue: Number(e.target.value) }))}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
          </div>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">
            Preview: Referrer earns {settings.referrerRewardType === 'percentage' ? `${settings.referrerRewardValue}% of course price` : `PKR ${settings.referrerRewardValue}`}
          </p>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

// ─── Tab 3: Referral Rewards ──────────────────────────────────────────────────

function RewardsTab() {
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    referralsService.getAllRewards({ status: status || undefined })
      .then(r => { if (r.success) setRewards(r.data) })
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div>
      <div className="mb-4">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-700 dark:text-neutral-200">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="credited">Credited</option>
          <option value="paid_out">Paid Out</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : rewards.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No rewards found</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
              <tr>
                {['Referrer', 'Referee', 'Course', 'Discount Given', 'Reward Earned', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {rewards.map(r => (
                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.referrer?.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{r.referee?.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">{r.course?.title}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">PKR {r.discountGiven}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">PKR {r.rewardAmount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab 4: Payout Requests ───────────────────────────────────────────────────

function PayoutsTab() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [processing, setProcessing] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    referralsService.getPayoutRequests({ status: status || undefined })
      .then(r => { if (r.success) setRequests(r.data) })
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { load() }, [load])

  async function handle(id: string, action: 'approve' | 'reject', note?: string) {
    setProcessing(id)
    try {
      await referralsService.processPayoutRequest(id, action, note)
      toast.success(`Payout ${action}d`)
      load()
    } catch { toast.error('Failed to process request') } finally { setProcessing(null) }
  }

  return (
    <div>
      <div className="mb-4">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-700 dark:text-neutral-200">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No payout requests</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
              <tr>
                {['Student', 'Wallet Balance', 'Requested', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {requests.map(r => (
                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.student?.name}<br /><span className="text-xs text-slate-400 font-normal">{r.student?.email}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">PKR {r.walletBalance}</td>
                  <td className="px-4 py-3 font-bold text-violet-600">PKR {r.amount}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handle(r._id, 'approve')}
                          disabled={processing === r._id}
                          className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handle(r._id, 'reject', 'Rejected by admin')}
                          disabled={processing === r._id}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    credited: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    paid_out: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/admin/AdminReferrals.tsx
git commit -m "feat: add AdminReferrals page with coupon management, settings, rewards, and payouts"
```

---

## Task 11: Wire AdminReferrals into AdminPage.tsx

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

- [ ] **Step 1: Add lazy import**

After the last lazy import line (currently `const AdminContacts = lazy(...)`), add:

```tsx
const AdminReferrals = lazy(() => import('./admin/AdminReferrals'))
```

- [ ] **Step 2: Add 'referrals' to AdminView type**

Find the `AdminView` type (line 46) and add `'referrals'` to the union:

```tsx
export type AdminView = 'overview' | 'students' | 'instructors' | 'courses' | 'certificates' | 'payments' | 'payments-setup' | 'financial-aid' | 'salaries' | 'cms' | 'blog' | 'settings' | 'support' | 'notifications' | 'messages' | 'seo' | 'reviews' | 'geo-access' | 'contacts' | 'referrals'
```

- [ ] **Step 3: Add nav item to NAV_FINANCE**

Add `Gift` to the phosphor-icons import at the top (after `Money`):

```tsx
import {
  ChartBar, Users, Chalkboard, BookOpen, CreditCard, PencilSimple,
  List, X, SignOut, Bell, MagnifyingGlass, Sun, Moon, GearSix,
  Lock, Eye, EyeSlash, Handshake, Certificate, ChatCircleDots, CheckCircle, Chats, Globe, Star, Sparkle, Money, EnvelopeSimple, Gift
} from '@phosphor-icons/react'
```

In `NAV_FINANCE`, add the referrals item after the `salaries` entry:

```tsx
  { view: 'referrals', label: 'Referrals', path: 'referrals', Icon: Gift as NavItem['Icon'] },
```

- [ ] **Step 4: Add search item**

In `ADMIN_SEARCH_ITEMS`, add:

```tsx
  { label: 'Referrals',      description: 'Manage coupon codes, referral rewards, and payout requests', path: '/admin/referrals', Icon: Gift as SearchItem['Icon'] },
```

- [ ] **Step 5: Add route**

In the `<Routes>` section inside `AdminPage`, add after the `/contacts` route:

```tsx
<Route path="/referrals" element={<AdminReferrals />} />
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/AdminPage.tsx
git commit -m "feat: add Referrals to admin sidebar and routing"
```

---

## Task 12: StudentReferrals.tsx

**Files:**
- Create: `client/src/pages/student/StudentReferrals.tsx`

- [ ] **Step 1: Create StudentReferrals.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Gift, Copy, Check, Wallet, ArrowDown, Clock, CheckCircle, XCircle } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { referralsService } from '@/services/referrals.service'
import { enrollmentsService } from '@/services/enrollments.service'

export default function StudentReferrals() {
  const [publicSettings, setPublicSettings] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [pendingPayout, setPendingPayout] = useState<any>(null)
  const [myCodes, setMyCodes] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [generatingGeneral, setGeneratingGeneral] = useState(false)
  const [generatingCourse, setGeneratingCourse] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [submittingPayout, setSubmittingPayout] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    referralsService.getPublicSettings().then(r => { if (r.success) setPublicSettings(r.data) }).catch(() => {})
    referralsService.getMyWallet().then(r => { if (r.success) { setWallet(r.data.wallet); setPendingPayout(r.data.pendingPayout) } }).catch(() => {})
    referralsService.getMyCodes().then(r => { if (r.success) setMyCodes(r.data) }).catch(() => {})
    referralsService.getMyRewards().then(r => { if (r.success) setRewards(r.data) }).catch(() => {})
    enrollmentsService.getMyEnrollments().then(r => { if (r.success) setEnrollments(r.data) }).catch(() => {})
  }, [])

  const generalCode = myCodes.find(c => c.scope === 'platform')
  const courseCodes = myCodes.filter(c => c.scope === 'course')

  async function handleGenerateGeneral() {
    setGeneratingGeneral(true)
    try {
      const res = await referralsService.generateCode()
      if (res.success) {
        referralsService.getMyCodes().then(r => { if (r.success) setMyCodes(r.data) })
        toast.success('General referral code generated!')
      }
    } catch { toast.error('Failed to generate code') } finally { setGeneratingGeneral(false) }
  }

  async function handleGenerateCourse() {
    if (!selectedCourse) return toast.error('Please select a course')
    setGeneratingCourse(true)
    try {
      const res = await referralsService.generateCode(selectedCourse)
      if (res.success) {
        referralsService.getMyCodes().then(r => { if (r.success) setMyCodes(r.data) })
        toast.success('Course referral link generated!')
        setSelectedCourse('')
      }
    } catch { toast.error('Failed to generate link') } finally { setGeneratingCourse(false) }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  async function handlePayoutRequest() {
    const amount = Number(payoutAmount)
    if (!amount || amount < 1) return toast.error('Enter a valid amount')
    if (wallet && amount > wallet.balance) return toast.error('Amount exceeds your balance')
    setSubmittingPayout(true)
    try {
      await referralsService.createPayoutRequest(amount)
      toast.success('Payout request submitted')
      setShowPayoutModal(false)
      setPayoutAmount('')
      referralsService.getMyWallet().then(r => { if (r.success) { setWallet(r.data.wallet); setPendingPayout(r.data.pendingPayout) } })
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to submit request')
    } finally { setSubmittingPayout(false) }
  }

  if (!publicSettings) return <div className="text-center py-12 text-slate-400">Loading…</div>

  if (!publicSettings.enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Gift size={26} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-neutral-200 mb-2">Referral Program Not Active</h3>
        <p className="text-sm text-slate-400 dark:text-neutral-500">The referral program is not available at this time.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Section 1: How It Works ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-5 text-white"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Gift size={20} weight="fill" />
          </div>
          <div>
            <h3 className="font-black text-lg">How Referrals Work</h3>
            <p className="text-white/80 text-sm mt-1 leading-relaxed">
              Share your referral link → New student gets{' '}
              <strong>{publicSettings.refereeDiscountType === 'percentage' ? `${publicSettings.refereeDiscountValue}% off` : `PKR ${publicSettings.refereeDiscountValue} off`}</strong>{' '}
              → You earn{' '}
              <strong>{publicSettings.referrerRewardType === 'percentage' ? `${publicSettings.referrerRewardValue}% of the course price` : `PKR ${publicSettings.referrerRewardValue}`}</strong>{' '}
              after they pay.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Section 2: Wallet ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5"
      >
        <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Wallet size={18} className="text-violet-600" />
          Your Wallet
        </h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Balance', value: `PKR ${wallet?.balance ?? 0}`, highlight: true },
            { label: 'Total Earned', value: `PKR ${wallet?.totalEarned ?? 0}`, highlight: false },
            { label: 'Total Paid Out', value: `PKR ${wallet?.totalPaidOut ?? 0}`, highlight: false },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`rounded-xl p-3 text-center ${highlight ? 'bg-violet-50 dark:bg-violet-950/30' : 'bg-slate-50 dark:bg-neutral-800'}`}>
              <p className={`text-lg font-black ${highlight ? 'text-violet-600' : 'text-slate-900 dark:text-white'}`}>{value}</p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {pendingPayout ? (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl px-4 py-2.5 text-sm font-semibold">
            <Clock size={15} />
            Payout request of PKR {pendingPayout.amount} is pending admin approval
          </div>
        ) : (
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={!wallet || wallet.balance < 1}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
          >
            <ArrowDown size={15} weight="bold" />
            Request Payout
          </button>
        )}

        {/* Transaction history */}
        {wallet?.transactions?.length > 0 && (
          <div className="mt-4 border-t border-slate-100 dark:border-neutral-800 pt-4">
            <p className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Recent Transactions</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...wallet.transactions].reverse().slice(0, 10).map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {t.type === 'credit'
                      ? <CheckCircle size={14} className="text-emerald-500" />
                      : <XCircle size={14} className="text-red-400" />
                    }
                    <span className="text-slate-600 dark:text-neutral-300">{t.description}</span>
                  </div>
                  <span className={`font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'credit' ? '+' : '-'}PKR {t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Section 3: Referral Codes ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5"
      >
        <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Gift size={18} className="text-violet-600" />
          Your Referral Codes
        </h3>

        {/* General code */}
        <div className="mb-5">
          <p className="text-sm font-bold text-slate-700 dark:text-neutral-200 mb-2">General Code (any course)</p>
          {generalCode ? (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800 rounded-xl px-4 py-3">
              <code className="flex-1 font-mono text-sm font-bold text-violet-600 dark:text-violet-400">{generalCode.code}</code>
              <button
                onClick={() => copyToClipboard(generalCode.shareUrl, 'general')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {copied === 'general' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied === 'general' ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateGeneral}
              disabled={generatingGeneral}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {generatingGeneral ? 'Generating…' : 'Generate General Code'}
            </button>
          )}
        </div>

        {/* Per-course codes */}
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-neutral-200 mb-2">Per-Course Links</p>
          <div className="flex gap-3 mb-3">
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white"
            >
              <option value="">Select an enrolled course…</option>
              {enrollments.map((e: any) => (
                <option key={e.course?._id} value={e.course?._id}>{e.course?.title}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateCourse}
              disabled={generatingCourse || !selectedCourse}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {generatingCourse ? '…' : 'Generate'}
            </button>
          </div>

          {courseCodes.length > 0 && (
            <div className="space-y-2">
              {courseCodes.map(c => (
                <div key={c._id} className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{c.course?.title}</p>
                    <code className="font-mono text-sm font-bold text-violet-600 dark:text-violet-400">{c.code}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(c.shareUrl, c._id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex-shrink-0"
                  >
                    {copied === c._id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    {copied === c._id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Section 4: Referral History ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5"
      >
        <h3 className="font-black text-slate-900 dark:text-white mb-4">Referral History</h3>

        {rewards.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-neutral-500 text-sm">
            No referrals yet. Share your code to start earning!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  {['Referee', 'Course', 'Discount Given', 'Your Reward', 'Status', 'Date'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
                {rewards.map(r => (
                  <tr key={r._id}>
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{r.referee?.name || '—'}</td>
                    <td className="py-3 pr-4 text-slate-500 dark:text-neutral-400">{r.course?.title}</td>
                    <td className="py-3 pr-4 text-slate-500 dark:text-neutral-400">PKR {r.discountGiven}</td>
                    <td className="py-3 pr-4 font-bold text-emerald-600">PKR {r.rewardAmount}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        r.status === 'credited' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        r.status === 'paid_out' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 w-full max-w-sm shadow-xl"
          >
            <h3 className="font-black text-slate-900 dark:text-white mb-1">Request Payout</h3>
            <p className="text-sm text-slate-400 dark:text-neutral-500 mb-4">Available balance: PKR {wallet?.balance ?? 0}</p>
            <input
              type="number"
              value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value)}
              placeholder="Enter amount"
              max={wallet?.balance}
              min={1}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowPayoutModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={handlePayoutRequest} disabled={submittingPayout} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold transition-colors">
                {submittingPayout ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/student/StudentReferrals.tsx
git commit -m "feat: add StudentReferrals page with wallet, codes, and history"
```

---

## Task 13: Wire StudentReferrals into StudentDashboardPage.tsx

**Files:**
- Modify: `client/src/pages/StudentDashboardPage.tsx`

- [ ] **Step 1: Add lazy import**

After the last lazy import (currently `const StudentMessages = lazy(...)`), add:

```tsx
const StudentReferrals = lazy(() => import('./student/StudentReferrals'))
```

- [ ] **Step 2: Add 'referrals' to StudentView type**

Find the `StudentView` type (line 29) and add `'referrals'`:

```tsx
export type StudentView = 'overview' | 'courses' | 'certificates' | 'payments' | 'financial-aid' | 'settings' | 'support' | 'notifications' | 'messages' | 'referrals'
```

- [ ] **Step 3: Add nav item to NAV_MAIN**

Add `Gift` to the phosphor-icons import:

```tsx
import {
  House, BookOpen, CreditCard, Handshake, GearSix, ChatCircleDots,
  List, X, SignOut, Bell, Sun, Moon, Certificate, CheckCircle, Chats, Sparkle, Gift
} from '@phosphor-icons/react'
```

In `NAV_MAIN`, add after the `financial-aid` entry:

```tsx
  { view: 'referrals', label: 'Referrals', path: 'referrals', Icon: Gift as NavItem['Icon'] },
```

- [ ] **Step 4: Add search item**

In `STUDENT_SEARCH_ITEMS`, add:

```tsx
  { label: 'Referrals', description: 'Share referral links, track rewards, and manage your wallet', path: '/dashboard/referrals', Icon: Gift as SearchItem['Icon'] },
```

- [ ] **Step 5: Add route**

In the `<Routes>` section, after the `/messages` route:

```tsx
<Route path="/referrals" element={<StudentReferrals />} />
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/StudentDashboardPage.tsx
git commit -m "feat: add Referrals to student sidebar and routing"
```

---

## Task 14: Coupon Input in PaymentSubmitModal

**Files:**
- Modify: `client/src/pages/student/PaymentSubmitModal.tsx`

- [ ] **Step 1: Add import**

At the top of the file, add the coupons service import:

```tsx
import { couponsService } from '@/services/coupons.service'
```

- [ ] **Step 2: Add coupon state**

Inside the modal component, add these state variables (alongside existing state):

```tsx
const [couponCode, setCouponCode] = useState('')
const [couponValidating, setCouponValidating] = useState(false)
const [couponResult, setCouponResult] = useState<{
  valid: boolean; reason?: string; discountAmount?: number; finalPrice?: number; originalPrice?: number; currency?: string; couponId?: string
} | null>(null)
const [couponDebounceTimer, setCouponDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
```

- [ ] **Step 3: Add coupon validation handler**

Add this function inside the component:

```tsx
function handleCouponChange(value: string) {
  setCouponCode(value)
  setCouponResult(null)
  if (couponDebounceTimer) clearTimeout(couponDebounceTimer)
  if (!value.trim()) return
  const timer = setTimeout(async () => {
    if (!courseId) return
    setCouponValidating(true)
    try {
      const res = await couponsService.validateCoupon(value.trim(), courseId)
      if (res.success) setCouponResult(res.data)
    } catch {
      setCouponResult({ valid: false, reason: 'Failed to validate coupon' })
    } finally {
      setCouponValidating(false)
    }
  }, 500)
  setCouponDebounceTimer(timer)
}
```

Note: `courseId` must be available as a prop or in the component's context. Check how the modal receives the course data and use the appropriate variable.

- [ ] **Step 4: Add coupon input UI**

In the payment form, add a "Have a coupon code?" section. Find the area where the amount is shown (near the payment submission fields) and add after it:

```tsx
{/* Coupon code */}
<div className="border border-slate-200 dark:border-neutral-700 rounded-xl overflow-hidden">
  <button
    type="button"
    onClick={() => { setCouponCode(''); setCouponResult(null) }}
    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
  >
    <span>Have a coupon code?</span>
  </button>
  <div className="px-4 pb-4">
    <div className="relative">
      <input
        type="text"
        value={couponCode}
        onChange={e => handleCouponChange(e.target.value.toUpperCase())}
        placeholder="Enter code (e.g. SAVE20)"
        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 focus:outline-none focus:border-violet-500"
      />
      {couponValidating && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
    {couponResult && (
      <p className={`text-xs font-semibold mt-2 ${couponResult.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
        {couponResult.valid
          ? `Code applied! ${couponResult.currency} ${couponResult.originalPrice} → ${couponResult.currency} ${couponResult.finalPrice} (${couponResult.discountAmount} off)`
          : couponResult.reason}
      </p>
    )}
  </div>
</div>
```

- [ ] **Step 5: Pass couponCode to payment submission**

Find where `paymentsService.createPayment(...)` is called and add `couponCode` (if valid) to the FormData or DTO. In `payments.service.ts`, also add `couponCode` to the FormData:

In `paymentsService.createPayment`, add to the form:
```tsx
if (dto.couponCode) form.append('couponCode', dto.couponCode)
```

And add `couponCode?: string` to `CreatePaymentDto` in `client/src/types/api.ts`.

In the modal's submit handler, pass:
```tsx
couponCode: couponResult?.valid ? couponCode : undefined,
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/student/PaymentSubmitModal.tsx client/src/services/payments.service.ts client/src/types/api.ts
git commit -m "feat: add coupon code input to payment submission modal"
```

---

## Self-Review Checklist

After completing all tasks, verify:

- [ ] Start the server: `cd server && node index.js` — no import errors
- [ ] Start the client: `cd client && npm run dev` — no TypeScript errors
- [ ] Test: Admin → Referrals → Settings tab → enable referral, set 15% discount / 10% reward → Save
- [ ] Test: Student → Referrals → generate general code → copy link
- [ ] Test: Student enrolls using referral code at payment step → discount shows correctly
- [ ] Test: Admin approves the payment → student referrer wallet is credited
- [ ] Test: Admin → Referrals → Referral Rewards tab → shows the reward record
- [ ] Test: Student → Referrals → Wallet shows earned amount → Request Payout
- [ ] Test: Admin → Payout Requests → Approve → wallet balance decreases
- [ ] Test: Admin → Coupon Codes → Create manual coupon → use at checkout → discount applies
