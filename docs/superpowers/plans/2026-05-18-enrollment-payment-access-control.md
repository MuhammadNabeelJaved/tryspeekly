# Enrollment + Payment + Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate course access behind admin-approved payment — students enroll immediately, submit payment proof in-app or via admin, and only gain course access once the admin approves the payment.

**Architecture:** Enrollment is always created with `isActive: false`. When a payment is created it is linked back to the enrollment (`enrollment.payment`). Admin approval atomically sets `payment.status = 'approved'` and `enrollment.isActive = true`. The frontend checks `enrollment.isActive` to decide whether to render course content or a locked state with payment modals.

**Tech Stack:** Node.js + Express (ES Modules), Mongoose, React + TypeScript, Tailwind CSS, Cloudinary (screenshot upload already wired), Phosphor Icons, Framer Motion.

---

## File Map

**Modified — server:**
- `server/src/models/enrollment.model.js` — change `isActive` default to `false`
- `server/src/models/payment.model.js` — make `transactionId` optional
- `server/src/controllers/enrollment.controller.js` — populate `payment` in `getMyEnrollments`
- `server/src/controllers/payment.controller.js` — link enrollment on create; flip isActive + notify on approve; notify on reject; add `adminCreatePayment`
- `server/src/routes/payment.route.js` — add `POST /payments/admin` admin route

**Modified — client:**
- `client/src/types/api.ts` — add `EnrolledPayment` interface, update `Enrollment.payment` + add `isActive`, add `AdminCreatePaymentDto`
- `client/src/services/payments.service.ts` — add `adminCreatePayment` method
- `client/src/pages/student/StudentCourses.tsx` — add access gating, open modals for locked enrollments
- `client/src/pages/student/StudentPayments.tsx` — replace mock data with real API
- `client/src/pages/admin/AdminPaymentsView.tsx` — full rewrite: real CRUD, approve/reject API calls, screenshot column, add payment button
- `client/src/pages/AdminPage.tsx` — remove `store` prop from AdminPaymentsView route

**Created — client:**
- `client/src/pages/student/PaymentSubmitModal.tsx` — form to submit payment proof
- `client/src/pages/student/PaymentStatusModal.tsx` — view payment status, trigger resubmit
- `client/src/pages/admin/AdminPaymentCreateModal.tsx` — admin manually creates payment record

---

## Task 1: Fix enrollment model default + populate payment in getMyEnrollments

**Files:**
- Modify: `server/src/models/enrollment.model.js:23`
- Modify: `server/src/controllers/enrollment.controller.js:37-44`

> Note: No server test infrastructure exists. Test manually by creating an enrollment and verifying `isActive` is `false` and the payment field is populated.

- [ ] **Step 1: Change isActive default in enrollment model**

In `server/src/models/enrollment.model.js`, line 23, change:
```js
isActive: { type: Boolean, default: true },
```
to:
```js
isActive: { type: Boolean, default: false },
```

- [ ] **Step 2: Add payment populate to getMyEnrollments**

In `server/src/controllers/enrollment.controller.js`, replace the `getMyEnrollments` function (lines 35–45):

```js
// GET /api/v1/enrollments/my — student: own enrollments
export const getMyEnrollments = asyncHandler(async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate('course', 'title thumbnail type level sessionDuration recurringSchedule totalSessions')
      .populate('teacher', 'name profileImage')
      .populate('payment', '_id status method amount currency screenshotUrl rejectionReason adminNote createdAt')
      .sort({ enrolledAt: -1 })
    res.json({ success: true, data: enrollments })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add server/src/models/enrollment.model.js server/src/controllers/enrollment.controller.js
git commit -m "fix: enrollment isActive defaults false; getMyEnrollments populates payment"
```

---

## Task 2: Make transactionId optional in payment model

**Files:**
- Modify: `server/src/models/payment.model.js:15`

The `transactionId` field is currently `required: true`. Admin-created payments may not have one.

- [ ] **Step 1: Remove required constraint from transactionId**

In `server/src/models/payment.model.js`, line 15, change:
```js
transactionId: { type: String, required: [true, 'Transaction ID is required'], trim: true },
```
to:
```js
transactionId: { type: String, trim: true },
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/payment.model.js
git commit -m "fix: make payment transactionId optional for admin-created records"
```

---

## Task 3: Fix createPayment — link enrollment after payment creation

**Files:**
- Modify: `server/src/controllers/payment.controller.js`

After a student submits payment proof, the enrollment's `payment` field must be set to the new payment's `_id` so that `getMyEnrollments` can populate it.

- [ ] **Step 1: Add Enrollment import at top of payment controller**

In `server/src/controllers/payment.controller.js`, after the existing imports (after line 3), add:
```js
import Enrollment from '../models/enrollment.model.js'
import Notification from '../models/notification.model.js'
```

- [ ] **Step 2: Update createPayment to link enrollment**

Replace the entire `createPayment` function:

```js
// POST /api/v1/payments — student submits payment proof
export const createPayment = asyncHandler(async (req, res) => {
  try {
    const { courseId, teacherId, method, transactionId, amount, currency } = req.body

    if (!req.file) return res.status(400).json({ success: false, error: { message: 'Payment screenshot is required' } })

    const result = await uploadCourseMaterial(req.file.buffer, `payment_${Date.now()}`)

    const payment = await Payment.create({
      student: req.user.id,
      course: courseId,
      teacher: teacherId,
      method,
      transactionId,
      screenshotUrl: result.secure_url,
      amount,
      currency: currency || 'PKR',
    })

    await Enrollment.findOneAndUpdate(
      { student: req.user.id, course: courseId },
      { payment: payment._id }
    )

    res.status(201).json({ success: true, message: 'Payment submitted. Awaiting admin approval.', data: payment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/payment.controller.js
git commit -m "feat: link enrollment.payment ref when student submits payment proof"
```

---

## Task 4: Fix approvePayment — flip enrollment.isActive + send notification

**Files:**
- Modify: `server/src/controllers/payment.controller.js`

When admin approves a payment, two things must happen: the linked enrollment becomes active, and the student receives an in-app notification.

- [ ] **Step 1: Replace approvePayment function**

```js
// PATCH /api/v1/payments/:id/approve — admin
export const approvePayment = asyncHandler(async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('course', 'title')
    if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } })
    if (payment.status !== 'pending') return res.status(400).json({ success: false, error: { message: 'Payment already processed' } })

    payment.status = 'approved'
    payment.adminNote = req.body.adminNote || ''
    await payment.save()

    await Enrollment.findOneAndUpdate(
      { student: payment.student, course: payment.course._id },
      { isActive: true }
    )

    await Notification.create({
      recipient: payment.student,
      title: 'Payment Approved',
      message: `Your payment for "${payment.course.title}" has been approved. You now have full access.`,
      type: 'payment',
      severity: 'low',
      relatedId: payment._id,
      relatedType: 'Payment',
    })

    res.json({ success: true, message: 'Payment approved', data: payment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/payment.controller.js
git commit -m "feat: approvePayment flips enrollment.isActive and creates notification"
```

---

## Task 5: Fix rejectPayment — send notification

**Files:**
- Modify: `server/src/controllers/payment.controller.js`

- [ ] **Step 1: Replace rejectPayment function**

```js
// PATCH /api/v1/payments/:id/reject — admin
export const rejectPayment = asyncHandler(async (req, res) => {
  try {
    const { rejectionReason } = req.body
    if (!rejectionReason) return res.status(400).json({ success: false, error: { message: 'Rejection reason is required' } })

    const payment = await Payment.findById(req.params.id).populate('course', 'title')
    if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } })
    if (payment.status !== 'pending') return res.status(400).json({ success: false, error: { message: 'Payment already processed' } })

    payment.status = 'rejected'
    payment.rejectionReason = rejectionReason
    await payment.save()

    await Notification.create({
      recipient: payment.student,
      title: 'Payment Rejected',
      message: `Your payment for "${payment.course.title}" was rejected: ${rejectionReason}. Please resubmit your payment proof.`,
      type: 'payment',
      severity: 'medium',
      relatedId: payment._id,
      relatedType: 'Payment',
    })

    res.json({ success: true, message: 'Payment rejected', data: payment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/payment.controller.js
git commit -m "feat: rejectPayment creates in-app notification for student"
```

---

## Task 6: Add adminCreatePayment handler + route

**Files:**
- Modify: `server/src/controllers/payment.controller.js` — add new export
- Modify: `server/src/routes/payment.route.js` — add route + import

Admin can manually create a payment record without a screenshot. This is useful when admin receives payment confirmation externally (email/WhatsApp) and wants to record it in the system.

- [ ] **Step 1: Add adminCreatePayment at end of payment.controller.js**

Append to `server/src/controllers/payment.controller.js`:

```js
// POST /api/v1/payments/admin — admin manually creates a payment record
export const adminCreatePayment = asyncHandler(async (req, res) => {
  try {
    const { studentId, courseId, teacherId, method, transactionId, amount, currency, adminNote } = req.body

    if (!studentId || !courseId || !teacherId || !method || !amount) {
      return res.status(400).json({ success: false, error: { message: 'studentId, courseId, teacherId, method, and amount are required' } })
    }

    const payment = await Payment.create({
      student: studentId,
      course: courseId,
      teacher: teacherId,
      method,
      transactionId: transactionId || '',
      amount,
      currency: currency || 'PKR',
      adminNote: adminNote || '',
    })

    await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { payment: payment._id }
    )

    const populated = await Payment.findById(payment._id)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('teacher', 'name')

    res.status(201).json({ success: true, message: 'Payment record created', data: populated })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 2: Add route and import in payment.route.js**

Replace the entire `server/src/routes/payment.route.js`:

```js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadDocument, handleMulterError } from '../middlewares/multer.js'
import {
  createPayment,
  getMyPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
  adminCreatePayment,
} from '../controllers/payment.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), uploadDocument, handleMulterError, createPayment)
router.route('/my').get(authenticate, authorize('student'), getMyPayments)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), getAllPayments)
router.route('/admin').post(authenticate, authorize('admin'), adminCreatePayment)
router.route('/:id/approve').patch(authenticate, authorize('admin'), approvePayment)
router.route('/:id/reject').patch(authenticate, authorize('admin'), rejectPayment)

