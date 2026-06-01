# Delete Feature — All Users & All Payments
**Date:** 2026-06-02
**Scope:** Admin dashboard — single and bulk delete for users and payment records

---

## Overview

Add single-delete and bulk-delete capability to two admin pages:
1. **AdminUsers** (`/admin/users`) — soft-delete one or many user accounts
2. **AdminPaymentsView** (`/admin/payments`) — hard-delete one or many payment records, with an optional toggle to also deactivate the linked course enrollment

---

## Server Side

### 1. Bulk Delete Users
**Endpoint:** `DELETE /api/v1/users/bulk`
**Auth:** `authenticate + authorize('admin')`
**Body:** `{ ids: string[] }`
**Behavior:**
- Validate `ids` is a non-empty array (max 100)
- Skip the requesting admin's own ID silently (self-deletion prevention)
- For each user: delete Cloudinary profile image if present, set `isDeleted = true`, emit `user:deleted` socket event
- Uses `Promise.allSettled` so one failure doesn't abort the rest
- Response: `{ success: true, message: "X users deleted", data: { deleted: N, skipped: N } }`

**Route file:** `server/src/routes/user.route.js`
```
router.route('/bulk').delete(authenticate, authorize('admin'), bulkDeleteUsers)
```
> Must be registered **before** `/:id` to avoid Express treating `bulk` as an id param.

### 2. Single Delete Payment
**Endpoint:** `DELETE /api/v1/payments/:id`
**Auth:** `authenticate + authorizeTeamPage('payments')`
**Query param:** `?deactivateEnrollment=true` (default: false)
**Behavior:**
- Find payment by id, 404 if not found
- Delete Cloudinary screenshot if `screenshotUrl` exists
- Hard-delete payment document from DB
- If `deactivateEnrollment=true` and payment has a linked enrollment: set `enrollment.isActive = false`
- Response: `{ success: true, message: "Payment deleted" }`

### 3. Bulk Delete Payments
**Endpoint:** `DELETE /api/v1/payments/bulk`
**Auth:** `authenticate + authorizeTeamPage('payments')`
**Body:** `{ ids: string[], deactivateEnrollments: boolean }`
**Behavior:**
- Validate `ids` is non-empty (max 100)
- For each payment: delete Cloudinary screenshot, hard-delete document
- If `deactivateEnrollments = true`: collect all `enrollment` refs from the payments, batch-update `isActive = false` with `Enrollment.updateMany({ _id: { $in: enrollmentIds } }, { isActive: false })`
- Uses `Promise.allSettled`
- Response: `{ success: true, message: "X payments deleted", data: { deleted: N } }`

**Route file:** `server/src/routes/payment.route.js`
```
router.route('/bulk').delete(authenticate, authorizeTeamPage('payments'), bulkDeletePayments)
router.route('/:id').delete(authenticate, authorizeTeamPage('payments'), deletePayment)
```
> `/bulk` must be registered before `/:id`.

---

## Client Side

### AdminUsers changes

**Checkbox selection:**
- Add `selectedIds: Set<string>` state
- Leftmost `<th>` and `<td>` get a checkbox
- Header checkbox = select all on current page
- Admin's own `_id` row: checkbox is `disabled` and visually greyed out (cannot self-delete)
- Clicking a blocked row's checkbox works normally

**Bulk action toolbar:**
- Appears between role-filter tabs and the table when `selectedIds.size > 0`
- Shows: `"{N} selected"` count + red **Delete selected** button + **Clear selection** link
- On click → opens `BulkDeleteConfirmModal`

**BulkDeleteConfirmModal:**
- Lists count: "Delete 3 user accounts?"
- Warning: "This cannot be undone."
- Confirm → calls `DELETE /api/v1/users/bulk` with `ids`
- On success: remove deleted ids from local `users` state, clear selection, toast

**Single delete:** existing per-row trash icon + `ConfirmModal` unchanged.

**Service method:** `usersService.bulkDelete(ids: string[])` in `client/src/services/users.service.ts`

---

### AdminPaymentsView changes (Payments tab only)

**Single delete button:**
- Add trash icon button in the Actions column (rightmost, after approve/reject icons)
- Only shown for all payment statuses (pending, approved, rejected)
- Opens `PaymentDeleteModal` for that single payment

**Checkbox selection:**
- Add `selectedPaymentIds: Set<string>` state
- Leftmost checkbox column in payment table
- Header "Select All" for current filtered view

**Bulk action toolbar:**
- Appears above the payment table when `selectedPaymentIds.size > 0`
- Shows: `"{N} selected"` + red **Delete selected** button + **Clear** link

**PaymentDeleteModal (reused for single + bulk):**
- Prop: `ids: string[]` (single = array of one)
- Title: "Delete payment record" / "Delete X payment records"
- Body: warning about permanent deletion
- Toggle (checkbox): **"Also deactivate course access for affected students"** — default OFF
- Confirm → calls `DELETE /api/v1/payments/:id?deactivateEnrollment=true/false` (single) or `DELETE /api/v1/payments/bulk` with body (bulk)
- On success: remove deleted ids from local `payments` state, clear selection, toast

**Service methods** in `client/src/services/payments.service.ts`:
- `deletePayment(id: string, deactivateEnrollment: boolean)`
- `bulkDeletePayments(ids: string[], deactivateEnrollments: boolean)`

---

## Safety Rules

| Rule | Where enforced |
|---|---|
| Admin cannot delete own account | Server: skip own id in bulk; Client: disable checkbox |
| Cannot delete 0 items | Client: button disabled if selection empty |
| Bulk max 100 ids | Server: Joi validation |
| Deactivate enrollment is opt-in, default OFF | Both client default + server default |
| Cloudinary cleanup before DB delete | Server |

---

## Files Changed

| File | Change |
|---|---|
| `server/src/controllers/user.controller.js` | Add `bulkDeleteUsers` |
| `server/src/routes/user.route.js` | Add `DELETE /bulk` route |
| `server/src/controllers/payment.controller.js` | Add `deletePayment`, `bulkDeletePayments` |
| `server/src/routes/payment.route.js` | Add `DELETE /:id` and `DELETE /bulk` routes |
| `client/src/pages/admin/AdminUsers.tsx` | Checkboxes, bulk toolbar, `BulkDeleteConfirmModal` |
| `client/src/pages/admin/AdminPaymentsView.tsx` | Single trash icon, checkboxes, bulk toolbar, `PaymentDeleteModal` |
| `client/src/services/payments.service.ts` | Add `deletePayment`, `bulkDeletePayments` |
| `client/src/services/users.service.ts` | Add `bulkDelete` (or use axiosClient inline) |
