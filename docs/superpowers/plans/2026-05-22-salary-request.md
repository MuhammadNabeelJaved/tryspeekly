# Salary Request Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow teachers to submit salary payment requests from their InstructorSalary page; admins receive real-time notifications and can approve (auto-creates SalaryPayment) or reject with a reason.

**Architecture:** New `SalaryRequest` Mongoose model with its own controller/route file. Six API endpoints under `/api/v1/salary-requests`. Teacher UI adds a request form + history list to `InstructorSalary.tsx`. Admin UI adds a pending-request badge on the teacher list and an inline approve/reject section in the detail panel of `AdminSalaries.tsx`. Real-time updates piggyback on the existing `new_notification` Socket.io event.

**Tech Stack:** Node.js + Express (ES Modules), Mongoose, existing `createAndEmitNotification` util, React + TypeScript + Tailwind, `react-hook-form`, `react-hot-toast`, `framer-motion`, `@phosphor-icons/react`

---

## File Map

| File | Action |
|------|--------|
| `server/src/models/salary-request.model.js` | Create |
| `server/src/controllers/salary-request.controller.js` | Create |
| `server/src/routes/salary-request.route.js` | Create |
| `server/src/app.js` | Modify — import + mount new route |
| `client/src/types/api.ts` | Modify — add 3 new interfaces |
| `client/src/services/salary.service.ts` | Modify — add 6 new methods |
| `client/src/pages/instructor/InstructorSalary.tsx` | Modify — request form + history |
| `client/src/pages/admin/AdminSalaries.tsx` | Modify — pending badges + requests section |

---

## Task 1: SalaryRequest Mongoose Model

**Files:**
- Create: `server/src/models/salary-request.model.js`

- [ ] **Step 1: Write the model file**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const salaryRequestSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryPackage',
      required: [true, 'Package ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    periodLabel: {
      type: String,
      trim: true,
      maxlength: [100, 'Period label cannot exceed 100 characters'],
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
    },
    periodEnd: {
      type: Date,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminReply: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin reply cannot exceed 500 characters'],
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
)

salaryRequestSchema.index({ teacher: 1 })
salaryRequestSchema.index({ status: 1 })
salaryRequestSchema.index({ createdAt: -1 })

const SalaryRequest =
  mongoose.models.SalaryRequest || model('SalaryRequest', salaryRequestSchema)

export default SalaryRequest
```

- [ ] **Step 2: Verify the file exists**

Run: `ls server/src/models/salary-request.model.js`

- [ ] **Step 3: Commit**

```bash
git add server/src/models/salary-request.model.js
git commit -m "feat: add SalaryRequest model"
```

---

## Task 2: Salary Request Controller — Teacher Functions

**Files:**
- Create: `server/src/controllers/salary-request.controller.js`

The controller handles six handlers. This task covers the three teacher-facing ones.

- [ ] **Step 1: Create the controller with teacher handlers**

```js
import asyncHandler from '../utils/asyncHandler.js'
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../utils/apiErrors.js'
import SalaryRequest from '../models/salary-request.model.js'
import SalaryPackage from '../models/salary-package.model.js'
import User from '../models/user.model.js'
import { createAndEmitNotification } from '../utils/notify.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPeriod(start, end) {
  const opts = { month: 'long', year: 'numeric' }
  const s = new Date(start)
  if (!end) return s.toLocaleDateString('en-PK', opts)
  const e = new Date(end)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-PK', { month: 'long' })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  }
  return `${s.toLocaleDateString('en-PK', opts)} – ${e.toLocaleDateString('en-PK', opts)}`
}

// ─── Teacher Handlers ─────────────────────────────────────────────────────────

