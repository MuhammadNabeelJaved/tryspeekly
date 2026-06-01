# Delete Users & Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add single and bulk delete to AdminUsers (soft-delete) and AdminPaymentsView (hard-delete with optional enrollment deactivation).

**Architecture:** Four server endpoints added (bulk-delete users, single/bulk delete payments), two client service methods extended, two admin page components updated with checkbox selection state, bulk toolbars, and confirmation modals.

**Tech Stack:** Node.js/Express ES Modules (server), React + TypeScript + Tailwind + Framer Motion + Phosphor Icons (client), MongoDB/Mongoose, Cloudinary cleanup on delete.

---

## File Map

| File | Change |
|---|---|
| `server/src/controllers/user.controller.js` | Add `bulkDeleteUsers` export |
| `server/src/routes/user.route.js` | Add `DELETE /bulk` before `/:id` |
| `server/src/controllers/payment.controller.js` | Add `deletePayment`, `bulkDeletePayments` exports |
| `server/src/routes/payment.route.js` | Add `DELETE /bulk` and `DELETE /:id` |
| `client/src/services/users.service.ts` | Add `bulkDelete` method |
| `client/src/services/payments.service.ts` | Add `deletePayment`, `bulkDeletePayments` methods |
| `client/src/pages/admin/AdminUsers.tsx` | Checkboxes, bulk toolbar, `BulkDeleteConfirmModal` |
| `client/src/pages/admin/AdminPaymentsView.tsx` | Single trash icon, checkboxes, bulk toolbar, `PaymentDeleteModal` |

---

## Task 1: Server — bulkDeleteUsers

**Files:**
- Modify: `server/src/controllers/user.controller.js`
- Modify: `server/src/routes/user.route.js`

- [ ] **Step 1: Add `bulkDeleteUsers` to user controller**

Append at the end of `server/src/controllers/user.controller.js`:

```js
// DELETE /api/v1/users/bulk — admin: soft-delete multiple users
export const bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: { message: 'ids must be a non-empty array' } })
  }
  if (ids.length > 100) {
    return res.status(400).json({ success: false, error: { message: 'Cannot delete more than 100 users at once' } })
  }

  const adminId = req.user._id.toString()
  const filteredIds = ids.filter(id => id !== adminId)
  const skipped = ids.length - filteredIds.length

  const results = await Promise.allSettled(
    filteredIds.map(async (id) => {
      const user = await User.findById(id)
      if (!user || user.isDeleted) return
      if (user.profileImage) {
        const publicId = extractPublicId(user.profileImage)
        if (publicId) await deleteFile(publicId, 'image')
      }
      const userId = user._id
      user.isDeleted = true
      user.profileImage = undefined
      await user.save()
      emitToUser(userId, 'user:deleted', { message: 'Your account has been deleted.' })
    })
  )

  const deleted = results.filter(r => r.status === 'fulfilled').length

  res.json({
    success: true,
    message: `${deleted} user${deleted !== 1 ? 's' : ''} deleted`,
    data: { deleted, skipped },
  })
})
```

- [ ] **Step 2: Register route — add import and route in user.route.js**

Add `bulkDeleteUsers` to the import list at the top of `server/src/routes/user.route.js`:

```js
import {
    createUser,
    verifyEmail,
    resendVerification,
    loginUser,
    logoutUser,
    refreshToken,
    getUserProfile,
    getAllUsers,
    getUserById,
    updateUserProfile,
    updateProfileImage,
    changePassword,
    requestPasswordReset,
    resetPassword,
    deleteUser,
    bulkDeleteUsers,
    markOnboardingDone,
    changeUserRole,
    blockUser,
    getPublicTeachers,
    getHomeInstructors,
    toggleShowOnHome,
} from '../controllers/user.controller.js'
```

Then add the bulk route **before** the `/:id` route (critical — `bulk` must not be treated as an id param):

```js
// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorizeTeamPage('students', 'instructors'), getAllUsers)
router.route('/bulk').delete(authenticate, authorize('admin'), bulkDeleteUsers)   // ← add this line
router.route('/:id/role').patch(authenticate, authorize('admin'), changeUserRole)
router.route('/:id/block').patch(authenticate, authorize('admin'), blockUser)
router.route('/:id/show-on-home').patch(authenticate, authorize('admin'), toggleShowOnHome)
router.route('/:id')
    .get(authenticate, allowTeamMember, getUserById)
    .delete(authenticate, authorize('admin'), deleteUser)
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/user.controller.js server/src/routes/user.route.js
git commit -m "feat(server): add bulk delete users endpoint"
```

