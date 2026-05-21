# Salary Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a salary management system where admins define teacher salary packages and log payment records, and teachers view their own salary and payment history.

**Architecture:** Two Mongoose models (`SalaryPackage` + `SalaryPayment`) with a single controller and route file on the server. On the client, a salary service, TypeScript types, an `AdminSalaries` page (two-panel layout), and an `InstructorSalary` page (read-only). Both new pages are wired into their respective dashboard shells.

**Tech Stack:** Node.js + Express v5 + Mongoose (server — plain JS ESM), React + TypeScript + Tailwind CSS + Framer Motion + react-hook-form + @phosphor-icons/react (client)

---

## File Map

**Server — new:**
- `server/src/models/salary-package.model.js`
- `server/src/models/salary-payment.model.js`
- `server/src/controllers/salary.controller.js`
- `server/src/routes/salary.route.js`

**Server — modified:**
- `server/app.js` — import salary route + `app.use('/api/v1/salaries', salaryRoutes)`

**Client — new:**
- `client/src/services/salary.service.ts`
- `client/src/pages/admin/AdminSalaries.tsx`
- `client/src/pages/instructor/InstructorSalary.tsx`

**Client — modified:**
- `client/src/types/api.ts` — add `SalaryPackage`, `SalaryPayment`, and DTO types
- `client/src/pages/AdminPage.tsx` — add `'salaries'` to `AdminView`, lazy import, `NAV_FINANCE` entry, `<Route>`
- `client/src/pages/InstructorDashboardPage.tsx` — add `'salary'` to `InstructorView`, lazy import, `NAV_MAIN` entry, `<Route>`

---

## Task 1: SalaryPackage Mongoose Model

**Files:**
- Create: `server/src/models/salary-package.model.js`

- [ ] **Step 1: Create the model file**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const salaryPackageSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
      unique: true,
    },
    amount: {
      type: Number,
      required: [true, 'Salary amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: {
        values: ['monthly', 'weekly', 'per_course', 'hourly', 'custom'],
        message: 'Invalid salary type',
      },
      required: [true, 'Salary type is required'],
    },
    customType: {
      type: String,
      trim: true,
      maxlength: [100, 'Custom type cannot exceed 100 characters'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true, versionKey: false }
)

salaryPackageSchema.index({ teacher: 1 })

const SalaryPackage = mongoose.models.SalaryPackage || model('SalaryPackage', salaryPackageSchema)

export default SalaryPackage
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/salary-package.model.js
git commit -m "feat: add SalaryPackage Mongoose model"
```

---

## Task 2: SalaryPayment Mongoose Model

**Files:**
- Create: `server/src/models/salary-payment.model.js`

- [ ] **Step 1: Create the model file**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const salaryPaymentSchema = new Schema(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryPackage',
      required: [true, 'Salary package is required'],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
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
    status: {
      type: String,
      enum: {
        values: ['paid', 'pending', 'overdue'],
        message: 'Invalid payment status',
      },
      default: 'pending',
    },
    paidDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true, versionKey: false }
)

salaryPaymentSchema.index({ package: 1 })
salaryPaymentSchema.index({ teacher: 1 })
salaryPaymentSchema.index({ createdAt: -1 })

const SalaryPayment = mongoose.models.SalaryPayment || model('SalaryPayment', salaryPaymentSchema)

export default SalaryPayment
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/salary-payment.model.js
git commit -m "feat: add SalaryPayment Mongoose model"
```

---

## Task 3: Salary Controller

**Files:**
- Create: `server/src/controllers/salary.controller.js`

- [ ] **Step 1: Create the controller with all nine handlers**

