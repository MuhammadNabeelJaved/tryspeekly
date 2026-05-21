# Salary Payment Method & Notification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Pakistani bank/fintech payment method selector (with logos) to salary payments and fire a real-time Socket.io notification to teachers when their salary is marked paid.

**Architecture:** Payment method stored as a plain string id in MongoDB (no enum). A static TypeScript file holds 29 bank/fintech entries with Google Favicon CDN URLs for logos. Notifications use the existing `createAndEmitNotification(recipientId, ...)` utility — no new infrastructure.

**Tech Stack:** Mongoose, Express, Socket.io + `server/src/utils/notify.js`, React + react-hook-form + Tailwind, PhosphorIcons, Google Favicon CDN (`https://www.google.com/s2/favicons?domain={domain}&sz=64`)

---

## File Map

| File | Action |
|------|--------|
| `client/src/data/pakistanPaymentMethods.ts` | Create — 29-entry static list with helpers |
| `client/src/types/api.ts` | Modify — `paymentMethod?: string` to 3 interfaces |
| `server/src/models/salary-payment.model.js` | Modify — add `paymentMethod` field |
| `server/src/controllers/salary.controller.js` | Modify — accept paymentMethod + fire notifications |
| `client/src/pages/admin/AdminSalaries.tsx` | Modify — searchable payment method combobox |
| `client/src/pages/instructor/InstructorSalary.tsx` | Modify — Payment Method column in table |

---

### Task 1: Static payment methods data file

**Files:**
- Create: `client/src/data/pakistanPaymentMethods.ts`

- [ ] **Step 1: Create the file**

Create `client/src/data/pakistanPaymentMethods.ts` with this exact content:

```ts
export interface PaymentMethodOption {
  id: string
  name: string
  category: 'fintech' | 'bank'
  domain: string
  color: string
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'jazzcash',   name: 'JazzCash',                 category: 'fintech', domain: 'jazzcash.com.pk',   color: '#CC0000' },
  { id: 'easypaisa',  name: 'Easypaisa',                 category: 'fintech', domain: 'easypaisa.com.pk',  color: '#00A651' },
  { id: 'nayapay',    name: 'NayaPay',                   category: 'fintech', domain: 'nayapay.com',       color: '#6C3CE1' },
  { id: 'sadapay',    name: 'SadaPay',                   category: 'fintech', domain: 'sadapay.com',       color: '#000000' },
  { id: 'zindigi',    name: 'Zindigi',                   category: 'fintech', domain: 'zindigi.com',       color: '#7B2D8B' },
  { id: 'upaisa',     name: 'UPaisa',                    category: 'fintech', domain: 'upaisa.com',        color: '#F7941D' },
  { id: 'timepey',    name: 'TimePey',                   category: 'fintech', domain: 'timepey.com',       color: '#00AEEF' },
  { id: 'raast',      name: 'Raast (SBP)',               category: 'fintech', domain: 'raast.com.pk',      color: '#009B77' },
  { id: 'cash',       name: 'Cash',                      category: 'fintech', domain: '',                  color: '#4CAF50' },
  { id: 'hbl',        name: 'HBL',                       category: 'bank',    domain: 'hbl.com',           color: '#00874E' },
  { id: 'ubl',        name: 'UBL',                       category: 'bank',    domain: 'ubl.com',           color: '#C8202E' },
  { id: 'mcb',        name: 'MCB Bank',                  category: 'bank',    domain: 'mcb.com.pk',        color: '#E31E24' },
  { id: 'allied',     name: 'Allied Bank',               category: 'bank',    domain: 'abl.com',           color: '#003087' },
  { id: 'alfalah',    name: 'Bank Alfalah',              category: 'bank',    domain: 'bankalfalah.com',   color: '#00539B' },
  { id: 'meezan',     name: 'Meezan Bank',               category: 'bank',    domain: 'meezanbank.com',    color: '#007749' },
  { id: 'askari',     name: 'Askari Bank',               category: 'bank',    domain: 'askaribank.com',    color: '#006341' },
  { id: 'alhabib',    name: 'Bank Al-Habib',             category: 'bank',    domain: 'bankalhabib.com',   color: '#C8202E' },
  { id: 'faysal',     name: 'Faysal Bank',               category: 'bank',    domain: 'faysalbank.com',    color: '#009A44' },
  { id: 'soneri',     name: 'Soneri Bank',               category: 'bank',    domain: 'soneribank.com',    color: '#D4A017' },
  { id: 'sc',         name: 'Standard Chartered',        category: 'bank',    domain: 'sc.com',            color: '#0072AA' },
  { id: 'habibmetro', name: 'Habib Metro',               category: 'bank',    domain: 'habibmetro.com',    color: '#C8202E' },
  { id: 'silkbank',   name: 'Silk Bank',                 category: 'bank',    domain: 'silkbank.com.pk',   color: '#9B1B30' },
  { id: 'nbp',        name: 'National Bank of Pakistan', category: 'bank',    domain: 'nbp.com.pk',        color: '#005B9F' },
  { id: 'bop',        name: 'Bank of Punjab',            category: 'bank',    domain: 'bop.com.pk',        color: '#004C97' },
  { id: 'bok',        name: 'Bank of Khyber',            category: 'bank',    domain: 'bok.com.pk',        color: '#005A9C' },
  { id: 'sindhbank',  name: 'Sindh Bank',                category: 'bank',    domain: 'sindhbank.com.pk',  color: '#00843D' },
  { id: 'fwb',        name: 'First Women Bank',          category: 'bank',    domain: 'fwbl.com.pk',       color: '#9B1B30' },
  { id: 'summit',     name: 'Summit Bank',               category: 'bank',    domain: 'summitbank.com.pk', color: '#005BAA' },
  { id: 'ztbl',       name: 'Zarai Taraqiati Bank',      category: 'bank',    domain: 'ztbl.gov.pk',       color: '#4CAF50' },
]

export function getMethodById(id: string): PaymentMethodOption | undefined {
  return PAYMENT_METHODS.find(m => m.id === id)
}

export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from the project root:
```
cd client && npx tsc --noEmit
```
Expected: no output (zero errors)

- [ ] **Step 3: Commit**

```bash
git add client/src/data/pakistanPaymentMethods.ts
git commit -m "feat: add Pakistani payment methods static data"
```

---

### Task 2: TypeScript types + Mongoose model field

**Files:**
- Modify: `client/src/types/api.ts`
- Modify: `server/src/models/salary-payment.model.js`

**Context:** `SalaryPayment` is around line 608, `CreateSalaryPaymentDto` around line 644, `UpdateSalaryPaymentDto` around line 654 in `api.ts`. The Mongoose model's `notes` field ends around line 43 in `salary-payment.model.js`.

- [ ] **Step 1: Add `paymentMethod?: string` to `SalaryPayment` in `client/src/types/api.ts`**

```ts
// BEFORE:
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// AFTER (in the SalaryPayment interface):
  notes?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Add `paymentMethod?: string` to `CreateSalaryPaymentDto`**

```ts
// BEFORE:
  paidDate?: string;
  notes?: string;
}

// AFTER (in CreateSalaryPaymentDto):
  paidDate?: string;
  notes?: string;
  paymentMethod?: string;
}
```

- [ ] **Step 3: Add `paymentMethod?: string` to `UpdateSalaryPaymentDto`**

```ts
// BEFORE:
  paidDate?: string;
  notes?: string;
}

// AFTER (in UpdateSalaryPaymentDto):
  paidDate?: string;
  notes?: string;
  paymentMethod?: string;
}
```

- [ ] **Step 4: Add `paymentMethod` field to `server/src/models/salary-payment.model.js`**

After the `notes` field definition and before the closing `}` of the schema fields object:

```js
// BEFORE:
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true, versionKey: false }

// AFTER:
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    paymentMethod: {
      type: String,
      trim: true,
      maxlength: [100, 'Payment method cannot exceed 100 characters'],
    },
  },
  { timestamps: true, versionKey: false }
```

- [ ] **Step 5: Verify TypeScript compiles**

```
cd client && npx tsc --noEmit
```
Expected: no output (zero errors)

- [ ] **Step 6: Commit**

```bash
git add client/src/types/api.ts server/src/models/salary-payment.model.js
git commit -m "feat: add paymentMethod field to SalaryPayment model and TS types"
```