---

## Task 2: Server — deletePayment + bulkDeletePayments

**Files:**
- Modify: `server/src/controllers/payment.controller.js`
- Modify: `server/src/routes/payment.route.js`

- [ ] **Step 1: Add `deletePayment` and `bulkDeletePayments` to payment controller**

Append at the end of `server/src/controllers/payment.controller.js`:

```js
// DELETE /api/v1/payments/:id — admin: hard-delete single payment
export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
  if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } })

  if (payment.screenshotUrl) {
    const publicId = extractPublicId(payment.screenshotUrl)
    if (publicId) await deleteFile(publicId, 'image')
  }

  if (req.query.deactivateEnrollment === 'true') {
    await Enrollment.updateMany({ payment: payment._id }, { isActive: false })
  }

  await Payment.deleteOne({ _id: payment._id })

  res.json({ success: true, message: 'Payment deleted' })
})

// DELETE /api/v1/payments/bulk — admin: hard-delete multiple payments
export const bulkDeletePayments = asyncHandler(async (req, res) => {
  const { ids, deactivateEnrollments = false } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: { message: 'ids must be a non-empty array' } })
  }
  if (ids.length > 100) {
    return res.status(400).json({ success: false, error: { message: 'Cannot delete more than 100 payments at once' } })
  }

  const payments = await Payment.find({ _id: { $in: ids } })

  const results = await Promise.allSettled(
    payments.map(async (payment) => {
      if (payment.screenshotUrl) {
        const publicId = extractPublicId(payment.screenshotUrl)
        if (publicId) await deleteFile(publicId, 'image')
      }
      await Payment.deleteOne({ _id: payment._id })
    })
  )

  if (deactivateEnrollments) {
    await Enrollment.updateMany({ payment: { $in: ids } }, { isActive: false })
  }

  const deleted = results.filter(r => r.status === 'fulfilled').length

  res.json({
    success: true,
    message: `${deleted} payment${deleted !== 1 ? 's' : ''} deleted`,
    data: { deleted },
  })
})
```

- [ ] **Step 2: Register routes in payment.route.js**

Add imports and routes. Full updated `server/src/routes/payment.route.js`:

```js
import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { uploadPaymentScreenshot, handleMulterError } from '../middlewares/multer.js'
import {
  createPayment,
  getMyPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
  adminCreatePayment,
  directApprovePayment,
  deletePayment,
  bulkDeletePayments,
} from '../controllers/payment.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), uploadPaymentScreenshot, handleMulterError, createPayment)
router.route('/my').get(authenticate, authorize('student'), getMyPayments)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorizeTeamPage('payments'), getAllPayments)
router.route('/admin').post(authenticate, authorizeTeamPage('payments'), adminCreatePayment)
router.route('/admin/direct-approve').post(authenticate, authorizeTeamPage('payments'), directApprovePayment)
router.route('/bulk').delete(authenticate, authorizeTeamPage('payments'), bulkDeletePayments)
router.route('/:id/approve').patch(authenticate, authorizeTeamPage('payments'), approvePayment)
router.route('/:id/reject').patch(authenticate, authorizeTeamPage('payments'), rejectPayment)
router.route('/:id').delete(authenticate, authorizeTeamPage('payments'), deletePayment)

export default router
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/payment.controller.js server/src/routes/payment.route.js
git commit -m "feat(server): add single and bulk delete payment endpoints"
```

---

## Task 3: Client — Service Methods

**Files:**
- Modify: `client/src/services/users.service.ts`
- Modify: `client/src/services/payments.service.ts`

- [ ] **Step 1: Add `bulkDelete` to usersService**

In `client/src/services/users.service.ts`, add this method inside the `usersService` object (after `deleteUser`):

```ts
  async bulkDelete(ids: string[]): Promise<{ message: string; data: { deleted: number; skipped: number } }> {
    const response = await axiosClient.delete<ApiResponse<{ deleted: number; skipped: number }>>(
      '/users/bulk',
      { data: { ids } }
    );
    return { message: response.data.message || 'Users deleted', data: response.data.data };
  },
```

- [ ] **Step 2: Add `deletePayment` and `bulkDeletePayments` to paymentsService**