```js
import asyncHandler from '../utils/asyncHandler.js'
import SalaryPackage from '../models/salary-package.model.js'
import SalaryPayment from '../models/salary-payment.model.js'
import User from '../models/user.model.js'
import { NotFoundError, ConflictError, BadRequestError } from '../utils/apiErrors.js'

// ─── Admin: List all packages ──────────────────────────────────────────────────

export const getAllPackages = asyncHandler(async (req, res) => {
  const packages = await SalaryPackage.find()
    .populate('teacher', 'name email profileImage')
    .sort({ createdAt: -1 })

  res.json({ success: true, data: packages })
})

// ─── Admin: Create package ─────────────────────────────────────────────────────

export const createPackage = asyncHandler(async (req, res) => {
  const { teacher, amount, type, customType, startDate, endDate, status, notes } = req.body

  if (!teacher || !amount || !type || !startDate) {
    throw new BadRequestError('teacher, amount, type, and startDate are required')
  }

  const teacherUser = await User.findById(teacher)
  if (!teacherUser || teacherUser.role !== 'teacher') {
    throw new NotFoundError('Teacher not found')
  }

  const existing = await SalaryPackage.findOne({ teacher })
  if (existing) {
    throw new ConflictError('This teacher already has a salary package')
  }

  const pkg = await SalaryPackage.create({
    teacher,
    amount,
    type,
    customType: type === 'custom' ? customType : undefined,
    startDate,
    endDate: endDate || undefined,
    status: status ?? 'active',
    notes: notes || undefined,
  })

  await pkg.populate('teacher', 'name email profileImage')

  res.status(201).json({ success: true, message: 'Salary package created', data: pkg })
})

// ─── Admin: Update package ─────────────────────────────────────────────────────

export const updatePackage = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('Salary package not found')

  const { amount, type, customType, startDate, endDate, status, notes } = req.body

  if (amount !== undefined) pkg.amount = amount
  if (type !== undefined) {
    pkg.type = type
    pkg.customType = type === 'custom' ? customType : undefined
  }
  if (startDate !== undefined) pkg.startDate = startDate
  if (endDate !== undefined) pkg.endDate = endDate || undefined
  if (status !== undefined) pkg.status = status
  if (notes !== undefined) pkg.notes = notes || undefined

  await pkg.save()
  await pkg.populate('teacher', 'name email profileImage')

  res.json({ success: true, message: 'Salary package updated', data: pkg })
})

// ─── Admin: Delete package (cascades payments) ────────────────────────────────

export const deletePackage = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('Salary package not found')

  await SalaryPayment.deleteMany({ package: pkg._id })
  await pkg.deleteOne()

  res.json({ success: true, message: 'Salary package and all payments deleted' })
})

// ─── Admin: List payments for a package ───────────────────────────────────────

export const getPackagePayments = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('Salary package not found')

  const payments = await SalaryPayment.find({ package: pkg._id }).sort({ periodStart: -1 })

  res.json({ success: true, data: payments })
})

// ─── Admin: Add payment ────────────────────────────────────────────────────────

export const addPayment = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('Salary package not found')

  const { amount, periodLabel, periodStart, periodEnd, status, paidDate, notes } = req.body

  if (!amount || !periodStart) {
    throw new BadRequestError('amount and periodStart are required')
  }

  const payment = await SalaryPayment.create({
    package: pkg._id,
    teacher: pkg.teacher,
    amount,
    periodLabel: periodLabel || undefined,
    periodStart,
    periodEnd: periodEnd || undefined,
    status: status ?? 'pending',
    paidDate: status === 'paid' ? (paidDate || new Date()) : undefined,
    notes: notes || undefined,
  })

  res.status(201).json({ success: true, message: 'Payment record added', data: payment })
})

// ─── Admin: Update payment ────────────────────────────────────────────────────

export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await SalaryPayment.findOne({
    _id: req.params.paymentId,
    package: req.params.id,
  })
  if (!payment) throw new NotFoundError('Payment record not found')

  const { amount, periodLabel, periodStart, periodEnd, status, paidDate, notes } = req.body

  if (amount !== undefined) payment.amount = amount
  if (periodLabel !== undefined) payment.periodLabel = periodLabel || undefined
  if (periodStart !== undefined) payment.periodStart = periodStart
  if (periodEnd !== undefined) payment.periodEnd = periodEnd || undefined
  if (status !== undefined) {
    payment.status = status
    if (status === 'paid') payment.paidDate = paidDate || payment.paidDate || new Date()
    else payment.paidDate = undefined
  }
  if (notes !== undefined) payment.notes = notes || undefined

  await payment.save()

  res.json({ success: true, message: 'Payment record updated', data: payment })
})

// ─── Admin: Delete payment ────────────────────────────────────────────────────

export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await SalaryPayment.findOne({
    _id: req.params.paymentId,
    package: req.params.id,
  })
  if (!payment) throw new NotFoundError('Payment record not found')

  await payment.deleteOne()

  res.json({ success: true, message: 'Payment record deleted' })
})

// ─── Teacher: Own package + payments ─────────────────────────────────────────

export const getMyPackage = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findOne({ teacher: req.user.id })
    .populate('teacher', 'name email profileImage')

  if (!pkg) {
    return res.json({ success: true, data: { package: null, payments: [] } })
  }

  const payments = await SalaryPayment.find({ package: pkg._id }).sort({ periodStart: -1 })

  res.json({ success: true, data: { package: pkg, payments } })
})
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/salary.controller.js
git commit -m "feat: add salary controller with package and payment CRUD"
```

---

## Task 4: Salary Route + Register in app.js

**Files:**
- Create: `server/src/routes/salary.route.js`
- Modify: `server/app.js`

- [ ] **Step 1: Create the route file**

```js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getPackagePayments,
  addPayment,
  updatePayment,
  deletePayment,
  getMyPackage,
} from '../controllers/salary.controller.js'

const router = express.Router()

// ─── Teacher routes ────────────────────────────────────────────────────────────
router.get('/my', authenticate, authorize('teacher'), getMyPackage)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/')
  .get(authenticate, authorize('admin'), getAllPackages)
  .post(authenticate, authorize('admin'), createPackage)

router.route('/:id')
  .patch(authenticate, authorize('admin'), updatePackage)
  .delete(authenticate, authorize('admin'), deletePackage)

router.route('/:id/payments')
  .get(authenticate, authorize('admin'), getPackagePayments)
  .post(authenticate, authorize('admin'), addPayment)

router.route('/:id/payments/:paymentId')
  .patch(authenticate, authorize('admin'), updatePayment)
  .delete(authenticate, authorize('admin'), deletePayment)

export default router
```