---

### Task 3: Server controller — accept paymentMethod and fire notifications

**Files:**
- Modify: `server/src/controllers/salary.controller.js`

**Context:**
- Import block ends around line 5. `notify.js` exports `createAndEmitNotification({ recipientId, title, message, type, severity, relatedId, relatedType })` — the key is `recipientId`, NOT `recipient`.
- `addPayment` handler: line 108. Destructures body at line 112. Creates payment at line 134.
- `updatePayment` handler: line 140. Destructures body at line 147. Calls `payment.save()` at line 164.
- The `status` field variable in `updatePayment` is the incoming request body value (may be `undefined` if not sent).

- [ ] **Step 1: Add import for `createAndEmitNotification`**

After the last existing import (line 5):

```js
// BEFORE:
import User from '../models/user.model.js'

// AFTER:
import User from '../models/user.model.js'
import { createAndEmitNotification } from '../utils/notify.js'
```

- [ ] **Step 2: Add the `formatPeriod` helper after the import block, before the first handler**

```js
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
```

- [ ] **Step 3: Update `addPayment` — destructure `paymentMethod` and store it**

Change the destructuring line in `addPayment` (line 112):

```js
// BEFORE:
  const { amount, periodLabel, periodStart, periodEnd, status, paidDate, notes } = req.body

// AFTER:
  const { amount, periodLabel, periodStart, periodEnd, status, paidDate, notes, paymentMethod } = req.body
```

After `if (notes !== undefined) paymentData.notes = notes`, add:

```js
  if (paymentMethod !== undefined) paymentData.paymentMethod = paymentMethod
```

- [ ] **Step 4: Fire notification in `addPayment` when status is `paid`**

After `const payment = await SalaryPayment.create(paymentData)`, add:

```js
  if (status === 'paid') {
    await createAndEmitNotification({
      recipientId: pkg.teacher,
      title: 'Salary Payment Received',
      message: `Your salary of ₨${amount} for ${periodLabel || formatPeriod(periodStart, periodEnd)} has been paid via ${paymentMethod || 'bank transfer'}.`,
      type: 'salary_payment',
      severity: 'low',
      relatedId: payment._id,
      relatedType: 'SalaryPayment',
    })
  }
```

- [ ] **Step 5: Update `updatePayment` — capture old status, destructure `paymentMethod`, store it**

Change the destructuring in `updatePayment` (line 147):

```js
// BEFORE:
  const { amount, periodLabel, periodStart, periodEnd, status, paidDate, notes } = req.body

// AFTER:
  const { amount, periodLabel, periodStart, periodEnd, status, paidDate, notes, paymentMethod } = req.body
  const wasNotPaid = payment.status !== 'paid'
```

After `if (notes !== undefined) payment.notes = notes`, add:

```js
  if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod
```

- [ ] **Step 6: Fire notification in `updatePayment` on paid transition**

After `await payment.save()`, add:

```js
  if (status === 'paid' && wasNotPaid) {
    const pkg = await SalaryPackage.findById(payment.package)
    if (pkg) {
      await createAndEmitNotification({
        recipientId: pkg.teacher,
        title: 'Salary Payment Received',
        message: `Your salary of ₨${payment.amount} for ${payment.periodLabel || formatPeriod(payment.periodStart, payment.periodEnd)} has been paid via ${payment.paymentMethod || 'bank transfer'}.`,
        type: 'salary_payment',
        severity: 'low',
        relatedId: payment._id,
        relatedType: 'SalaryPayment',
      })
    }
  }
```

- [ ] **Step 7: Start the server and manually verify the notification fires**

```
cd server && npm run dev
```

Test `addPayment` with `status: 'paid'` — open teacher's account in browser first so the Socket.io connection is live, then POST:
```
POST /api/v1/salaries/{pkgId}/payments
Authorization: Bearer {adminToken}
{ "amount": 75000, "periodStart": "2026-05-01", "status": "paid", "paymentMethod": "jazzcash" }
```
Expected: 201 response. Teacher's bell icon shows "Salary Payment Received" notification.