In `client/src/services/payments.service.ts`, add these two methods inside `paymentsService` (after `getUnpaidEnrollments`):

```ts
  async deletePayment(id: string, deactivateEnrollment: boolean): Promise<{ message: string }> {
    const response = await axiosClient.delete<ApiResponse<null>>(
      `/payments/${id}`,
      { params: { deactivateEnrollment } }
    );
    return { message: response.data.message || 'Payment deleted' };
  },

  async bulkDeletePayments(
    ids: string[],
    deactivateEnrollments: boolean
  ): Promise<{ message: string; data: { deleted: number } }> {
    const response = await axiosClient.delete<ApiResponse<{ deleted: number }>>(
      '/payments/bulk',
      { data: { ids, deactivateEnrollments } }
    );
    return { message: response.data.message || 'Payments deleted', data: response.data.data };
  },
```

- [ ] **Step 3: Commit**

```bash
git add client/src/services/users.service.ts client/src/services/payments.service.ts
git commit -m "feat(client): add bulkDelete users and delete/bulkDelete payments service methods"
```

---

## Task 4: Client — AdminUsers Bulk Delete

**Files:**
- Modify: `client/src/pages/admin/AdminUsers.tsx`

- [ ] **Step 1: Add `BulkDeleteConfirmModal` component**

Add this component above the `// ─── Main Component ───` section comment (around line 247):

```tsx
// ─── Bulk Delete Confirm Modal ────────────────────────────────────────────────

function BulkDeleteConfirmModal({ count, onClose, onConfirm }: {
  count: number
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try { await onConfirm(); onClose() } finally { setLoading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
            <Trash size={20} weight="fill" className="text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Delete {count} account{count !== 1 ? 's' : ''}?
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
              This will permanently delete {count} user account{count !== 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 flex-shrink-0">
            <X size={12} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <ArrowsClockwise size={13} className="animate-spin" /> : null}
            {loading ? 'Deleting…' : `Delete ${count}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Add state and helpers to `AdminUsers` main component**

Add `useAuth` import at top of file (after existing imports):
```tsx
import { useAuth } from '@/context/AuthContext'
```

Inside `export default function AdminUsers()`, add these new state variables and helpers (after existing state declarations):
```tsx
const { user: currentUser } = useAuth()
const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

const allSelectableIds = users.filter(u => u._id !== currentUser?.id).map(u => u._id)
const allSelected      = allSelectableIds.length > 0 && allSelectableIds.every(id => selectedIds.has(id))

const toggleSelect = (id: string) =>
  setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
```

In the existing `useEffect` that resets the page (line ~288), also clear selection:
```tsx
useEffect(() => { setPage(1); setSelectedIds(new Set()) }, [search, roleFilter])
```

Add `handleBulkDelete` handler (after existing `handleDelete`):
```tsx
const handleBulkDelete = async () => {
  try {
    const ids = Array.from(selectedIds)
    await usersService.bulkDelete(ids)
    setUsers(prev => prev.filter(u => !selectedIds.has(u._id)))
    setSelectedIds(new Set())
    toast.success(`${ids.length} account${ids.length !== 1 ? 's' : ''} deleted.`)
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { error?: { message?: string } } } })
      ?.response?.data?.error?.message ?? 'Bulk delete failed'
    toast.error(msg)
    throw err
  }
}
```

- [ ] **Step 3: Add checkbox column to table header**

Replace the existing `<thead>` block:
```tsx
<thead>
  <tr className="border-b border-slate-100 dark:border-neutral-800">
    <th className="px-4 py-3 w-10">
      <input
        type="checkbox"
        checked={allSelected}
        onChange={e => setSelectedIds(e.target.checked ? new Set(allSelectableIds) : new Set())}
        className="w-4 h-4 rounded accent-violet-500"
      />
    </th>
    <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest">User</th>
    <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest">Role</th>
    <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest hidden sm:table-cell">Status</th>
    <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest hidden md:table-cell">Joined</th>
    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest">Actions</th>
  </tr>
</thead>
```

- [ ] **Step 4: Add checkbox cell to each user row**

Inside `{users.map(u => (`, add a checkbox `<td>` as the very first cell (before the User `<td>`):
```tsx
<td className="px-4 py-3">
  <input
    type="checkbox"
    checked={selectedIds.has(u._id)}
    onChange={() => toggleSelect(u._id)}
    disabled={u._id === currentUser?.id}
    className="w-4 h-4 rounded accent-violet-500 disabled:opacity-30 disabled:cursor-not-allowed"
  />
</td>
```