- [ ] **Step 2: Register the route in app.js**

In `server/app.js`, add the import after the `geoRoutes` import line:

```js
import salaryRoutes from './src/routes/salary.route.js'
```

Then add the `app.use` after `app.use('/api/v1/geo', geoRoutes)`:

```js
app.use('/api/v1/salaries', salaryRoutes)
```

- [ ] **Step 3: Smoke-test the routes are reachable**

Start the server (`npm run dev` in `server/`) and run:

```bash
curl -s http://localhost:5000/api/health
```

Expected: `{"success":true,"message":"Server is healthy",...}`

If the server starts without crashing, the route registration is correct.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/salary.route.js server/app.js
git commit -m "feat: add salary route and register at /api/v1/salaries"
```

---

## Task 5: TypeScript Types in client/src/types/api.ts

**Files:**
- Modify: `client/src/types/api.ts`

- [ ] **Step 1: Append salary types to the end of the file**

Open `client/src/types/api.ts` and add this block at the end of the file:

```ts
// ─── Salary Types ─────────────────────────────────────────────────────────────

export type SalaryType = 'monthly' | 'weekly' | 'per_course' | 'hourly' | 'custom';
export type SalaryPackageStatus = 'active' | 'inactive';
export type SalaryPaymentStatus = 'paid' | 'pending' | 'overdue';

export interface SalaryPackage {
  _id: string;
  teacher: Pick<User, '_id' | 'name' | 'email' | 'profileImage'>;
  amount: number;
  type: SalaryType;
  customType?: string;
  startDate: string;
  endDate?: string;
  status: SalaryPackageStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryPayment {
  _id: string;
  package: string;
  teacher: string;
  amount: number;
  periodLabel?: string;
  periodStart: string;
  periodEnd?: string;
  status: SalaryPaymentStatus;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryPackageDto {
  teacher: string;
  amount: number;
  type: SalaryType;
  customType?: string;
  startDate: string;
  endDate?: string;
  status?: SalaryPackageStatus;
  notes?: string;
}

export interface UpdateSalaryPackageDto {
  amount?: number;
  type?: SalaryType;
  customType?: string;
  startDate?: string;
  endDate?: string;
  status?: SalaryPackageStatus;
  notes?: string;
}

export interface CreateSalaryPaymentDto {
  amount: number;
  periodLabel?: string;
  periodStart: string;
  periodEnd?: string;
  status?: SalaryPaymentStatus;
  paidDate?: string;
  notes?: string;
}

export interface UpdateSalaryPaymentDto {
  amount?: number;
  periodLabel?: string;
  periodStart?: string;
  periodEnd?: string;
  status?: SalaryPaymentStatus;
  paidDate?: string;
  notes?: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts
git commit -m "feat: add SalaryPackage and SalaryPayment TypeScript types"
```

---

## Task 6: Salary Service

**Files:**
- Create: `client/src/services/salary.service.ts`

- [ ] **Step 1: Create the service file**

```ts
import { axiosClient } from '../lib/axiosClient';
import type {
  ApiResponse,
  SalaryPackage,
  SalaryPayment,
  CreateSalaryPackageDto,
  UpdateSalaryPackageDto,
  CreateSalaryPaymentDto,
  UpdateSalaryPaymentDto,
} from '../types/api';

export const salaryService = {
  async getAllPackages(): Promise<ApiResponse<SalaryPackage[]>> {
    const res = await axiosClient.get<ApiResponse<SalaryPackage[]>>('/salaries');
    return res.data;
  },

  async createPackage(data: CreateSalaryPackageDto): Promise<ApiResponse<SalaryPackage>> {
    const res = await axiosClient.post<ApiResponse<SalaryPackage>>('/salaries', data);
    return res.data;
  },

  async updatePackage(id: string, data: UpdateSalaryPackageDto): Promise<ApiResponse<SalaryPackage>> {
    const res = await axiosClient.patch<ApiResponse<SalaryPackage>>(`/salaries/${id}`, data);
    return res.data;
  },

  async deletePackage(id: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosClient.delete<{ success: boolean; message: string }>(`/salaries/${id}`);
    return res.data;
  },

  async getPackagePayments(packageId: string): Promise<ApiResponse<SalaryPayment[]>> {
    const res = await axiosClient.get<ApiResponse<SalaryPayment[]>>(`/salaries/${packageId}/payments`);
    return res.data;
  },

  async addPayment(packageId: string, data: CreateSalaryPaymentDto): Promise<ApiResponse<SalaryPayment>> {
    const res = await axiosClient.post<ApiResponse<SalaryPayment>>(`/salaries/${packageId}/payments`, data);
    return res.data;
  },

  async updatePayment(
    packageId: string,
    paymentId: string,
    data: UpdateSalaryPaymentDto
  ): Promise<ApiResponse<SalaryPayment>> {
    const res = await axiosClient.patch<ApiResponse<SalaryPayment>>(
      `/salaries/${packageId}/payments/${paymentId}`,
      data
    );
    return res.data;
  },

  async deletePayment(packageId: string, paymentId: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosClient.delete<{ success: boolean; message: string }>(
      `/salaries/${packageId}/payments/${paymentId}`
    );
    return res.data;
  },

  async getMyPackage(): Promise<ApiResponse<{ package: SalaryPackage | null; payments: SalaryPayment[] }>> {
    const res = await axiosClient.get<ApiResponse<{ package: SalaryPackage | null; payments: SalaryPayment[] }>>(
      '/salaries/my'
    );
    return res.data;
  },
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/services/salary.service.ts
git commit -m "feat: add salary service with full API client"
```

---

## Task 7: AdminSalaries Page

**Files:**
- Create: `client/src/pages/admin/AdminSalaries.tsx`

- [ ] **Step 1: Create the full page component**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, PencilSimple, Trash, X, Check, Money, SpinnerGap,
  MagnifyingGlass, CaretRight, CalendarBlank, Warning,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { axiosClient } from '@/lib/axiosClient'
import { salaryService } from '@/services/salary.service'
import UserAvatar from '@/components/UserAvatar'
import type {
  SalaryPackage,
  SalaryPayment,
  SalaryType,
  SalaryPackageStatus,
  SalaryPaymentStatus,
} from '@/types/api'

// ─── Local types ──────────────────────────────────────────────────────────────

interface TeacherRow {
  _id: string
  name: string
  email: string
  profileImage?: string
  pkg: SalaryPackage | null
}

interface PackageFormValues {
  amount: number
  type: SalaryType
  customType: string
  startDate: string
  endDate: string
  status: SalaryPackageStatus
  notes: string
}

interface PaymentFormValues {
  amount: number
  periodLabel: string
  periodStart: string
  periodEnd: string
  status: SalaryPaymentStatus
  paidDate: string
  notes: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[value] ?? 'bg-slate-100 text-slate-500'}`}>
      {value.replace('_', ' ')}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors'

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSalaries() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<TeacherRow | null>(null)
  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<SalaryPayment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<'package' | string | null>(null)

  const pkgForm = useForm<PackageFormValues>({
    defaultValues: { amount: 0, type: 'monthly', customType: '', startDate: '', endDate: '', status: 'active', notes: '' },
  })
  const watchType = pkgForm.watch('type')

  const payForm = useForm<PaymentFormValues>({
    defaultValues: { amount: 0, periodLabel: '', periodStart: '', periodEnd: '', status: 'pending', paidDate: '', notes: '' },
  })
  const watchPayStatus = payForm.watch('status')

  // ─── Load data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, pkgsRes] = await Promise.allSettled([
        axiosClient.get('/users', { params: { role: 'teacher', limit: 200 } }),
        salaryService.getAllPackages(),
      ])