Test updating a `pending` payment to `paid`:
```
PATCH /api/v1/salaries/{pkgId}/payments/{paymentId}
{ "status": "paid", "paymentMethod": "hbl" }
```
Expected: 200 response. Teacher receives notification. Updating an already-`paid` payment does NOT fire a second notification.

- [ ] **Step 8: Commit**

```bash
git add server/src/controllers/salary.controller.js
git commit -m "feat: notify teacher on salary paid, accept paymentMethod in payment routes"
```

---

### Task 4: Admin UI — searchable payment method combobox

**Files:**
- Modify: `client/src/pages/admin/AdminSalaries.tsx`
- Test: `client/src/pages/__tests__/AdminSalaries.test.tsx`

**Context:**
- Imports are at lines 1–18. React hook imports at line 1. Type imports at line 12.
- `watchPayStatus` is defined at line 111 — add new state directly after it.
- `openEditPayment` is at line 293 — pre-populate `pmValue` here.
- `onSavePayment` payload is at lines 245–253 — add `paymentMethod` to payload, reset after save.
- Payment form renders at lines 519–582. Add the combobox between the paidDate field and the Notes field.
- Payment list rows render at lines 594–630 — add payment method indicator after the status/date row.
- The payment method value is managed via `useState` (NOT react-hook-form) because it's a custom combobox.

- [ ] **Step 1: Write the failing test**

Create `client/src/pages/__tests__/AdminSalaries.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminSalaries from '../admin/AdminSalaries'

vi.mock('@/services/salary.service', () => ({
  salaryService: {
    getAllPackages: vi.fn().mockResolvedValue({ data: [] }),
    getPackagePayments: vi.fn().mockResolvedValue({ data: [] }),
    addPayment: vi.fn().mockResolvedValue({ data: { _id: 'p1', amount: 75000, periodStart: '2026-05-01', status: 'paid', paymentMethod: 'jazzcash' } }),
    updatePayment: vi.fn().mockResolvedValue({ data: {} }),
    deletePayment: vi.fn().mockResolvedValue({}),
    createPackage: vi.fn().mockResolvedValue({ data: { _id: 'pkg1', teacher: { _id: 't1', name: 'Ali Khan', email: 'ali@test.com' }, amount: 50000, type: 'monthly', startDate: '2026-01-01', status: 'active' } }),
    updatePackage: vi.fn().mockResolvedValue({ data: {} }),
    deletePackage: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/lib/axiosClient', () => ({
  axiosClient: {
    get: vi.fn().mockResolvedValue({
      data: {
        data: [{ _id: 'teacher1', name: 'Ali Khan', email: 'ali@test.com', role: 'teacher' }],
      },
    }),
  },
}))

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe('AdminSalaries — payment method selector', () => {
  it('renders the component without crashing', async () => {
    renderWithRouter(<AdminSalaries />)
    expect(await screen.findByText('Salary Management')).toBeInTheDocument()
  })

  it('shows "Search payment method" placeholder when payment form is open', async () => {
    renderWithRouter(<AdminSalaries />)
    const teacherBtn = await screen.findByText('Ali Khan')
    fireEvent.click(teacherBtn)

    // Create a package first so the payment form can appear
    const createBtn = screen.getByRole('button', { name: /create package/i })
    fireEvent.submit(createBtn.closest('form')!)

    await waitFor(() => {
      const addPaymentBtn = screen.queryByRole('button', { name: /add payment/i })
      if (addPaymentBtn) fireEvent.click(addPaymentBtn)
    })

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search payment method/i)).not.toBeNull()
    })
  })
})
```