- [ ] **Step 5: Add bulk action toolbar**

Add this block between the role filter tabs and the table card (before `{/* Table */}`):
```tsx
{/* Bulk action toolbar */}
{selectedIds.size > 0 && (
  <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-2xl">
    <span className="text-xs font-bold text-red-700 dark:text-red-400">
      {selectedIds.size} selected
    </span>
    <button
      onClick={() => setBulkDeleteOpen(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
    >
      <Trash size={12} weight="fill" /> Delete selected
    </button>
    <button
      onClick={() => setSelectedIds(new Set())}
      className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold ml-auto"
    >
      Clear
    </button>
  </div>
)}
```

- [ ] **Step 6: Add `BulkDeleteConfirmModal` to AnimatePresence section**

After the existing `{/* Confirm modal */}` AnimatePresence block, add:
```tsx
{/* Bulk delete confirm modal */}
<AnimatePresence>
  {bulkDeleteOpen && (
    <BulkDeleteConfirmModal
      count={selectedIds.size}
      onClose={() => setBulkDeleteOpen(false)}
      onConfirm={handleBulkDelete}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 7: Add `usersService` import**

The existing file uses `axiosClient` directly. Add the service import at the top:
```tsx
import { usersService } from '@/services/users.service'
```

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/admin/AdminUsers.tsx
git commit -m "feat(admin): add bulk delete to AdminUsers page"
```

---

## Task 5: Client — AdminPaymentsView Delete

**Files:**
- Modify: `client/src/pages/admin/AdminPaymentsView.tsx`

- [ ] **Step 1: Add `PaymentDeleteModal` component**

Add this component at the top of the file, before `export default function AdminPaymentsView()`. Add `Trash` and `ArrowsClockwise` to the existing phosphor icons import:

```tsx
import {
  CreditCard, CheckCircle, WarningCircle, XCircle, MagnifyingGlass,
  FunnelSimple, Plus, Image, LockSimple, WhatsappLogo, Trash, ArrowsClockwise,
} from '@phosphor-icons/react'
```

Then add the modal component:

```tsx
function PaymentDeleteModal({ ids, onClose, onSuccess }: {
  ids: string[]
  onClose: () => void
  onSuccess: (deletedIds: string[]) => void
}) {
  const [deactivate, setDeactivate] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const count = ids.length

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      if (count === 1) {
        await paymentsService.deletePayment(ids[0], deactivate)
      } else {
        await paymentsService.bulkDeletePayments(ids, deactivate)
      }
      toast.success(count === 1 ? 'Payment deleted.' : `${count} payments deleted.`)
      onSuccess(ids)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Delete failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
            <Trash size={20} weight="fill" className="text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {count === 1 ? 'Delete payment record?' : `Delete ${count} payment records?`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
              {count === 1
                ? 'This payment record will be permanently removed.'
                : `${count} payment records will be permanently removed.`}{' '}
              This cannot be undone.
            </p>
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 flex-shrink-0">
            <XCircle size={12} />
          </button>
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={deactivate}
            onChange={e => setDeactivate(e.target.checked)}
            className="w-4 h-4 rounded accent-amber-500 flex-shrink-0"
          />
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Also deactivate course access</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
              Affected students will lose access to their enrolled courses
            </p>
          </div>
        </label>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <ArrowsClockwise size={13} className="animate-spin" /> : null}
            {loading ? 'Deleting…' : count === 1 ? 'Delete' : `Delete ${count}`}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add payment selection state**

Inside `export default function AdminPaymentsView()`, add after the existing state declarations:

```tsx
const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set())
const [paymentDeleteIds, setPaymentDeleteIds]     = useState<string[] | null>(null)

const allPaymentsSelected = filtered.length > 0 && filtered.every(p => selectedPaymentIds.has(p._id))

const togglePaymentSelect = (id: string) =>
  setSelectedPaymentIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