// POST /api/v1/salary-requests — teacher: submit a new salary request
export const createRequest = asyncHandler(async (req, res) => {
  const teacherId = req.user.id
  const { amount, periodStart, periodLabel, periodEnd, note } = req.body

  if (!amount || !periodStart) {
    throw new BadRequestError('amount and periodStart are required')
  }

  const pkg = await SalaryPackage.findOne({ teacher: teacherId })
  if (!pkg) throw new NotFoundError('No salary package found for your account')

  const existing = await SalaryRequest.findOne({ teacher: teacherId, status: 'pending' })
  if (existing) throw new ConflictError('You already have a pending salary request')

  const teacher = await User.findById(teacherId, 'name')

  const requestData = { teacher: teacherId, package: pkg._id, amount, periodStart }
  if (periodLabel !== undefined) requestData.periodLabel = periodLabel
  if (periodEnd !== undefined) requestData.periodEnd = periodEnd
  if (note !== undefined) requestData.note = note

  const request = await SalaryRequest.create(requestData)

  const admins = await User.find({ role: 'admin' }, '_id')
  for (const admin of admins) {
    await createAndEmitNotification({
      recipientId: admin._id,
      title: 'New Salary Request',
      message: `${teacher.name} has requested ₨${amount} for ${periodLabel || formatPeriod(periodStart, periodEnd)}.`,
      type: 'payment',
      severity: 'medium',
      relatedId: request._id,
      relatedType: 'SalaryRequest',
    })
  }

  res.status(201).json({ success: true, message: 'Salary request submitted', data: request })
})

// GET /api/v1/salary-requests/my — teacher: list own requests
export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await SalaryRequest.find({ teacher: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)

  res.json({ success: true, data: requests })
})

// DELETE /api/v1/salary-requests/:id — teacher: cancel own pending request
export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await SalaryRequest.findById(req.params.id)
  if (!request) throw new NotFoundError('Salary request not found')
  if (request.teacher.toString() !== req.user.id) throw new ForbiddenError('Not your request')
  if (request.status !== 'pending') throw new ForbiddenError('Only pending requests can be cancelled')

  await request.deleteOne()

  res.json({ success: true, message: 'Salary request cancelled' })
})
```

- [ ] **Step 2: Verify the file exists**

Run: `ls server/src/controllers/salary-request.controller.js`

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/salary-request.controller.js
git commit -m "feat: add salary-request controller (teacher functions)"
```

---

## Task 3: Salary Request Controller — Admin Functions

**Files:**
- Modify: `server/src/controllers/salary-request.controller.js`
- Note: also imports `SalaryPayment` which must be added to imports

- [ ] **Step 1: Add SalaryPayment import and admin handlers to the controller**

Add `import SalaryPayment from '../models/salary-payment.model.js'` to the imports block (after the existing imports), then append these three handlers at the bottom of the file:

```js
import SalaryPayment from '../models/salary-payment.model.js'
```

Append at bottom of `server/src/controllers/salary-request.controller.js`:

```js
// ─── Admin Handlers ───────────────────────────────────────────────────────────

// GET /api/v1/salary-requests — admin: list all requests (optional ?status= filter)
export const getAllRequests = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.status) filter.status = req.query.status
  if (req.query.teacher) filter.teacher = req.query.teacher

  const requests = await SalaryRequest.find(filter)
    .populate('teacher', 'name email profileImage')
    .sort({ createdAt: -1 })

  res.json({ success: true, data: requests })
})

// PATCH /api/v1/salary-requests/:id/approve — admin: approve, auto-create SalaryPayment
export const approveRequest = asyncHandler(async (req, res) => {
  const request = await SalaryRequest.findById(req.params.id)
  if (!request) throw new NotFoundError('Salary request not found')
  if (request.status !== 'pending') throw new BadRequestError('Request is no longer pending')

  const { adminReply } = req.body

  const paymentData = {
    package: request.package,
    teacher: request.teacher,
    amount: request.amount,
    periodStart: request.periodStart,
    status: 'paid',
    paidDate: new Date(),
  }
  if (request.periodLabel) paymentData.periodLabel = request.periodLabel
  if (request.periodEnd) paymentData.periodEnd = request.periodEnd

  await SalaryPayment.create(paymentData)

  request.status = 'approved'
  request.resolvedAt = new Date()
  if (adminReply !== undefined) request.adminReply = adminReply
  await request.save()

  await createAndEmitNotification({
    recipientId: request.teacher,
    title: 'Salary Request Approved',
    message: `Your salary request of ₨${request.amount} for ${request.periodLabel || formatPeriod(request.periodStart, request.periodEnd)} has been approved.`,
    type: 'payment',
    severity: 'low',
    relatedId: request._id,
    relatedType: 'SalaryRequest',
  })

  res.json({ success: true, message: 'Request approved and payment created', data: request })
})

// PATCH /api/v1/salary-requests/:id/reject — admin: reject with reason
export const rejectRequest = asyncHandler(async (req, res) => {
  const request = await SalaryRequest.findById(req.params.id)
  if (!request) throw new NotFoundError('Salary request not found')
  if (request.status !== 'pending') throw new BadRequestError('Request is no longer pending')

  const { adminReply } = req.body

  request.status = 'rejected'
  request.resolvedAt = new Date()
  if (adminReply !== undefined) request.adminReply = adminReply
  await request.save()

  await createAndEmitNotification({
    recipientId: request.teacher,
    title: 'Salary Request Update',
    message: `Your salary request of ₨${request.amount} for ${request.periodLabel || formatPeriod(request.periodStart, request.periodEnd)} was not approved.${adminReply ? ' Reason: ' + adminReply : ''}`,
    type: 'payment',
    severity: 'low',
    relatedId: request._id,
    relatedType: 'SalaryRequest',
  })

  res.json({ success: true, message: 'Request rejected', data: request })
})
```