      const users: any[] = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data ?? []) : []
      const pkgs: SalaryPackage[] = pkgsRes.status === 'fulfilled' ? (pkgsRes.value.data ?? []) : []
      const pkgMap = new Map(pkgs.map(p => [p.teacher._id, p]))

      setTeachers(
        users.map((u: any) => ({
          _id: u._id ?? u.id,
          name: u.name ?? '',
          email: u.email ?? '',
          profileImage: u.profileImage,
          pkg: pkgMap.get(u._id ?? u.id) ?? null,
        }))
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Select teacher ──────────────────────────────────────────────────────────

  function openTeacher(row: TeacherRow) {
    setSelected(row)
    setShowPaymentForm(false)
    setEditingPayment(null)
    if (row.pkg) {
      pkgForm.reset({
        amount: row.pkg.amount,
        type: row.pkg.type,
        customType: row.pkg.customType ?? '',
        startDate: row.pkg.startDate.slice(0, 10),
        endDate: row.pkg.endDate ? row.pkg.endDate.slice(0, 10) : '',
        status: row.pkg.status,
        notes: row.pkg.notes ?? '',
      })
      loadPayments(row.pkg._id)
    } else {
      pkgForm.reset({ amount: 0, type: 'monthly', customType: '', startDate: '', endDate: '', status: 'active', notes: '' })
      setPayments([])
    }
  }

  async function loadPayments(pkgId: string) {
    setPaymentsLoading(true)
    try {
      const res = await salaryService.getPackagePayments(pkgId)
      setPayments(res.data)
    } catch {
      setPayments([])
    } finally {
      setPaymentsLoading(false)
    }
  }

  // ─── Save package ────────────────────────────────────────────────────────────

  async function onSavePackage(values: PackageFormValues) {
    if (!selected) return
    setSaving(true)
    try {
      const payload = {
        amount: Number(values.amount),
        type: values.type,
        customType: values.type === 'custom' ? values.customType : undefined,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        status: values.status,
        notes: values.notes || undefined,
      }

      let updatedPkg: SalaryPackage
      if (selected.pkg) {
        const res = await salaryService.updatePackage(selected.pkg._id, payload)
        updatedPkg = res.data
        toast.success('Salary package updated')
      } else {
        const res = await salaryService.createPackage({ ...payload, teacher: selected._id })
        updatedPkg = res.data
        toast.success('Salary package created')
        loadPayments(updatedPkg._id)
      }

      const updatedRow: TeacherRow = { ...selected, pkg: updatedPkg }
      setSelected(updatedRow)
      setTeachers(prev => prev.map(t => (t._id === selected._id ? updatedRow : t)))
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Failed to save package')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete package ──────────────────────────────────────────────────────────

  async function confirmDeletePackage() {
    if (!selected?.pkg) return
    setSaving(true)
    try {
      await salaryService.deletePackage(selected.pkg._id)
      toast.success('Package deleted')
      const updatedRow: TeacherRow = { ...selected, pkg: null }
      setSelected(updatedRow)
      setTeachers(prev => prev.map(t => (t._id === selected._id ? updatedRow : t)))
      setPayments([])
      pkgForm.reset({ amount: 0, type: 'monthly', customType: '', startDate: '', endDate: '', status: 'active', notes: '' })
    } catch {
      toast.error('Failed to delete package')
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  // ─── Save payment ────────────────────────────────────────────────────────────

  async function onSavePayment(values: PaymentFormValues) {
    if (!selected?.pkg) return
    setSaving(true)
    try {
      const payload = {
        amount: Number(values.amount),
        periodLabel: values.periodLabel || undefined,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd || undefined,
        status: values.status,
        paidDate: values.status === 'paid' ? (values.paidDate || undefined) : undefined,
        notes: values.notes || undefined,
      }

      if (editingPayment) {
        const res = await salaryService.updatePayment(selected.pkg._id, editingPayment._id, payload)
        setPayments(prev => prev.map(p => (p._id === editingPayment._id ? res.data : p)))
        toast.success('Payment updated')
      } else {
        const res = await salaryService.addPayment(selected.pkg._id, payload)
        setPayments(prev => [res.data, ...prev])
        toast.success('Payment added')
      }

      setShowPaymentForm(false)
      setEditingPayment(null)
      payForm.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Failed to save payment')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete payment ──────────────────────────────────────────────────────────

  async function confirmDeletePayment(paymentId: string) {
    if (!selected?.pkg) return
    setSaving(true)
    try {
      await salaryService.deletePayment(selected.pkg._id, paymentId)
      setPayments(prev => prev.filter(p => p._id !== paymentId))
      toast.success('Payment deleted')
    } catch {
      toast.error('Failed to delete payment')
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  function openEditPayment(p: SalaryPayment) {
    setEditingPayment(p)
    payForm.reset({
      amount: p.amount,
      periodLabel: p.periodLabel ?? '',
      periodStart: p.periodStart.slice(0, 10),
      periodEnd: p.periodEnd ? p.periodEnd.slice(0, 10) : '',
      status: p.status,
      paidDate: p.paidDate ? p.paidDate.slice(0, 10) : '',
      notes: p.notes ?? '',
    })
    setShowPaymentForm(true)
  }

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase()
    return !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
  })

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full gap-0 overflow-hidden">

      {/* ── Teacher List ── */}
      <div className={`flex flex-col border-r border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all ${selected ? 'w-72 flex-shrink-0 hidden lg:flex' : 'flex-1'}`}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Salary Management</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
            {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
          </p>
          <div className="relative mt-3">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teachers…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-neutral-800/50">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full animate-pulse bg-slate-200 dark:bg-neutral-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded animate-pulse bg-slate-200 dark:bg-neutral-800 w-3/4" />
                  <div className="h-2.5 rounded animate-pulse bg-slate-200 dark:bg-neutral-800 w-1/2" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-sm">No teachers found</div>
          ) : filtered.map(row => (
            <button
              key={row._id}
              onClick={() => openTeacher(row)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors text-left ${selected?._id === row._id ? 'bg-violet-50 dark:bg-violet-950/20' : ''}`}
            >
              <UserAvatar src={row.profileImage} name={row.name} size="md" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{row.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate">{row.email}</p>
                {row.pkg ? (
                  <p className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">
                    ₨{row.pkg.amount.toLocaleString()} / {TYPE_LABELS[row.pkg.type]}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-300 dark:text-neutral-600 mt-0.5">No package</p>
                )}
              </div>
              <CaretRight size={13} className="text-slate-300 dark:text-neutral-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col bg-slate-50 dark:bg-neutral-950 overflow-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 lg:hidden"
              >
                <X size={14} />
              </button>
              <UserAvatar src={selected.profileImage} name={selected.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{selected.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate">{selected.email}</p>
              </div>
              {selected.pkg && (
                <StatusBadge value={selected.pkg.status} />
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* ── Package Form ── */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Money size={16} className="text-violet-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {selected.pkg ? 'Salary Package' : 'Assign Salary Package'}
                    </h3>
                  </div>
                  {selected.pkg && (
                    <button
                      onClick={() => setDeleteTarget('package')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash size={13} /> Delete
                    </button>
                  )}
                </div>

                <form onSubmit={pkgForm.handleSubmit(onSavePackage)} className="p-5 grid grid-cols-2 gap-4">
                  <Field label="Amount (PKR)">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      {...pkgForm.register('amount', { valueAsNumber: true })}
                      placeholder="75000"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Type">
                    <select {...pkgForm.register('type')} className={inputCls}>
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="per_course">Per Course</option>
                      <option value="hourly">Hourly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </Field>

                  {watchType === 'custom' && (
                    <Field label="Custom Type Label">
                      <input {...pkgForm.register('customType')} placeholder="e.g. Bi-weekly" className={inputCls} />
                    </Field>
                  )}

                  <Field label="Start Date">
                    <input type="date" {...pkgForm.register('startDate')} className={inputCls} />
                  </Field>

                  <Field label="End Date (optional)">
                    <input type="date" {...pkgForm.register('endDate')} className={inputCls} />
                  </Field>

                  <Field label="Status">
                    <select {...pkgForm.register('status')} className={inputCls}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </Field>

                  <div className="col-span-2">
                    <Field label="Notes (optional)">
                      <textarea
                        {...pkgForm.register('notes')}
                        rows={2}
                        placeholder="Any additional notes…"
                        className={`${inputCls} resize-none`}
                      />
                    </Field>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors"
                    >
                      {saving ? <SpinnerGap size={14} className="animate-spin" /> : <Check size={14} weight="bold" />}
                      {selected.pkg ? 'Save Changes' : 'Create Package'}
                    </button>
                  </div>
                </form>
              </div>

              {/* ── Payments ── */}
              {selected.pkg && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <CalendarBlank size={16} className="text-violet-500" />
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Payment History</h3>
                      <span className="text-xs text-slate-400 dark:text-neutral-500">({payments.length})</span>
                    </div>
                    {!showPaymentForm && (
                      <button
                        onClick={() => { setShowPaymentForm(true); setEditingPayment(null); payForm.reset() }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        <Plus size={13} weight="bold" /> Add Payment
                      </button>
                    )}
                  </div>

                  {/* Inline payment form */}
                  <AnimatePresence>
                    {showPaymentForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-slate-100 dark:border-neutral-800"
                      >
                        <form onSubmit={payForm.handleSubmit(onSavePayment)} className="p-5 grid grid-cols-2 gap-4 bg-violet-50/40 dark:bg-violet-950/10">
                          <Field label="Amount (PKR)">
                            <input
                              type="number"
                              min={0}
                              step={100}
                              {...payForm.register('amount', { valueAsNumber: true })}
                              placeholder="75000"
                              className={inputCls}
                            />
                          </Field>

                          <Field label="Period Label">
                            <input {...payForm.register('periodLabel')} placeholder="e.g. May 2026" className={inputCls} />
                          </Field>

                          <Field label="Period Start">
                            <input type="date" {...payForm.register('periodStart')} className={inputCls} />
                          </Field>

                          <Field label="Period End (optional)">
                            <input type="date" {...payForm.register('periodEnd')} className={inputCls} />
                          </Field>

                          <Field label="Status">
                            <select {...payForm.register('status')} className={inputCls}>
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          </Field>

                          {watchPayStatus === 'paid' && (
                            <Field label="Paid Date">
                              <input type="date" {...payForm.register('paidDate')} className={inputCls} />
                            </Field>
                          )}

                          <div className="col-span-2">
                            <Field label="Notes (optional)">
                              <input {...payForm.register('notes')} placeholder="Optional note…" className={inputCls} />
                            </Field>
                          </div>

                          <div className="col-span-2 flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => { setShowPaymentForm(false); setEditingPayment(null) }}
                              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={saving}
                              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                            >
                              {saving ? <SpinnerGap size={13} className="animate-spin" /> : <Check size={13} weight="bold" />}
                              {editingPayment ? 'Update Payment' : 'Add Payment'}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Payment list */}
                  {paymentsLoading ? (
                    <div className="p-8 flex justify-center">
                      <SpinnerGap size={24} className="animate-spin text-violet-500" />
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-sm">No payments recorded yet.</div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-neutral-800/50">
                      {payments.map(p => (
                        <div key={p._id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              ₨{p.amount.toLocaleString()}
                              {p.periodLabel && <span className="text-slate-400 dark:text-neutral-500 font-normal ml-1.5">— {p.periodLabel}</span>}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <StatusBadge value={p.status} />
                              {p.paidDate && (
                                <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                                  Paid {new Date(p.paidDate).toLocaleDateString()}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                                {new Date(p.periodStart).toLocaleDateString()}
                                {p.periodEnd && ` – ${new Date(p.periodEnd).toLocaleDateString()}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditPayment(p)}
                              className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors"
                            >
                              <PencilSimple size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p._id)}
                              className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state (no teacher selected) ── */}
      {!selected && !loading && teachers.length > 0 && (
        <div className="hidden lg:flex flex-1 items-center justify-center text-slate-300 dark:text-neutral-700 flex-col gap-3">
          <Money size={48} weight="thin" />
          <p className="text-sm font-semibold">Select a teacher to manage their salary</p>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <Warning size={22} className="text-red-500" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-1">
                {deleteTarget === 'package' ? 'Delete Package?' : 'Delete Payment?'}
              </h3>
              <p className="text-sm text-slate-400 dark:text-neutral-500 mb-5">
                {deleteTarget === 'package'
                  ? 'This will permanently delete the salary package and all its payment records.'
                  : 'This payment record will be permanently removed.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTarget === 'package' ? confirmDeletePackage() : confirmDeletePayment(deleteTarget)}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/admin/AdminSalaries.tsx
git commit -m "feat: add AdminSalaries page with package and payment management"
```

---

## Task 8: InstructorSalary Page

**Files:**
- Create: `client/src/pages/instructor/InstructorSalary.tsx`

- [ ] **Step 1: Create the page component**

```tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Money, CalendarBlank, SpinnerGap } from '@phosphor-icons/react'
import { salaryService } from '@/services/salary.service'
import type { SalaryPackage, SalaryPayment, SalaryType } from '@/types/api'

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
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[value] ?? 'bg-slate-100 text-slate-500'}`}>
      {value.replace('_', ' ')}
    </span>
  )
}

export default function InstructorSalary() {
  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState<SalaryPackage | null>(null)
  const [payments, setPayments] = useState<SalaryPayment[]>([])

  useEffect(() => {
    salaryService.getMyPackage()
      .then(res => {
        setPkg(res.data.package)
        setPayments(res.data.payments)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/instructor/InstructorSalary.tsx
git commit -m "feat: add InstructorSalary read-only page"
```

---

## Task 9: Wire AdminPage.tsx

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

- [ ] **Step 1: Add lazy import**

After the `AdminGeoAccess` lazy import line (line ~39), add:

```ts
const AdminSalaries = lazy(() => import('./admin/AdminSalaries'))
```

- [ ] **Step 2: Add 'salaries' to AdminView type**

Find this line (line ~43):
```ts
export type AdminView = 'overview' | 'students' | 'instructors' | 'courses' | 'certificates' | 'payments' | 'payments-setup' | 'financial-aid' | 'cms' | 'blog' | 'settings' | 'support' | 'notifications' | 'messages' | 'seo' | 'reviews' | 'geo-access'
```

Replace it with:
```ts
export type AdminView = 'overview' | 'students' | 'instructors' | 'courses' | 'certificates' | 'payments' | 'payments-setup' | 'financial-aid' | 'salaries' | 'cms' | 'blog' | 'settings' | 'support' | 'notifications' | 'messages' | 'seo' | 'reviews' | 'geo-access'
```

- [ ] **Step 3: Add nav item to NAV_FINANCE**

Find the `NAV_FINANCE` array. The import at the top of the file uses `Money` from `@phosphor-icons/react`. First add `Money` to the existing import:

Find this import line:
```ts
import {
  ChartBar, Users, Chalkboard, BookOpen, CreditCard, PencilSimple,
  List, X, SignOut, Bell, MagnifyingGlass, Sun, Moon, GearSix,
  Lock, Eye, EyeSlash, Handshake, Certificate, ChatCircleDots, CheckCircle, Chats, Globe, Star, Sparkle
} from '@phosphor-icons/react'
```

Replace with (adds `Money`):
```ts
import {
  ChartBar, Users, Chalkboard, BookOpen, CreditCard, PencilSimple,
  List, X, SignOut, Bell, MagnifyingGlass, Sun, Moon, GearSix,
  Lock, Eye, EyeSlash, Handshake, Certificate, ChatCircleDots, CheckCircle, Chats, Globe, Star, Sparkle, Money
} from '@phosphor-icons/react'
```

Then find the `NAV_FINANCE` array:
```ts
const NAV_FINANCE: NavItem[] = [
  { view: 'payments',      label: 'Payments',      path: 'payments',      Icon: CreditCard as NavItem['Icon'] },
  { view: 'financial-aid', label: 'Financial Aid', path: 'financial-aid', Icon: Handshake as NavItem['Icon'] },
  { view: 'certificates',  label: 'Certificates',  path: 'certificates',  Icon: Certificate as NavItem['Icon'] },
]
```

Replace with:
```ts
const NAV_FINANCE: NavItem[] = [
  { view: 'payments',      label: 'Payments',      path: 'payments',      Icon: CreditCard as NavItem['Icon'] },
  { view: 'financial-aid', label: 'Financial Aid', path: 'financial-aid', Icon: Handshake as NavItem['Icon'] },
  { view: 'salaries',      label: 'Salaries',      path: 'salaries',      Icon: Money as NavItem['Icon'] },
  { view: 'certificates',  label: 'Certificates',  path: 'certificates',  Icon: Certificate as NavItem['Icon'] },
]
```

- [ ] **Step 4: Add Route**

Find the `<Routes>` block in AdminPage (around line ~674). After the `geo-access` route, add:

```tsx
<Route path="/salaries" element={<AdminSalaries />} />
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/AdminPage.tsx
git commit -m "feat: wire AdminSalaries page into admin dashboard"
```

---

## Task 10: Wire InstructorDashboardPage.tsx

**Files:**
- Modify: `client/src/pages/InstructorDashboardPage.tsx`

- [ ] **Step 1: Add lazy import**

After the `InstructorAssignments` lazy import line, add:

```ts
const InstructorSalary = lazy(() => import('./instructor/InstructorSalary'))
```

- [ ] **Step 2: Add 'salary' to InstructorView type**

Find this line (line ~28):
```ts
export type InstructorView = 'overview' | 'courses' | 'live' | 'students' | 'messages' | 'assignments' | 'settings' | 'support' | 'notifications'
```

Replace with:
```ts
export type InstructorView = 'overview' | 'courses' | 'live' | 'students' | 'messages' | 'assignments' | 'salary' | 'settings' | 'support' | 'notifications'
```

- [ ] **Step 3: Add Money import to phosphor-icons import**

Find the existing phosphor import in InstructorDashboardPage.tsx:
```ts
import {
  House, BookOpen, Users, GearSix, VideoCamera,
  List, X, SignOut, Bell, Sun, Moon, Headset, Chats, CheckCircle, Sparkle
} from '@phosphor-icons/react'
```

Replace with:
```ts
import {
  House, BookOpen, Users, GearSix, VideoCamera,
  List, X, SignOut, Bell, Sun, Moon, Headset, Chats, CheckCircle, Sparkle, Money
} from '@phosphor-icons/react'
```

- [ ] **Step 4: Add nav item to NAV_MAIN**

Find the `NAV_MAIN` array:
```ts
const NAV_MAIN: NavItem[] = [
  { view: 'overview', label: 'Dashboard', path: '', Icon: House as NavItem['Icon'] },
  { view: 'courses', label: 'My Courses', path: 'courses', Icon: BookOpen as NavItem['Icon'] },
  { view: 'live', label: 'Live Classes', path: 'live', Icon: VideoCamera as NavItem['Icon'] },
  { view: 'students', label: 'My Students', path: 'students', Icon: Users as NavItem['Icon'] },
  { view: 'assignments', label: 'Assignments', path: 'assignments', Icon: CheckCircle as NavItem['Icon'] },
  { view: 'messages', label: 'Messages', path: 'messages', Icon: Chats as NavItem['Icon'] },
]
```

Replace with:
```ts
const NAV_MAIN: NavItem[] = [
  { view: 'overview', label: 'Dashboard', path: '', Icon: House as NavItem['Icon'] },
  { view: 'courses', label: 'My Courses', path: 'courses', Icon: BookOpen as NavItem['Icon'] },
  { view: 'live', label: 'Live Classes', path: 'live', Icon: VideoCamera as NavItem['Icon'] },
  { view: 'students', label: 'My Students', path: 'students', Icon: Users as NavItem['Icon'] },
  { view: 'assignments', label: 'Assignments', path: 'assignments', Icon: CheckCircle as NavItem['Icon'] },
  { view: 'salary', label: 'My Salary', path: 'salary', Icon: Money as NavItem['Icon'] },
  { view: 'messages', label: 'Messages', path: 'messages', Icon: Chats as NavItem['Icon'] },
]
```

- [ ] **Step 5: Add Route**

Find the `<Routes>` block in InstructorDashboardPage. After the `assignments` route, add:

```tsx
<Route path="/salary" element={<InstructorSalary />} />
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/InstructorDashboardPage.tsx
git commit -m "feat: wire InstructorSalary page into instructor dashboard"
```

---

## Self-Review

### Spec Coverage

| Spec requirement | Task |
|-----------------|------|
| SalaryPackage model (all fields) | Task 1 |
| SalaryPayment model (all fields) | Task 2 |
| GET /api/v1/salaries (list all) | Task 3 |
| POST /api/v1/salaries (create) | Task 3 |
| PATCH /api/v1/salaries/:id (update) | Task 3 |
| DELETE /api/v1/salaries/:id + cascade payments | Task 3 |
| GET /api/v1/salaries/:id/payments | Task 3 |
| POST /api/v1/salaries/:id/payments | Task 3 |
| PATCH /api/v1/salaries/:id/payments/:paymentId | Task 3 |
| DELETE /api/v1/salaries/:id/payments/:paymentId | Task 3 |
| GET /api/v1/salaries/my (teacher) | Task 3 |
| Route registration | Task 4 |
| TypeScript types | Task 5 |
| Salary service | Task 6 |
| AdminSalaries page (list + package form + payments) | Task 7 |
| InstructorSalary page (package card + payment table) | Task 8 |
| AdminPage wiring (nav + route) | Task 9 |
| InstructorDashboardPage wiring (nav + route) | Task 10 |
| 409 conflict when package already exists | Task 3 (createPackage) |
| 404 for non-existent teacher/package | Task 3 (all handlers) |
| Teacher `/my` returns 200 with null package | Task 3 (getMyPackage) |

All spec requirements are covered. No gaps found.

### Placeholder Scan

No "TBD", "TODO", or incomplete steps found. All code blocks are complete.

### Type Consistency

- `SalaryType`, `SalaryPackageStatus`, `SalaryPaymentStatus` defined in Task 5, used correctly in Tasks 6, 7, 8.
- `SalaryPackage` and `SalaryPayment` interfaces defined in Task 5, used in Tasks 6, 7, 8.
- Service method signatures in Task 6 match usage in Tasks 7 and 8.
- Controller exports in Task 3 match imports in Task 4 route file exactly.