- [ ] **Step 2: Run the test to confirm it runs (may fail on the second test — that's OK)**

```
cd client && npx vitest run src/pages/__tests__/AdminSalaries.test.tsx
```
Expected: first test PASS. Second test may fail because the payment form requires a package — that's fine, the implementation will make it pass.

- [ ] **Step 3: Add `useRef` to the React import and add the data import**

Change line 1:
```tsx
// BEFORE:
import { useState, useEffect, useCallback } from 'react'

// AFTER:
import { useState, useEffect, useCallback, useRef } from 'react'
```

After the type imports block (after line 18), add:
```tsx
import { PAYMENT_METHODS, getMethodById, getFaviconUrl } from '@/data/pakistanPaymentMethods'
```

- [ ] **Step 4: Add payment method state and outside-click effect**

After `const watchPayStatus = payForm.watch('status')` (line 111), add:

```tsx
const [pmValue, setPmValue] = useState('')
const [pmSearch, setPmSearch] = useState('')
const [pmOpen, setPmOpen] = useState(false)
const pmRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  function handleOutsideClick(e: MouseEvent) {
    if (pmRef.current && !pmRef.current.contains(e.target as Node)) {
      setPmOpen(false)
    }
  }
  if (pmOpen) document.addEventListener('mousedown', handleOutsideClick)
  return () => document.removeEventListener('mousedown', handleOutsideClick)
}, [pmOpen])
```

- [ ] **Step 5: Update `openEditPayment` to pre-populate `pmValue`**

```tsx
// BEFORE:
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

// AFTER:
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
    setPmValue(p.paymentMethod ?? '')
    setPmSearch('')
    setShowPaymentForm(true)
  }
```

- [ ] **Step 6: Add `paymentMethod` to the `onSavePayment` payload and reset combobox after save**

In `onSavePayment`, update the payload object:
```tsx
// BEFORE:
      const payload = {
        amount: Number(values.amount),
        periodLabel: values.periodLabel || undefined,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd || undefined,
        status: values.status,
        paidDate: values.status === 'paid' ? (values.paidDate || undefined) : undefined,
        notes: values.notes || undefined,
      }

// AFTER:
      const payload = {
        amount: Number(values.amount),
        periodLabel: values.periodLabel || undefined,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd || undefined,
        status: values.status,
        paidDate: values.status === 'paid' ? (values.paidDate || undefined) : undefined,
        notes: values.notes || undefined,
        paymentMethod: pmValue || undefined,
      }
```

After `payForm.reset()` (in the success block), also reset the combobox:
```tsx
// BEFORE:
      setShowPaymentForm(false)
      setEditingPayment(null)
      payForm.reset()

// AFTER:
      setShowPaymentForm(false)
      setEditingPayment(null)
      payForm.reset()
      setPmValue('')
      setPmSearch('')
```

- [ ] **Step 7: Update the "Add Payment" button and Cancel button to reset combobox state**

"Add Payment" button `onClick`:
```tsx
// BEFORE:
                        onClick={() => { setShowPaymentForm(true); setEditingPayment(null); payForm.reset() }}

// AFTER:
                        onClick={() => { setShowPaymentForm(true); setEditingPayment(null); payForm.reset(); setPmValue(''); setPmSearch('') }}
```

Cancel button `onClick`:
```tsx
// BEFORE:
                              onClick={() => { setShowPaymentForm(false); setEditingPayment(null) }}

// AFTER:
                              onClick={() => { setShowPaymentForm(false); setEditingPayment(null); setPmValue(''); setPmSearch('') }}
```

- [ ] **Step 8: Add the payment method combobox to the payment form**

Insert this block after the `{watchPayStatus === 'paid' && <Field label="Paid Date">...</Field>}` conditional and before the Notes `col-span-2` div:

```tsx
                          <div className="col-span-2">
                            <Field label="Payment Method (optional)">
                              <div ref={pmRef} className="relative">
                                {pmValue ? (
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800">
                                    {pmValue === 'cash' ? (
                                      <Money size={20} className="text-emerald-500 flex-shrink-0" />
                                    ) : (
                                      <img
                                        src={getFaviconUrl(getMethodById(pmValue)?.domain ?? '')}
                                        alt=""
                                        className="w-5 h-5 rounded object-cover flex-shrink-0"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                      />
                                    )}
                                    <span className="flex-1 text-sm text-slate-900 dark:text-white">
                                      {getMethodById(pmValue)?.name ?? pmValue}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => { setPmValue(''); setPmSearch('') }}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <input
                                    value={pmSearch}
                                    onChange={e => { setPmSearch(e.target.value); setPmOpen(true) }}
                                    onFocus={() => setPmOpen(true)}
                                    placeholder="Search payment method…"
                                    className={inputCls}
                                  />
                                )}
                                {pmOpen && !pmValue && (
                                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-lg max-h-56 overflow-y-auto">
                                    {(() => {
                                      const q = pmSearch.toLowerCase()
                                      const fintech = PAYMENT_METHODS.filter(m => m.category === 'fintech' && (!q || m.name.toLowerCase().includes(q)))
                                      const banks = PAYMENT_METHODS.filter(m => m.category === 'bank' && (!q || m.name.toLowerCase().includes(q)))
                                      if (fintech.length === 0 && banks.length === 0) {
                                        return <div className="px-3 py-4 text-sm text-slate-400 dark:text-neutral-500 text-center">No results</div>
                                      }
                                      return (
                                        <>
                                          {fintech.length > 0 && (
                                            <>
                                              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Fintech</div>
                                              {fintech.map(m => (
                                                <button
                                                  key={m.id}
                                                  type="button"
                                                  onMouseDown={() => { setPmValue(m.id); setPmSearch(''); setPmOpen(false) }}
                                                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-left"
                                                >
                                                  {m.id === 'cash' ? (
                                                    <Money size={20} className="text-emerald-500 flex-shrink-0" />
                                                  ) : (
                                                    <img
                                                      src={getFaviconUrl(m.domain)}
                                                      alt=""
                                                      className="w-5 h-5 rounded object-cover flex-shrink-0"
                                                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                    />
                                                  )}
                                                  <span className="flex-1 text-sm text-slate-800 dark:text-neutral-200">{m.name}</span>
                                                  <span className="text-[10px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-950/30 px-1.5 py-0.5 rounded-full">Fintech</span>
                                                </button>
                                              ))}
                                            </>
                                          )}
                                          {banks.length > 0 && (
                                            <>
                                              <div className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500 ${fintech.length > 0 ? 'border-t border-slate-100 dark:border-neutral-700 mt-1' : ''}`}>Banks</div>
                                              {banks.map(m => (
                                                <button
                                                  key={m.id}
                                                  type="button"
                                                  onMouseDown={() => { setPmValue(m.id); setPmSearch(''); setPmOpen(false) }}
                                                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-left"
                                                >
                                                  <img
                                                    src={getFaviconUrl(m.domain)}
                                                    alt=""
                                                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                  />
                                                  <span className="flex-1 text-sm text-slate-800 dark:text-neutral-200">{m.name}</span>
                                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full">Bank</span>
                                                </button>
                                              ))}
                                            </>
                                          )}
                                        </>
                                      )
                                    })()}
                                  </div>
                                )}
                              </div>
                            </Field>
                          </div>