- [ ] **Step 2: Verify no syntax errors (Node can parse the file)**

Run: `node --input-type=module --eval "import('./server/src/controllers/salary-request.controller.js').catch(e => { console.error(e.message); process.exit(1) })"`

If that fails due to missing env, just confirm the file looks correct with a quick read.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/salary-request.controller.js
git commit -m "feat: add salary-request controller (admin functions)"
```

---

## Task 4: Route File + App Mount

**Files:**
- Create: `server/src/routes/salary-request.route.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Create the route file**

```js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  createRequest,
  getMyRequests,
  cancelRequest,
  getAllRequests,
  approveRequest,
  rejectRequest,
} from '../controllers/salary-request.controller.js'

const router = express.Router()

// Teacher routes
router.get('/my', authenticate, authorize('teacher'), getMyRequests)
router.post('/', authenticate, authorize('teacher'), createRequest)
router.delete('/:id', authenticate, authorize('teacher'), cancelRequest)

// Admin routes
router.get('/', authenticate, authorize('admin'), getAllRequests)
router.patch('/:id/approve', authenticate, authorize('admin'), approveRequest)
router.patch('/:id/reject', authenticate, authorize('admin'), rejectRequest)

export default router
```

- [ ] **Step 2: Mount the route in app.js**

In `server/src/app.js`, find the line that imports `salaryRoutes`:
```js
import salaryRoutes from './src/routes/salary.route.js'
```

Add directly after it:
```js
import salaryRequestRoutes from './src/routes/salary-request.route.js'
```

Find the line that mounts salary routes:
```js
app.use('/api/v1/salaries', salaryRoutes)
```

Add directly after it:
```js
app.use('/api/v1/salary-requests', salaryRequestRoutes)
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/salary-request.route.js server/src/app.js
git commit -m "feat: add salary-request route and mount in app"
```

---

## Task 5: TypeScript Types + Client Service

**Files:**
- Modify: `client/src/types/api.ts`
- Modify: `client/src/services/salary.service.ts`

- [ ] **Step 1: Add new types to api.ts**

At the end of `client/src/types/api.ts`, append:

```ts
// ─── Salary Requests ──────────────────────────────────────────────────────────

export type SalaryRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SalaryRequest {
  _id: string;
  teacher: string;
  package: string;
  amount: number;
  periodLabel?: string;
  periodStart: string;
  periodEnd?: string;
  note?: string;
  status: SalaryRequestStatus;
  adminReply?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryRequestDto {
  amount: number;
  periodStart: string;
  periodLabel?: string;
  periodEnd?: string;
  note?: string;
}

export interface AdminResolveSalaryRequestDto {
  adminReply?: string;
}
```

- [ ] **Step 2: Add 6 new methods to salary.service.ts**

In `client/src/services/salary.service.ts`, update the import line to add the three new types:

```ts
import type {
  ApiResponse,
  SalaryPackage,
  SalaryPayment,
  SalaryRequest,
  CreateSalaryPackageDto,
  UpdateSalaryPackageDto,
  CreateSalaryPaymentDto,
  UpdateSalaryPaymentDto,
  CreateSalaryRequestDto,
  AdminResolveSalaryRequestDto,
} from '../types/api';
```

Then add these 6 methods to the `salaryService` object, before the closing `};`:

```ts
  async createRequest(data: CreateSalaryRequestDto): Promise<ApiResponse<SalaryRequest>> {
    const response = await axiosClient.post<ApiResponse<SalaryRequest>>(
      '/salary-requests',
      data
    );
    return response.data;
  },

  async getMyRequests(): Promise<ApiResponse<SalaryRequest[]>> {
    const response = await axiosClient.get<ApiResponse<SalaryRequest[]>>(
      '/salary-requests/my'
    );
    return response.data;
  },

  async cancelRequest(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(
      `/salary-requests/${id}`
    );
    return response.data;
  },

  async getAllRequests(params?: { status?: string; teacher?: string }): Promise<ApiResponse<SalaryRequest[]>> {
    const response = await axiosClient.get<ApiResponse<SalaryRequest[]>>(
      '/salary-requests',
      { params }
    );
    return response.data;
  },

  async approveRequest(
    id: string,
    data: AdminResolveSalaryRequestDto
  ): Promise<ApiResponse<SalaryRequest>> {
    const response = await axiosClient.patch<ApiResponse<SalaryRequest>>(
      `/salary-requests/${id}/approve`,
      data
    );
    return response.data;
  },

  async rejectRequest(
    id: string,
    data: AdminResolveSalaryRequestDto
  ): Promise<ApiResponse<SalaryRequest>> {
    const response = await axiosClient.patch<ApiResponse<SalaryRequest>>(
      `/salary-requests/${id}/reject`,
      data
    );
    return response.data;
  },
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd client && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/types/api.ts client/src/services/salary.service.ts
git commit -m "feat: add SalaryRequest types and service methods"
```

---

## Task 6: InstructorSalary — Request Form + History

**Files:**
- Modify: `client/src/pages/instructor/InstructorSalary.tsx`

The current file has three sections: header, package card, payment history. We insert a new "Request Salary" section between the package card and payment history. It is hidden when `pkg` is null.

- [ ] **Step 1: Rewrite InstructorSalary.tsx with request section**

Replace the entire content of `client/src/pages/instructor/InstructorSalary.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Money, CalendarBlank, SpinnerGap, PaperPlaneTilt, X, Check } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { salaryService } from '@/services/salary.service'
import type { SalaryPackage, SalaryPayment, SalaryRequest, SalaryType, CreateSalaryRequestDto } from '@/types/api'
import { getMethodById, getFaviconUrl } from '@/data/pakistanPaymentMethods'

const TYPE_LABELS: Record<SalaryType, string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
  per_course: 'Per Course',
  hourly: 'Hourly',
  custom: 'Custom',
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    inactive: 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400',
    paid: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    overdue: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
    approved: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[value] ?? 'bg-slate-100 text-slate-500'}`}>
      {value.replace('_', ' ')}
    </span>
  )
}

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors'