export default router
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/payment.controller.js server/src/routes/payment.route.js
git commit -m "feat: add adminCreatePayment endpoint POST /payments/admin"
```

---

## Task 7: Update TypeScript types in api.ts

**Files:**
- Modify: `client/src/types/api.ts`

Two changes: (1) Add `EnrolledPayment` interface and update `Enrollment` to use it with an `isActive` field. (2) Add `AdminCreatePaymentDto`.

- [ ] **Step 1: Add EnrolledPayment interface + update Enrollment type**

In `client/src/types/api.ts`, find the `Enrollment` interface (around line 172) and replace it with:

```typescript
export interface EnrolledPayment {
  _id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  currency: 'PKR' | 'USD';
  screenshotUrl?: string;
  transactionId?: string;
  rejectionReason?: string;
  adminNote?: string;
  createdAt: string;
}

export interface Enrollment {
  _id: string;
  student: { _id: string; name: string; email: string; profileImage?: string };
  course: {
    _id: string;
    title: string;
    thumbnail?: string;
    totalSessions?: number;
    level?: string;
    type?: string;
    sessionDuration?: number;
    recurringSchedule?: Array<{ day: string; time: string }>;
  };
  teacher: { _id: string; name: string; profileImage?: string };
  payment?: EnrolledPayment | null;
  isActive: boolean;
  enrolledAt: string;
  attendance: Array<{ sessionNumber: number; duration?: number; date: string }>;
  progress: { sessionsAttended: number; totalSessions: number; lastAttendedAt?: string };
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Add AdminCreatePaymentDto at end of Payment Types section**

In `client/src/types/api.ts`, after the `CreatePaymentDto` interface (around line 237), add:

```typescript
export interface AdminCreatePaymentDto {
  studentId: string;
  courseId: string;
  teacherId: string;
  method: PaymentMethod;
  transactionId?: string;
  amount: number;
  currency?: 'PKR' | 'USD';
  adminNote?: string;
}
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd client && npx tsc --noEmit`
Expected: No errors (or only pre-existing unrelated errors).

- [ ] **Step 4: Commit**

```bash
git add client/src/types/api.ts
git commit -m "feat: add EnrolledPayment type, isActive to Enrollment, AdminCreatePaymentDto"
```

---

## Task 8: Add adminCreatePayment to payments.service.ts

**Files:**
- Modify: `client/src/services/payments.service.ts`

- [ ] **Step 1: Add import and method**

In `client/src/services/payments.service.ts`, update the import line 2 to include `AdminCreatePaymentDto`:

```typescript
import type { Payment, CreatePaymentDto, AdminCreatePaymentDto, ApiResponse, ApiPaginatedResponse } from '../types/api';
```

Then add the `adminCreatePayment` method inside the `paymentsService` object, after `rejectPayment`:

```typescript
  async adminCreatePayment(dto: AdminCreatePaymentDto): Promise<{ success: boolean; data: Payment }> {
    const response = await axiosClient.post<{ success: boolean; data: Payment }>(
      '/payments/admin',
      dto
    );
    return response.data;
  },
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd client && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/services/payments.service.ts
git commit -m "feat: add adminCreatePayment to paymentsService"
```

---

## Task 9: Create PaymentSubmitModal component

**Files:**
- Create: `client/src/pages/student/PaymentSubmitModal.tsx`

This modal lets a student submit payment proof for a specific course enrollment. Props: `courseId`, `teacherId`, `isOpen`, `onClose`, `onSuccess`.

- [ ] **Step 1: Create the component file**

Create `client/src/pages/student/PaymentSubmitModal.tsx`:

```tsx
import { useState, useRef } from 'react'
import { X, UploadSimple, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import type { PaymentMethod } from '@/types/api'

interface Props {
  courseId: string
  teacherId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'nayapay', label: 'NayaPay' },
  { value: 'sadapay', label: 'SadaPay' },
  { value: 'zindigi', label: 'Zindigi' },
  { value: 'bank_local', label: 'Bank Transfer (Local)' },
  { value: 'bank_international', label: 'Bank Transfer (International)' },
]

export default function PaymentSubmitModal({ courseId, teacherId, isOpen, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('jazzcash')
  const [transactionId, setTransactionId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const reset = () => {
    setMethod('jazzcash')
    setTransactionId('')
    setAmount('')
    setCurrency('PKR')
    setFile(null)
    setError('')
    setSuccess(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Please upload a payment screenshot.'); return }
    if (!amount || Number(amount) <= 0) { setError('Please enter a valid amount.'); return }

    setLoading(true)
    setError('')
    try {
      await paymentsService.createPayment({
        courseId,
        teacherId,
        method,
        transactionId: transactionId || undefined,
        amount: Number(amount),
        currency,
        screenshot: file,
      })
      setSuccess(true)
      setTimeout(() => { reset(); onSuccess() }, 2000)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to submit payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Submit Payment Proof</h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} weight="fill" className="text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-slate-900 dark:text-white">Payment submitted!</p>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Awaiting admin approval.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                <WarningCircle size={16} weight="fill" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Payment Method</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Transaction ID <span className="normal-case font-normal">(optional)</span></label>
              <input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. TXN123456"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Amount *</label>
                <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as 'PKR' | 'USD')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Payment Screenshot *</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-neutral-700 text-sm text-slate-500 dark:text-neutral-400 hover:border-violet-400 hover:text-violet-600 transition-colors">
                <UploadSimple size={16} />
                {file ? file.name : 'Click to upload screenshot'}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm transition-colors">
              {loading ? 'Submitting…' : 'Submit Payment'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/student/PaymentSubmitModal.tsx
git commit -m "feat: add PaymentSubmitModal component for in-app payment proof submission"
```

---

## Task 10: Create PaymentStatusModal component

**Files:**
- Create: `client/src/pages/student/PaymentStatusModal.tsx`

This modal shows the current payment status for a locked enrollment and offers a resubmit button if rejected.

- [ ] **Step 1: Create the component file**

Create `client/src/pages/student/PaymentStatusModal.tsx`:

```tsx
import { X, Clock, XCircle, ArrowCounterClockwise } from '@phosphor-icons/react'
import type { EnrolledPayment } from '@/types/api'

interface Props {
  payment: EnrolledPayment
  isOpen: boolean
  onClose: () => void
  onResubmit: () => void
}

const METHOD_LABELS: Record<string, string> = {
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
  nayapay: 'NayaPay',
  sadapay: 'SadaPay',
  zindigi: 'Zindigi',
  bank_local: 'Bank Transfer (Local)',
  bank_international: 'Bank Transfer (International)',
}

export default function PaymentStatusModal({ payment, isOpen, onClose, onResubmit }: Props) {
  if (!isOpen) return null

  const isPending = payment.status === 'pending'
  const isRejected = payment.status === 'rejected'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-700 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Payment Status</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center py-4">
            {isPending ? (
              <div className="text-center">
                <Clock size={48} weight="fill" className="text-amber-500 mx-auto mb-3" />
                <p className="font-bold text-slate-900 dark:text-white">Under Review</p>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Your payment proof is being reviewed by our admin team.</p>
              </div>
            ) : (
              <div className="text-center">
                <XCircle size={48} weight="fill" className="text-red-500 mx-auto mb-3" />
                <p className="font-bold text-slate-900 dark:text-white">Payment Rejected</p>
                {payment.rejectionReason && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">Reason: {payment.rejectionReason}</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-neutral-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Method</span>
              <span className="font-semibold text-slate-900 dark:text-white">{METHOD_LABELS[payment.method] ?? payment.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Amount</span>
              <span className="font-semibold text-slate-900 dark:text-white">{payment.currency} {payment.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Submitted</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {new Date(payment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {isRejected && (
            <button onClick={() => { onClose(); onResubmit() }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors">
              <ArrowCounterClockwise size={16} weight="bold" />
              Resubmit Payment
            </button>
          )}

          {isPending && (
            <p className="text-center text-xs text-slate-400 dark:text-neutral-600">
              You'll receive a notification once your payment is processed.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/student/PaymentStatusModal.tsx
git commit -m "feat: add PaymentStatusModal component showing payment review status"
```

---

## Task 11: Update StudentCourses.tsx — access gating

**Files:**
- Modify: `client/src/pages/student/StudentCourses.tsx`

Each enrollment card must check `enrollment.isActive`. Locked enrollments open a modal instead of navigating to the course.

- [ ] **Step 1: Replace StudentCourses.tsx entirely**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { VideoCamera, CalendarBlank, FilePdf, ShieldCheck, ChatCircleDots, LockSimple, Warning } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { enrollmentsService } from '@/services/enrollments.service'
import type { Enrollment, EnrolledPayment } from '@/types/api'
import InstructorChatModal from '@/pages/student/InstructorChatModal'
import PaymentSubmitModal from '@/pages/student/PaymentSubmitModal'
import PaymentStatusModal from '@/pages/student/PaymentStatusModal'

export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [chatModal, setChatModal] = useState<{ name: string; courseTitle: string } | null>(null)
  const [submitModal, setSubmitModal] = useState<{ courseId: string; teacherId: string } | null>(null)
  const [statusModal, setStatusModal] = useState<{ payment: EnrolledPayment; courseId: string; teacherId: string } | null>(null)