```

Note: `allPaymentsSelected` references `filtered`, so place it **after** the `filtered` constant definition (line ~96).

Add `handlePaymentDeleteSuccess` handler:
```tsx
const handlePaymentDeleteSuccess = (deletedIds: string[]) => {
  const idSet = new Set(deletedIds)
  setPayments(prev => prev.filter(p => !idSet.has(p._id)))
  setSelectedPaymentIds(new Set())
  setPaymentDeleteIds(null)
}
```

- [ ] **Step 3: Add checkbox column to payments table header**

In the payment table `<thead>` (inside `{activeTab === 'payments'}`), replace:
```tsx
{['Student', 'Course', 'Method', 'Amount', 'Status', 'Date', 'Screenshot', 'Actions'].map(h => (
  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
))}
```
with:
```tsx
<th className="px-4 py-3 w-10">
  <input
    type="checkbox"
    checked={allPaymentsSelected}
    onChange={e => setSelectedPaymentIds(e.target.checked ? new Set(filtered.map(p => p._id)) : new Set())}
    className="w-4 h-4 rounded accent-violet-500"
  />
</th>
{['Student', 'Course', 'Method', 'Amount', 'Status', 'Date', 'Screenshot', 'Actions'].map(h => (
  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
))}
```

- [ ] **Step 4: Add checkbox cell and trash icon to each payment row**

In `{filtered.map(p => (`, add checkbox as first cell and trash icon to the Actions cell.

**Checkbox cell** — add before the Student `<td>`:
```tsx
<td className="px-4 py-3">
  <input
    type="checkbox"
    checked={selectedPaymentIds.has(p._id)}
    onChange={() => togglePaymentSelect(p._id)}
    className="w-4 h-4 rounded accent-violet-500"
  />
</td>
```

**Trash icon** — inside the Actions `<td>`, after the existing reject button:
```tsx
<button
  onClick={() => setPaymentDeleteIds([p._id])}
  title="Delete payment record"
  className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
>
  <Trash size={13} weight="fill" />
</button>
```

- [ ] **Step 5: Add bulk action toolbar above payments table**

Add this block just above the payments table `<div>` (inside `{activeTab === 'payments'}`, after the Filters section and before the action panel):

```tsx
{/* Bulk delete toolbar */}
{selectedPaymentIds.size > 0 && (
  <div className="flex items-center gap-3 px-4 py-2.5 mb-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-2xl">
    <span className="text-xs font-bold text-red-700 dark:text-red-400">
      {selectedPaymentIds.size} selected
    </span>
    <button
      onClick={() => setPaymentDeleteIds(Array.from(selectedPaymentIds))}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
    >
      <Trash size={12} weight="fill" /> Delete selected
    </button>
    <button
      onClick={() => setSelectedPaymentIds(new Set())}
      className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold ml-auto"
    >
      Clear
    </button>
  </div>
)}
```

- [ ] **Step 6: Render `PaymentDeleteModal`**

At the bottom of the component's JSX (before the final closing `</div>`), add:

```tsx
{/* Payment delete modal */}
{paymentDeleteIds && (
  <PaymentDeleteModal
    ids={paymentDeleteIds}
    onClose={() => setPaymentDeleteIds(null)}
    onSuccess={handlePaymentDeleteSuccess}
  />
)}
```

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/admin/AdminPaymentsView.tsx
git commit -m "feat(admin): add single and bulk delete to AdminPaymentsView"
```

---

## Task 6: Smoke Test Both Pages

- [ ] **Step 1: Start dev server**

```bash
cd "E:\Nabeel Javed\Web Portfolios\English Website"
# Terminal 1
cd server && npm run dev
# Terminal 2
cd client && npm run dev
```

- [ ] **Step 2: Test AdminUsers bulk delete**

1. Log in as admin → go to `/admin/users`
2. Verify checkboxes appear on each row
3. Admin's own row checkbox should be greyed out / disabled
4. Select 1–2 test users → bulk toolbar appears with count
5. Click "Delete selected" → `BulkDeleteConfirmModal` opens with correct count
6. Confirm → users disappear from list, toast shown
7. "Clear" button dismisses toolbar

- [ ] **Step 3: Test AdminPaymentsView single delete**

1. Go to `/admin/payments` → Payment Records tab
2. Verify trash icon appears on each payment row
3. Click trash → `PaymentDeleteModal` opens
4. Toggle "Also deactivate course access" on/off
5. Confirm → payment disappears from list, toast shown

- [ ] **Step 4: Test AdminPaymentsView bulk delete**

1. Select multiple payments via checkboxes
2. Bulk toolbar appears with correct count
3. Click "Delete selected" → modal shows correct count
4. Enable enrollment deactivation toggle, confirm
5. Payments removed from list, toast shown

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify delete feature complete"
```