export default function InstructorSalary() {
  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState<SalaryPackage | null>(null)
  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [requests, setRequests] = useState<SalaryRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const [form, setForm] = useState<CreateSalaryRequestDto>({
    amount: 0,
    periodStart: '',
    periodLabel: '',
    periodEnd: '',
    note: '',
  })

  useEffect(() => {
    salaryService.getMyPackage()
      .then(res => {
        setPkg(res.data.package)
        setPayments(res.data.payments)
        if (res.data.package) loadRequests()
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function loadRequests() {
    setRequestsLoading(true)
    salaryService.getMyRequests()
      .then(res => setRequests(res.data))
      .catch(() => {})
      .finally(() => setRequestsLoading(false))
  }

  const hasPending = requests.some(r => r.status === 'pending')

  function openForm() {
    setForm({
      amount: pkg?.amount ?? 0,
      periodStart: '',
      periodLabel: '',
      periodEnd: '',
      note: '',
    })
    setShowForm(true)
  }

  async function submitRequest() {
    if (!form.amount || !form.periodStart) {
      toast.error('Amount and period start are required')
      return
    }
    setSubmitting(true)
    try {
      const payload: CreateSalaryRequestDto = {
        amount: Number(form.amount),
        periodStart: form.periodStart,
      }
      if (form.periodLabel) payload.periodLabel = form.periodLabel
      if (form.periodEnd) payload.periodEnd = form.periodEnd
      if (form.note) payload.note = form.note

      const res = await salaryService.createRequest(payload)
      setRequests(prev => [res.data, ...prev])
      setShowForm(false)
      toast.success('Salary request submitted')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(axiosErr?.response?.data?.error?.message ?? 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelReq(id: string) {
    setCancelling(id)
    try {
      await salaryService.cancelRequest(id)
      setRequests(prev => prev.filter(r => r._id !== id))
      toast.success('Request cancelled')
    } catch {
      toast.error('Failed to cancel request')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerGap size={28} className="animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">My Salary</h2>
        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Your current salary package and payment history</p>
      </div>

      {/* Package card */}
      {pkg ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
            <Money size={16} className="text-violet-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Current Package</h3>
            <StatusBadge value={pkg.status} />
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Amount', value: `₨${pkg.amount.toLocaleString()} / ${pkg.customType || TYPE_LABELS[pkg.type]}` },
              { label: 'Start Date', value: new Date(pkg.startDate).toLocaleDateString() },
              { label: 'End Date', value: pkg.endDate ? new Date(pkg.endDate).toLocaleDateString() : 'Ongoing' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-neutral-800/60 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}

            {pkg.notes && (
              <div className="col-span-2 sm:col-span-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-xl p-3">
                <p className="text-[10px] text-violet-500 dark:text-violet-400 font-semibold uppercase tracking-wide mb-0.5">Notes</p>
                <p className="text-sm text-slate-700 dark:text-neutral-300">{pkg.notes}</p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
            <Money size={28} className="text-slate-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">No salary package assigned yet</h3>
          <p className="text-xs text-slate-400 dark:text-neutral-500">Please contact admin to set up your salary package.</p>
        </motion.div>
      )}

      {/* Request Salary section — only when package exists */}
      {pkg && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <PaperPlaneTilt size={16} className="text-violet-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Request Salary</h3>
              {requests.length > 0 && (
                <span className="text-xs text-slate-400 dark:text-neutral-500">({requests.length})</span>
              )}
            </div>
            {!showForm && (
              <button
                onClick={openForm}
                disabled={hasPending}
                title={hasPending ? 'You already have a pending request' : undefined}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
              >
                + Request Salary
              </button>
            )}
          </div>

          {/* Inline request form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-slate-100 dark:border-neutral-800"
              >
                <div className="p-5 grid grid-cols-2 gap-4 bg-violet-50/40 dark:bg-violet-950/10">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Amount (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Period Label</label>
                    <input
                      value={form.periodLabel ?? ''}
                      onChange={e => setForm(f => ({ ...f, periodLabel: e.target.value }))}
                      placeholder="e.g. May 2026"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Period Start *</label>
                    <input
                      type="date"
                      value={form.periodStart}
                      onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Period End (optional)</label>
                    <input
                      type="date"
                      value={form.periodEnd ?? ''}
                      onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Note (optional)</label>
                    <textarea
                      value={form.note ?? ''}
                      onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      maxLength={500}
                      rows={2}
                      placeholder="Any note for the admin…"
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div className="col-span-2 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitRequest}
                      disabled={submitting}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {submitting ? <SpinnerGap size={13} className="animate-spin" /> : <Check size={13} weight="bold" />}
                      Submit Request
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Request history */}
          {requestsLoading ? (
            <div className="p-8 flex justify-center">
              <SpinnerGap size={22} className="animate-spin text-violet-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-sm">No requests yet.</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-neutral-800/50">
              {requests.map(r => (
                <div key={r._id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">₨{r.amount.toLocaleString()}</span>
                      {r.periodLabel && <span className="text-sm text-slate-400 dark:text-neutral-500">— {r.periodLabel}</span>}
                      <StatusBadge value={r.status} />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                      {new Date(r.periodStart).toLocaleDateString()}
                      {r.periodEnd && ` – ${new Date(r.periodEnd).toLocaleDateString()}`}
                      {' · '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    {r.note && (
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 italic">"{r.note}"</p>
                    )}
                    {r.adminReply && (
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                        <span className="font-semibold">Admin:</span> {r.adminReply}
                      </p>
                    )}
                  </div>
                  {r.status === 'pending' && (
                    <button
                      onClick={() => cancelReq(r._id)}
                      disabled={cancelling === r._id}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                      title="Cancel request"
                    >
                      {cancelling === r._id ? <SpinnerGap size={11} className="animate-spin" /> : <X size={11} />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Payment history */}
      {pkg && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
            <CalendarBlank size={16} className="text-violet-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Payment History</h3>
            <span className="text-xs text-slate-400 dark:text-neutral-500">({payments.length})</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-sm">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-neutral-800">
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Period</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Payment Method</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Amount</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Status</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/50">
                  {payments.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {p.periodLabel || new Date(p.periodStart).toLocaleDateString()}
                        </p>
                        {p.periodEnd && (
                          <p className="text-[10px] text-slate-400 dark:text-neutral-500">
                            {new Date(p.periodStart).toLocaleDateString()} – {new Date(p.periodEnd).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.paymentMethod ? (
                          <div className="flex items-center gap-1.5">
                            {p.paymentMethod === 'cash' ? (
                              <Money size={16} className="text-emerald-500 flex-shrink-0" />
                            ) : getMethodById(p.paymentMethod)?.domain ? (
                              <img
                                src={getFaviconUrl(getMethodById(p.paymentMethod)!.domain)}
                                alt=""
                                className="w-4 h-4 rounded object-cover flex-shrink-0"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : null}
                            <span className="text-sm text-slate-700 dark:text-neutral-300">
                              {getMethodById(p.paymentMethod)?.name ?? p.paymentMethod}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-neutral-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">₨{p.amount.toLocaleString()}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge value={p.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-600 dark:text-neutral-400">
                          {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd client && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/instructor/InstructorSalary.tsx
git commit -m "feat: add salary request form and history to InstructorSalary"
```

---

## Task 7: AdminSalaries — Pending Badges + Requests Section

**Files:**
- Modify: `client/src/pages/admin/AdminSalaries.tsx`

Three changes:
1. Fetch pending requests on load and derive a Set of teacher IDs with pending requests.
2. Show amber dot badge next to teachers in the list who have pending requests.
3. Add "Salary Requests" section in the detail panel (between Package Form and Payment History) with inline approve/reject flows. Re-fetch when `new_notification` socket event fires for `SalaryRequest`.

- [ ] **Step 1: Update AdminSalaries.tsx**

The changes below are applied as targeted edits to the existing file.

**1a — Add new imports** at the top (after existing imports):

```tsx
import { useSocket } from '@/context/SocketContext'
import type { SalaryRequest, AdminResolveSalaryRequestDto } from '@/types/api'
```

**1b — Add new state variables** in the component body, after the existing state declarations (after `const [deleteTarget, ...]`):

```tsx
const [pendingTeacherIds, setPendingTeacherIds] = useState<Set<string>>(new Set())
const [teacherRequests, setTeacherRequests] = useState<SalaryRequest[]>([])
const [requestsLoading, setRequestsLoading] = useState(false)
const [resolving, setResolving] = useState<string | null>(null)
const [resolveForm, setResolveForm] = useState<{ id: string; action: 'approve' | 'reject'; reply: string } | null>(null)
const { socket } = useSocket()
```

**1c — Fetch pending requests in `fetchData`** — add a third parallel request inside `Promise.allSettled`:

Replace the existing `fetchData` function with:

```tsx
const fetchData = useCallback(async () => {
  setLoading(true)
  try {
    const [usersRes, pkgsRes, pendingRes] = await Promise.allSettled([
      axiosClient.get('/users', { params: { role: 'teacher', limit: 200 } }),
      salaryService.getAllPackages(),
      salaryService.getAllRequests({ status: 'pending' }),
    ])

    const users: { _id?: string; id?: string; name?: string; email?: string; profileImage?: string }[] =
      usersRes.status === 'fulfilled' ? (usersRes.value.data?.data ?? []) : []
    const pkgs: SalaryPackage[] = pkgsRes.status === 'fulfilled' ? (pkgsRes.value.data ?? []) : []
    const pkgMap = new Map(pkgs.map(p => [p.teacher._id, p]))

    const pendingRequests: SalaryRequest[] = pendingRes.status === 'fulfilled' ? (pendingRes.value.data ?? []) : []
    setPendingTeacherIds(new Set(pendingRequests.map(r => r.teacher)))

    setTeachers(
      users.map(u => ({
        _id: u._id ?? u.id ?? '',
        name: u.name ?? '',
        email: u.email ?? '',
        profileImage: u.profileImage,
        pkg: pkgMap.get(u._id ?? u.id ?? '') ?? null,
      }))
    )
  } finally {
    setLoading(false)
  }
}, [])
```

**1d — Load teacher requests when a teacher is selected** — add a `loadTeacherRequests` function after `loadPayments`:

```tsx
async function loadTeacherRequests(teacherId: string) {
  setRequestsLoading(true)
  try {
    const res = await salaryService.getAllRequests({ teacher: teacherId })
    setTeacherRequests(res.data)
  } catch {
    setTeacherRequests([])
  } finally {
    setRequestsLoading(false)
  }
}
```

**1e — Call `loadTeacherRequests` inside `openTeacher`** — add after the existing `loadPayments` call:

```tsx
loadTeacherRequests(row._id)
```

Also reset request state at the top of `openTeacher`:

```tsx
setTeacherRequests([])
setResolveForm(null)
```

**1f — Add socket listener for real-time refresh** — add a `useEffect` after the existing `useEffect(() => { fetchData() }, [fetchData])`:

```tsx
useEffect(() => {
  if (!socket) return
  function handleNotification(notif: { relatedType?: string; relatedId?: string }) {
    if (notif.relatedType === 'SalaryRequest') {
      fetchData()
      if (selected) loadTeacherRequests(selected._id)
    }
  }
  socket.on('new_notification', handleNotification)
  return () => { socket.off('new_notification', handleNotification) }
}, [socket, selected, fetchData])
```

**1g — Add approve/reject handlers** after `confirmDeletePayment`:

```tsx
async function handleApprove(requestId: string) {
  setResolving(requestId)
  try {
    const data: AdminResolveSalaryRequestDto = {}
    if (resolveForm?.reply) data.adminReply = resolveForm.reply
    const res = await salaryService.approveRequest(requestId, data)
    setTeacherRequests(prev => prev.map(r => r._id === requestId ? res.data : r))
    setPendingTeacherIds(prev => {
      const next = new Set(prev)
      next.delete(res.data.teacher)
      return next
    })
    if (selected?.pkg) loadPayments(selected.pkg._id)
    setResolveForm(null)
    toast.success('Request approved — payment created')
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
    toast.error(axiosErr?.response?.data?.error?.message ?? 'Failed to approve')
  } finally {
    setResolving(null)
  }
}

async function handleReject(requestId: string) {
  if (!resolveForm?.reply?.trim()) {
    toast.error('Please provide a rejection reason')
    return
  }
  setResolving(requestId)
  try {
    const res = await salaryService.rejectRequest(requestId, { adminReply: resolveForm.reply })
    setTeacherRequests(prev => prev.map(r => r._id === requestId ? res.data : r))
    setPendingTeacherIds(prev => {
      const next = new Set(prev)
      next.delete(res.data.teacher)
      return next
    })
    setResolveForm(null)
    toast.success('Request rejected')
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
    toast.error(axiosErr?.response?.data?.error?.message ?? 'Failed to reject')
  } finally {
    setResolving(null)
  }
}
```

**1h — Add amber dot badge in the teacher list** — in the `filtered.map(row => ...)` block, find the teacher name paragraph and add the badge after it:

Replace:
```tsx
<p className="text-sm font-bold text-slate-900 dark:text-white truncate">{row.name}</p>
```

With:
```tsx
<div className="flex items-center gap-1.5">
  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{row.name}</p>
  {pendingTeacherIds.has(row._id) && (
    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Pending salary request" />
  )}
</div>
```

**1i — Add Salary Requests section in the detail panel** — find the `{/* ── Payments ── */}` comment block (around line 516) and insert the Salary Requests section directly before it:

```tsx
{/* ── Salary Requests ── */}
{selected.pkg && (
  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
      <PaperPlaneTilt size={16} className="text-violet-500" />
      <h3 className="text-sm font-black text-slate-900 dark:text-white">Salary Requests</h3>
      <span className="text-xs text-slate-400 dark:text-neutral-500">({teacherRequests.length})</span>
    </div>

    {requestsLoading ? (
      <div className="p-8 flex justify-center">
        <SpinnerGap size={22} className="animate-spin text-violet-500" />
      </div>
    ) : teacherRequests.length === 0 ? (
      <div className="p-6 text-center text-slate-400 dark:text-neutral-500 text-sm">No salary requests yet.</div>
    ) : (
      <div className="divide-y divide-slate-50 dark:divide-neutral-800/50">
        {teacherRequests.map(r => (
          <div key={r._id} className="px-5 py-3.5">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${r.status === 'pending' ? 'bg-amber-400' : r.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">₨{r.amount.toLocaleString()}</span>
                  {r.periodLabel && <span className="text-sm text-slate-400 dark:text-neutral-500">— {r.periodLabel}</span>}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                    : r.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                  }`}>{r.status}</span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                  {new Date(r.periodStart).toLocaleDateString()}
                  {r.periodEnd && ` – ${new Date(r.periodEnd).toLocaleDateString()}`}
                </p>
                {r.note && (
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 italic">Note: "{r.note}"</p>
                )}
                {r.adminReply && (
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    <span className="font-semibold">Reply:</span> {r.adminReply}
                  </p>
                )}
              </div>
            </div>

            {/* Inline approve/reject — only for pending */}
            {r.status === 'pending' && (
              <div className="mt-2 ml-5">
                {resolveForm?.id === r._id ? (
                  <div className="space-y-2">
                    <input
                      value={resolveForm.reply}
                      onChange={e => setResolveForm(f => f ? { ...f, reply: e.target.value } : f)}
                      placeholder={resolveForm.action === 'reject' ? 'Rejection reason (required)…' : 'Admin note (optional)…'}
                      className={inputCls}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setResolveForm(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={resolving === r._id}
                        onClick={() => resolveForm.action === 'approve' ? handleApprove(r._id) : handleReject(r._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-60 ${resolveForm.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}
                      >
                        {resolving === r._id ? <SpinnerGap size={11} className="animate-spin" /> : <Check size={11} weight="bold" />}
                        {resolveForm.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setResolveForm({ id: r._id, action: 'approve', reply: '' })}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolveForm({ id: r._id, action: 'reject', reply: '' })}
                      className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

Also add `PaperPlaneTilt` to the existing phosphor icon import line.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd client && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/admin/AdminSalaries.tsx
git commit -m "feat: add salary requests section and pending badges to AdminSalaries"
```

---

## Spec Self-Review

### Coverage check

| Spec requirement | Covered in task |
|-----------------|----------------|
| `SalaryRequest` model with all fields + indexes | Task 1 |
| One pending request constraint (ConflictError) | Task 2 |
| `createRequest` notifies all admins in real-time | Task 2 |
| `getMyRequests` — sorted newest first, limit 20 | Task 2 |
| `cancelRequest` — ownership + status check | Task 2 |
| `getAllRequests` — admin, `?status=` filter | Task 3 |
| `approveRequest` — auto-creates SalaryPayment | Task 3 |
| `rejectRequest` — saves adminReply | Task 3 |
| Teacher notifications on approve/reject | Task 3 |
| Route file + app.js mount | Task 4 |
| TypeScript types: `SalaryRequest`, `CreateSalaryRequestDto`, `AdminResolveSalaryRequestDto` | Task 5 |
| Service methods × 6 | Task 5 |
| Teacher UI: request form (amount, period, note) | Task 6 |
| Teacher UI: disabled button when pending exists | Task 6 |
| Teacher UI: request history list with status badges | Task 6 |
| Teacher UI: cancel button on pending rows | Task 6 |
| Admin UI: amber dot badges on teacher list | Task 7 |
| Admin UI: Salary Requests section in detail panel | Task 7 |
| Admin UI: inline approve flow (optional note) | Task 7 |
| Admin UI: inline reject flow (required reason) | Task 7 |
| Admin UI: real-time re-fetch on `new_notification` | Task 7 |
| Admin UI: Payment History re-fetches on approve | Task 7 |

All requirements covered.

### Placeholder scan

No TBD, TODO, or incomplete steps found.

### Type consistency

- `SalaryRequest` interface defined in Task 5, used in Tasks 6 and 7 — consistent.
- `CreateSalaryRequestDto` defined in Task 5, used in Task 6 — consistent.
- `AdminResolveSalaryRequestDto` defined in Task 5, used in Task 7 — consistent.
- `salaryService.getAllRequests({ teacher: ... })` — signature in Task 5 matches usage in Task 7 — consistent.
- `loadTeacherRequests` defined and called correctly in Task 7 — consistent.