```

- [ ] **Step 9: Show payment method in admin payment list rows**

In each payment row (the `<div key={p._id} className="flex items-center gap-3 px-5 py-3.5">` block), after the `<div className="flex items-center gap-2 mt-0.5">` closing `</div>`, add:

```tsx
                            {p.paymentMethod && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {p.paymentMethod === 'cash' ? (
                                  <Money size={11} className="text-emerald-500" />
                                ) : (
                                  <img
                                    src={getFaviconUrl(getMethodById(p.paymentMethod)?.domain ?? '')}
                                    alt=""
                                    className="w-3 h-3 rounded object-cover"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                )}
                                <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                                  {getMethodById(p.paymentMethod)?.name ?? p.paymentMethod}
                                </span>
                              </div>
                            )}
```

- [ ] **Step 10: Verify TypeScript compiles**

```
cd client && npx tsc --noEmit
```
Expected: no output (zero errors)

- [ ] **Step 11: Run the tests**

```
cd client && npx vitest run src/pages/__tests__/AdminSalaries.test.tsx
```
Expected: both tests PASS

- [ ] **Step 12: Commit**

```bash
git add client/src/pages/admin/AdminSalaries.tsx client/src/pages/__tests__/AdminSalaries.test.tsx
git commit -m "feat: add payment method combobox to admin salary payment form"
```

---

### Task 5: Teacher UI — payment method column

**Files:**
- Modify: `client/src/pages/instructor/InstructorSalary.tsx`
- Test: `client/src/pages/__tests__/InstructorSalary.test.tsx`

**Context:**
- Imports are at lines 1–5. Add the data import after line 5.
- Table header `<tr>` is at lines 129–134. Currently: Period, Amount, Status, Paid Date.
- Table body rows at lines 138–160. The Amount `<td>` starts at line 149.
- Add the "Payment Method" `<th>` between Period and Amount, and the method `<td>` before the Amount `<td>`.

- [ ] **Step 1: Write the failing test**

Create `client/src/pages/__tests__/InstructorSalary.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import InstructorSalary from '../instructor/InstructorSalary'