  const fetchEnrollments = useCallback(() => {
    setLoading(true)
    enrollmentsService.getMyEnrollments()
      .then(res => { if (res.success) setEnrollments(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchEnrollments() }, [fetchEnrollments])

  const handlePaymentSuccess = () => {
    setSubmitModal(null)
    fetchEnrollments()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-48 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">My Live Classes</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">Join your live sessions, check your schedule, and access class materials.</p>
      </div>

      {enrollments.length === 0 && (
        <div className="py-20 text-center">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No courses yet</h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">You haven't enrolled in any courses.</p>
          <Link to="/courses" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm">Browse Courses</Link>
        </div>
      )}

      {enrollments.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Enrollments</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {enrollments.map(enrollment => {
              const attended = enrollment.progress?.sessionsAttended ?? 0
              const total = enrollment.progress?.totalSessions ?? 0
              const attendance = total > 0 ? Math.round((attended / total) * 100) : 0
              const isActive = enrollment.isActive
              const payment = enrollment.payment
              const hasPayment = !!payment
              const isRejected = payment?.status === 'rejected'

              const cardContent = (
                <>
                  <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-neutral-800">
                    <div className="flex justify-between items-start mb-2">
                      {isActive ? (
                        <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md uppercase tracking-wide">
                          Active
                        </span>
                      ) : isRejected ? (
                        <span className="text-[10px] font-bold px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md uppercase tracking-wide flex items-center gap-1">
                          <Warning size={10} weight="fill" /> Payment Rejected
                        </span>
                      ) : hasPayment ? (
                        <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md uppercase tracking-wide flex items-center gap-1">
                          <LockSimple size={10} weight="fill" /> Payment Pending
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md uppercase tracking-wide flex items-center gap-1">
                          <LockSimple size={10} weight="fill" /> Submit Payment
                        </span>
                      )}
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${attendance >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                        <ShieldCheck size={14} weight="fill" />
                        {attendance}% ({attended}/{total})
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
                      {enrollment.course.title}
                    </h4>

                    <div className="flex items-center justify-between mb-5">
                      <p className="text-sm text-slate-500 dark:text-neutral-400">
                        Instructor: <span className="font-semibold text-slate-700 dark:text-neutral-300">{enrollment.teacher?.name ?? '—'}</span>
                      </p>
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setChatModal({ name: enrollment.teacher?.name ?? '—', courseTitle: enrollment.course.title })
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <ChatCircleDots size={16} weight="fill" />
                          Chat
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800 p-3 rounded-xl border border-slate-100 dark:border-neutral-700">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-slate-400 dark:text-neutral-500 shadow-sm">
                          <CalendarBlank size={16} weight="fill" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Sessions</p>
                          <p>{attended} of {total} completed</p>
                        </div>
                      </div>

                      {isActive && (
                        <button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                          <FilePdf size={18} />
                          Class Materials & Notes
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6 md:w-64 bg-slate-50 dark:bg-neutral-900/50 flex flex-col justify-center">
                    {isActive ? (
                      <>
                        <div className="text-center mb-5">
                          <div className="w-12 h-12 mx-auto rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3">
                            <VideoCamera size={24} weight="fill" />
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Your Progress</p>
                          <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{attendance}%</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">attendance rate</p>
                        </div>
                        <div className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-bold py-3 rounded-xl text-sm shadow-[0_4px_14px_rgba(124,58,237,0.25)]">
                          View Course Details
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500">
                          <LockSimple size={24} weight="fill" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Course Locked</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                            {hasPayment ? 'Awaiting payment confirmation' : 'Submit payment to unlock'}
                          </p>
                        </div>
                        {hasPayment ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setStatusModal({ payment: payment!, courseId: enrollment.course._id, teacherId: enrollment.teacher._id })
                            }}
                            className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-white font-bold text-sm transition-colors hover:bg-slate-300 dark:hover:bg-neutral-600"
                          >
                            View Payment Status
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSubmitModal({ courseId: enrollment.course._id, teacherId: enrollment.teacher._id })
                            }}
                            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors"
                          >
                            Submit Payment
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )

              return isActive ? (
                <Link
                  to={`/dashboard/courses/${enrollment.course._id}`}
                  key={enrollment._id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors group"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={enrollment._id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col md:flex-row"
                >
                  {cardContent}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <InstructorChatModal
        isOpen={!!chatModal}
        onClose={() => setChatModal(null)}
        instructorName={chatModal?.name ?? ''}
        courseTitle={chatModal?.courseTitle ?? ''}
      />

      {submitModal && (
        <PaymentSubmitModal
          courseId={submitModal.courseId}
          teacherId={submitModal.teacherId}
          isOpen={!!submitModal}
          onClose={() => setSubmitModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {statusModal && (
        <PaymentStatusModal
          payment={statusModal.payment}
          isOpen={!!statusModal}
          onClose={() => setStatusModal(null)}
          onResubmit={() => {
            setStatusModal(null)
            setSubmitModal({ courseId: statusModal.courseId, teacherId: statusModal.teacherId })
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd client && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/student/StudentCourses.tsx
git commit -m "feat: gate course access behind enrollment.isActive with payment modals"
```

---

## Task 12: Rewrite StudentPayments.tsx — real API

**Files:**
- Modify: `client/src/pages/student/StudentPayments.tsx`

Remove all mock data. Fetch from `paymentsService.getMyPayments()` and display with real status, rejection reasons, and screenshot link.

- [ ] **Step 1: Replace StudentPayments.tsx entirely**

```tsx
import { useState, useEffect } from 'react'
import { Receipt, CheckCircle, Clock, XCircle, Image } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import type { Payment } from '@/types/api'

const METHOD_LABELS: Record<string, string> = {
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
  nayapay: 'NayaPay',
  sadapay: 'SadaPay',
  zindigi: 'Zindigi',
  bank_local: 'Bank (Local)',
  bank_international: 'Bank (Intl)',
}

export default function StudentPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    paymentsService.getMyPayments()
      .then(res => { if (res.success) setPayments(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Payments</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">View and manage your payment history and receipts.</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Course</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Method</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-right">Screenshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500 dark:text-neutral-400">
                    No payment records found.
                  </td>
                </tr>
              )}
              {payments.map(payment => (
                <>
                  <tr key={payment._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/20 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-neutral-400 font-medium">
                      {new Date(payment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {payment.course.title}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-neutral-400">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-neutral-800 text-xs font-semibold">
                        <Receipt size={14} />
                        {METHOD_LABELS[payment.method] ?? payment.method}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-black text-slate-900 dark:text-white text-right">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {payment.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle size={12} weight="fill" /> Approved
                        </span>
                      )}
                      {payment.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                          <Clock size={12} weight="fill" /> Pending
                        </span>
                      )}
                      {payment.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                          <XCircle size={12} weight="fill" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                      {payment.screenshotUrl ? (
                        <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer"
                          className="text-violet-600 hover:text-violet-700 font-semibold flex items-center justify-end gap-1">
                          <Image size={16} />
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-neutral-500">—</span>
                      )}
                    </td>
                  </tr>
                  {payment.status === 'rejected' && payment.rejectionReason && (
                    <tr key={`${payment._id}-reason`} className="bg-red-50/50 dark:bg-red-950/10">
                      <td colSpan={6} className="px-5 py-2 text-xs text-red-600 dark:text-red-400">
                        <span className="font-bold">Rejection reason:</span> {payment.rejectionReason}
                        {payment.adminNote && <span className="ml-4 text-slate-500 dark:text-neutral-500">Note: {payment.adminNote}</span>}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Remove studentData.ts MOCK_PAYMENTS import (verify it compiles)**

Run: `cd client && npx tsc --noEmit`
Expected: No errors referencing MOCK_PAYMENTS or studentData.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/student/StudentPayments.tsx
git commit -m "feat: replace mock payments with real API in StudentPayments"
```

---

## Task 13: Create AdminPaymentCreateModal

**Files:**
- Create: `client/src/pages/admin/AdminPaymentCreateModal.tsx`

Admin can search for a student and course, then create a payment record manually (no screenshot required).

- [ ] **Step 1: Create the component file**

Create `client/src/pages/admin/AdminPaymentCreateModal.tsx`:

```tsx
import { useState, useEffect, useRef } from 'react'
import { X, MagnifyingGlass, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import { usersService } from '@/services/users.service'
import { coursesService } from '@/services/courses.service'
import type { AdminCreatePaymentDto, PaymentMethod, User, Course } from '@/types/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'nayapay', label: 'NayaPay' },
  { value: 'sadapay', label: 'SadaPay' },
  { value: 'zindigi', label: 'Zindigi' },
  { value: 'bank_local', label: 'Bank Transfer (Local)' },
  { value: 'bank_international', label: 'Bank Transfer (International)' },
]

export default function AdminPaymentCreateModal({ isOpen, onClose, onSuccess }: Props) {
  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<User[]>([])
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null)

  const [courseSearch, setCourseSearch] = useState('')
  const [courseResults, setCourseResults] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const [method, setMethod] = useState<PaymentMethod>('jazzcash')
  const [transactionId, setTransactionId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR')
  const [adminNote, setAdminNote] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const studentTimer = useRef<ReturnType<typeof setTimeout>>()
  const courseTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!studentSearch.trim()) { setStudentResults([]); return }
    clearTimeout(studentTimer.current)
    studentTimer.current = setTimeout(() => {
      usersService.getAllUsers({ role: 'student', search: studentSearch, limit: 5 })
        .then(res => setStudentResults(res.data))
        .catch(() => {})
    }, 350)
  }, [studentSearch])

  useEffect(() => {
    if (!courseSearch.trim()) { setCourseResults([]); return }
    clearTimeout(courseTimer.current)
    courseTimer.current = setTimeout(() => {
      coursesService.getAllCourses({ search: courseSearch, limit: 5 })
        .then(res => setCourseResults(res.data))
        .catch(() => {})
    }, 350)
  }, [courseSearch])

  if (!isOpen) return null

  const reset = () => {
    setStudentSearch(''); setStudentResults([]); setSelectedStudent(null)
    setCourseSearch(''); setCourseResults([]); setSelectedCourse(null)
    setMethod('jazzcash'); setTransactionId(''); setAmount(''); setCurrency('PKR'); setAdminNote('')
    setError(''); setSuccess(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) { setError('Please select a student.'); return }
    if (!selectedCourse) { setError('Please select a course.'); return }
    if (!amount || Number(amount) <= 0) { setError('Please enter a valid amount.'); return }

    const teacherId = typeof selectedCourse.teacher === 'object'
      ? selectedCourse.teacher._id
      : String(selectedCourse.teacher)

    const dto: AdminCreatePaymentDto = {
      studentId: selectedStudent._id,
      courseId: selectedCourse._id,
      teacherId,
      method,
      transactionId: transactionId || undefined,
      amount: Number(amount),
      currency,
      adminNote: adminNote || undefined,
    }

    setLoading(true)
    setError('')
    try {
      await paymentsService.adminCreatePayment(dto)
      setSuccess(true)
      setTimeout(() => { reset(); onSuccess() }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create payment record.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-700 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Add Payment Record</h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} weight="fill" className="text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-slate-900 dark:text-white">Payment record created!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                <WarningCircle size={16} weight="fill" />
                {error}
              </div>
            )}

            {/* Student search */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Student *</label>
              {selectedStudent ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedStudent.name} <span className="font-normal text-slate-500">({selectedStudent.email})</span></span>
                  <button type="button" onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-red-500 ml-2"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search student by name or email…"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
                  </div>
                  {studentResults.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden">
                      {studentResults.map(u => (
                        <li key={u._id}>
                          <button type="button" onClick={() => { setSelectedStudent(u); setStudentSearch(''); setStudentResults([]) }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                            <span className="font-semibold text-slate-900 dark:text-white">{u.name}</span>
                            <span className="text-slate-400 dark:text-neutral-500 ml-2 text-xs">{u.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Course search */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Course *</label>
              {selectedCourse ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedCourse.title}</span>
                  <button type="button" onClick={() => setSelectedCourse(null)} className="text-slate-400 hover:text-red-500 ml-2"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={courseSearch} onChange={e => setCourseSearch(e.target.value)} placeholder="Search course by title…"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
                  </div>
                  {courseResults.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden">
                      {courseResults.map(c => (
                        <li key={c._id}>
                          <button type="button" onClick={() => { setSelectedCourse(c); setCourseSearch(''); setCourseResults([]) }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                            <span className="font-semibold text-slate-900 dark:text-white">{c.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Payment Method *</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Transaction ID <span className="normal-case font-normal">(optional)</span></label>
              <input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. TXN123456"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Amount *</label>
                <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as 'PKR' | 'USD')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Admin Note <span className="normal-case font-normal">(optional)</span></label>
              <input value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Internal note…"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm transition-colors">
              {loading ? 'Creating…' : 'Create Payment Record'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/admin/AdminPaymentCreateModal.tsx
git commit -m "feat: add AdminPaymentCreateModal for manual payment record creation"
```

---

## Task 14: Rewrite AdminPaymentsView + update AdminPage route

**Files:**
- Modify: `client/src/pages/admin/AdminPaymentsView.tsx` — full rewrite with real API CRUD
- Modify: `client/src/pages/AdminPage.tsx` — remove `store` prop from the payments route

The current view fetches from the wrong endpoint (`/payments/all`), uses local state for status changes (doesn't call API), and has no reject reason / approve note input. Rewrite it to use the real API.

- [ ] **Step 1: Replace AdminPaymentsView.tsx entirely**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle, WarningCircle, XCircle, MagnifyingGlass, FunnelSimple, Plus, Image } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import type { Payment } from '@/types/api'
import AdminPaymentCreateModal from './AdminPaymentCreateModal'

type ActionState = { paymentId: string; type: 'approve' | 'reject'; note: string } | null

export default function AdminPaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterMethod, setFilterMethod] = useState('All')
  const [action, setAction] = useState<ActionState>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const fetchPayments = useCallback(() => {
    setLoading(true)
    paymentsService.getAllPayments({ limit: 200 })
      .then(res => setPayments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const allMethods = ['All', ...Array.from(new Set(payments.map(p => p.method))).sort()]

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    const mQ = !q || p.student.name.toLowerCase().includes(q) || p.student.email.toLowerCase().includes(q) || p.method.toLowerCase().includes(q)
    const mS = filterStatus === 'All' || p.status === filterStatus
    const mM = filterMethod === 'All' || p.method === filterMethod
    return mQ && mS && mM
  })

  const totalPKR = payments.filter(p => p.status === 'approved' && p.currency === 'PKR').reduce((a, p) => a + p.amount, 0)
  const totalUSD = payments.filter(p => p.status === 'approved' && p.currency === 'USD').reduce((a, p) => a + p.amount, 0)
  const paidCount = payments.filter(p => p.status === 'approved').length
  const pendingCount = payments.filter(p => p.status === 'pending').length
  const failedCount = payments.filter(p => p.status === 'rejected').length

  const handleActionConfirm = async () => {
    if (!action) return
    if (action.type === 'reject' && !action.note.trim()) {
      setActionError('Rejection reason is required.')
      return
    }
    setActionLoading(true)
    setActionError('')
    try {
      if (action.type === 'approve') {
        await paymentsService.approvePayment(action.paymentId, action.note || undefined)
      } else {
        await paymentsService.rejectPayment(action.paymentId, action.note)
      }
      setAction(null)
      fetchPayments()
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || 'Action failed. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Payments</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Track and manage all payment records</p>
        </div>
        <button onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors">
          <Plus size={16} weight="bold" />
          Add Payment
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Revenue (PKR)', value: `₨${totalPKR.toLocaleString()}`, Icon: CreditCard, color: 'from-violet-500 to-purple-600', glow: 'rgba(124,58,237,0.35)' },
          { label: 'Revenue (USD)', value: `$${totalUSD}`, Icon: CreditCard, color: 'from-blue-500 to-blue-700', glow: 'rgba(59,130,246,0.35)' },
          { label: 'Approved', value: paidCount, Icon: CheckCircle, color: 'from-emerald-500 to-emerald-700', glow: 'rgba(16,185,129,0.35)' },
          { label: 'Pending / Rejected', value: `${pendingCount} / ${failedCount}`, Icon: WarningCircle, color: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.35)' },
        ].map(({ label, value, Icon, color, glow }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`} style={{ boxShadow: `0 4px 12px ${glow}` }}>
              <Icon size={16} weight="fill" className="text-white" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1">{value}</p>
            <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlass size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or method…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors" />
        </div>
        <div className="flex gap-2 items-center">
          <FunnelSimple size={14} className="text-slate-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
            {['All', 'pending', 'approved', 'rejected'].map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
            {allMethods.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Action panel */}
      {action && (
        <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-3">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {action.type === 'approve' ? '✓ Approve Payment' : '✕ Reject Payment'}
          </p>
          <input
            value={action.note}
            onChange={e => setAction(a => a ? { ...a, note: e.target.value } : a)}
            placeholder={action.type === 'approve' ? 'Admin note (optional)' : 'Rejection reason (required)'}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600"
          />
          {actionError && <p className="text-xs text-red-500">{actionError}</p>}
          <div className="flex gap-2">
            <button onClick={handleActionConfirm} disabled={actionLoading}
              className={`px-4 py-2 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-50 ${action.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {actionLoading ? 'Processing…' : 'Confirm'}
            </button>
            <button onClick={() => { setAction(null); setActionError('') }}
              className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-neutral-600 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Payment table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                {['Student', 'Course', 'Method', 'Amount', 'Status', 'Date', 'Screenshot', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {loading && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No payments found</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {(p.student.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{p.student.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[120px]">{p.student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">{p.course.title}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">{p.currency} {p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : p.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      }`}>{p.status}</span>
                      {p.status === 'rejected' && p.rejectionReason && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5 max-w-[140px] truncate" title={p.rejectionReason}>
                          {p.rejectionReason}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    {p.screenshotUrl ? (
                      <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-violet-600 hover:text-violet-700 text-xs font-semibold">
                        <Image size={14} /> View
                      </a>
                    ) : (
                      <span className="text-slate-300 dark:text-neutral-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setAction({ paymentId: p._id, type: 'approve', note: '' })}
                          title="Approve"
                          className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                          <CheckCircle size={13} weight="fill" />
                        </button>
                        <button
                          onClick={() => setAction({ paymentId: p._id, type: 'reject', note: '' })}
                          title="Reject"
                          className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
                          <XCircle size={13} weight="fill" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-slate-300 dark:text-neutral-700 mt-3 text-center">Hover a pending row to see approve/reject actions</p>

      <AdminPaymentCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => { setCreateModalOpen(false); fetchPayments() }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update AdminPage.tsx — remove store prop from AdminPaymentsView route**

In `client/src/pages/AdminPage.tsx`, find the line (around line 500):
```tsx
<Route path="/payments" element={<AdminPaymentsView store={store} />} />
```
Change it to:
```tsx
<Route path="/payments" element={<AdminPaymentsView />} />
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd client && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/admin/AdminPaymentsView.tsx client/src/pages/AdminPage.tsx
git commit -m "feat: rewrite AdminPaymentsView with real CRUD, approve/reject API, add payment modal"
```

---

## Final Verification

- [ ] **Start dev server and test student flow**

```bash
cd server && npm run dev
cd client && npm run dev
```

1. Log in as a student
2. Enroll in a published course → verify enrollment card shows "Submit Payment" state (not "Active")
3. Click "Submit Payment" → fill form → submit → verify payment submitted toast appears
4. Refresh → verify card now shows "Payment Pending" badge
5. Click card → verify PaymentStatusModal opens with pending state

- [ ] **Test admin approve flow**

1. Log in as admin
2. Go to Payments page → verify real payments appear (not mock data)
3. Hover a pending row → click Approve → enter optional note → Confirm
4. Verify row status changes to `approved`
5. Log back in as student → verify enrollment card now shows "Active" and course is accessible

- [ ] **Test admin reject + resubmit flow**

1. Admin rejects a pending payment (required reason)
2. Student sees "Payment Rejected" badge on course card
3. Student clicks → PaymentStatusModal shows rejection reason + "Resubmit" button
4. Student clicks Resubmit → PaymentSubmitModal opens → student submits new proof

- [ ] **Test admin manual payment creation**

1. Admin clicks "Add Payment" button
2. Search + select student and course
3. Fill method, amount → Create
4. Verify new payment appears in table with `pending` status
5. Approve it → verify student gains course access

- [ ] **Verify StudentPayments tab**

Log in as student → Payments tab → verify real payment history loads with correct status badges and rejection reasons where applicable.