vi.mock('@/services/salary.service', () => ({
  salaryService: {
    getMyPackage: vi.fn().mockResolvedValue({
      data: {
        package: {
          _id: 'pkg1',
          teacher: { _id: 'teacher1', name: 'Ali Khan', email: 'ali@example.com' },
          amount: 75000,
          type: 'monthly',
          startDate: '2026-01-01T00:00:00.000Z',
          status: 'active',
        },
        payments: [
          {
            _id: 'pay1',
            package: 'pkg1',
            teacher: 'teacher1',
            amount: 75000,
            periodStart: '2026-05-01T00:00:00.000Z',
            periodLabel: 'May 2026',
            status: 'paid',
            paidDate: '2026-05-05T00:00:00.000Z',
            paymentMethod: 'jazzcash',
          },
          {
            _id: 'pay2',
            package: 'pkg1',
            teacher: 'teacher1',
            amount: 75000,
            periodStart: '2026-04-01T00:00:00.000Z',
            periodLabel: 'April 2026',
            status: 'pending',
          },
        ],
      },
    }),
  },
}))

describe('InstructorSalary — payment method column', () => {
  it('renders "Payment Method" column header in the payments table', async () => {
    render(<InstructorSalary />)
    expect(await screen.findByText(/payment method/i)).toBeInTheDocument()
  })

  it('shows the method name for a payment with a known paymentMethod id', async () => {
    render(<InstructorSalary />)
    expect(await screen.findByText('JazzCash')).toBeInTheDocument()
  })

  it('shows a dash for a payment with no paymentMethod', async () => {
    render(<InstructorSalary />)
    // The dash renders as text content in the cell
    const cells = await screen.findAllByText('—')
    expect(cells.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```
cd client && npx vitest run src/pages/__tests__/InstructorSalary.test.tsx
```
Expected: FAIL — "Payment Method" column header not found, "JazzCash" not found

- [ ] **Step 3: Add the data import to `InstructorSalary.tsx`**

After line 5 (`import type { SalaryPackage, SalaryPayment, SalaryType } from '@/types/api'`):

```tsx
// BEFORE:
import type { SalaryPackage, SalaryPayment, SalaryType } from '@/types/api'

// AFTER:
import type { SalaryPackage, SalaryPayment, SalaryType } from '@/types/api'
import { getMethodById, getFaviconUrl } from '@/data/pakistanPaymentMethods'
```

- [ ] **Step 4: Add "Payment Method" column header to the table**

```tsx
// BEFORE:
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Period</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Amount</th>

// AFTER:
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Period</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Payment Method</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Amount</th>
```

- [ ] **Step 5: Add the payment method cell before the Amount cell in each row**

```tsx
// BEFORE — the Amount <td>:
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">₨{p.amount.toLocaleString()}</p>
                      </td>

// AFTER — insert the Payment Method cell, then keep the Amount cell:
                      <td className="px-5 py-3.5">
                        {p.paymentMethod ? (
                          <div className="flex items-center gap-1.5">
                            {p.paymentMethod === 'cash' ? (
                              <Money size={16} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                              <img
                                src={getFaviconUrl(getMethodById(p.paymentMethod)?.domain ?? '')}
                                alt=""
                                className="w-4 h-4 rounded object-cover flex-shrink-0"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            )}
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
```

- [ ] **Step 6: Verify TypeScript compiles**

```
cd client && npx tsc --noEmit
```
Expected: no output (zero errors)

- [ ] **Step 7: Run the tests**

```
cd client && npx vitest run src/pages/__tests__/InstructorSalary.test.tsx
```
Expected: all 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/instructor/InstructorSalary.tsx client/src/pages/__tests__/InstructorSalary.test.tsx
git commit -m "feat: add payment method column to teacher salary view"
```
