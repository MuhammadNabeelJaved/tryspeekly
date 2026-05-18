# Enrollment + Payment + Access Control Design

## Goal

Allow students to enroll in courses immediately, then submit manual payment proof. Course content remains locked until admin approves the payment. Students can track payment status in their dashboard.

## Architecture

**Access rule:** `enrollment.isActive === true` grants course access. All other states (no payment, pending, rejected) keep the course locked but visible in the student's enrolled list.

**Enrollment flow:**
1. Student clicks Enroll → `POST /enrollments` → enrollment created with `isActive: false`, `payment: null`
2. Student submits payment proof in-app → `POST /payments` (screenshot + method + details) → payment created with `status: 'pending'`; enrollment's `payment` ref is set to the new payment
3. Admin reviews in Payments page → `PATCH /payments/:id/approve` → `payment.status = 'approved'` + `enrollment.isActive = true` (access granted) + in-app notification sent to student
4. Admin rejects → `PATCH /payments/:id/reject` → `payment.status = 'rejected'` + in-app notification with reason; student can resubmit
5. Admin can manually create a payment record on behalf of a student → `POST /payments/admin`; same approval flow applies

**No schema changes needed.** `isActive` (Boolean) and `payment` (ObjectId ref) already exist on the Enrollment model.

## Tech Stack

- Server: Node.js + Express (ES Modules) + Mongoose
- Client: React + TypeScript + Tailwind CSS
- File storage: Cloudinary (screenshot upload via Multer, already wired)
- Notifications: existing in-app Notification model + service

---

## Server Changes

### `enrollment.controller.js` — `createEnrollment`
- Verify new enrollments are created with `isActive: false` (enforce explicitly)
- Return 409 if student is already enrolled in the course (unique index already exists)
- No other changes needed

### `payment.controller.js`

**`createPayment` (existing — student submits proof):**
- Accept: `courseId`, `teacherId`, `method`, `transactionId?`, `amount`, `currency`, `screenshot` (file)
- Upload screenshot to Cloudinary, store URL
- Create payment with `status: 'pending'`
- Find the enrollment for `{ student: req.user._id, course: courseId }` and set `enrollment.payment = newPayment._id`
- Return created payment

**`approvePayment` (existing — extend):**
- Set `payment.status = 'approved'`, `payment.adminNote = adminNote`
- Find enrollment via `{ student: payment.student, course: payment.course }`, set `enrollment.isActive = true`
- Create Notification: `{ recipient: payment.student, title: 'Payment Approved', message: 'Your payment for [course] has been approved. You now have full access.', type: 'payment', severity: 'low' }`

**`rejectPayment` (existing — extend):**
- Set `payment.status = 'rejected'`, `payment.rejectionReason = reason`
- Create Notification: `{ recipient: payment.student, title: 'Payment Rejected', message: 'Your payment for [course] was rejected: [reason]. Please resubmit.', type: 'payment', severity: 'medium' }`

**`adminCreatePayment` (new):**
- Admin-only route
- Body: `{ studentId, courseId, teacherId, method, amount, currency, transactionId? }`
- No screenshot required (admin is creating manually)
- Create payment with `status: 'pending'`
- Find enrollment `{ student: studentId, course: courseId }` and set `enrollment.payment = newPayment._id`
- Return created payment

### `payment.route.js`
- Add: `POST /payments/admin` — protected by `authenticate` + `authorize('admin')`

### Response shape for payment list (GET /payments)
Must populate:
- `student`: `_id name email`
- `course`: `_id title`
- `teacher`: `_id name`

---

## Client Changes

### `StudentCourses.tsx`
Each enrollment card renders based on two fields: `enrollment.isActive` and `enrollment.payment` (populated with `status`).

| State | Display |
|---|---|
| `isActive: true` | Normal — "Go to Course" button |
| `isActive: false`, payment `pending` | "Payment Pending" amber badge; clicking card opens `PaymentStatusModal` |
| `isActive: false`, payment `rejected` | "Payment Rejected" red badge; modal shows rejection reason + "Resubmit" button |
| `isActive: false`, no payment | "Submit Payment" blue badge; clicking opens `PaymentSubmitModal` |

Clicking a locked course card opens the appropriate modal — it does NOT navigate to course content.

### `PaymentSubmitModal` (new component — `client/src/components/student/PaymentSubmitModal.tsx`)
Fields:
- Payment method (select): JazzCash, EasyPaisa, NayaPay, SadaPay, Zindigi, Bank (Local), Bank (International)
- Transaction ID (text, optional)
- Amount (number, required)
- Currency (select): PKR / USD
- Screenshot (file input, required — image only)

On submit: calls `paymentsService.createPayment(formData)` → `POST /payments`

States: idle → loading → success (shows confirmation message, closes after 2s) → error (shows error message)

### `PaymentStatusModal` (new component — `client/src/components/student/PaymentStatusModal.tsx`)
Shows:
- Payment method, amount, currency, submitted date
- Status badge (Pending / Rejected)
- If rejected: rejection reason + "Resubmit Payment" button (opens `PaymentSubmitModal`)
- If pending: "Your payment is under review" message

### `StudentPayments.tsx`
- Remove all `MOCK_PAYMENTS` and `studentData.ts` imports
- Fetch from `paymentsService.getMyPayments()` on mount
- Display columns: Course, Method, Amount, Status, Submitted Date, Admin Note
- Status badges: Pending (amber), Approved (green), Rejected (red)
- If rejected: show `rejectionReason` below the row
- Loading skeleton + empty state when no payments

### `AdminPaymentsView.tsx`
- Fix API call: use `GET /payments` (not `/payments/all`)
- Approve action: opens inline note input → calls `paymentsService.approvePayment(id, note)`
- Reject action: opens inline reason input (required) → calls `paymentsService.rejectPayment(id, reason)`
- Add "Add Payment" button → opens `AdminPaymentCreateModal`
- Refresh list after any action

### `AdminPaymentCreateModal` (new component — `client/src/components/admin/AdminPaymentCreateModal.tsx`)
Fields:
- Student (text input for student name/email — fetches from `GET /users?role=student&search=...`)
- Course (text input — fetches from `GET /courses?search=...`); when a course is selected, `teacherId` is derived from `course.teacher._id` (no separate teacher input needed)
- Payment method (select)
- Transaction ID (text, optional)
- Amount + Currency
- Admin note (optional)

On submit: calls new `paymentsService.adminCreatePayment(dto)` → `POST /payments/admin`

### `payments.service.ts`
Add:
```typescript
adminCreatePayment(dto: AdminCreatePaymentDto): Promise<ApiResponse<Payment>>
```

Add type in `api.ts`:
```typescript
export interface AdminCreatePaymentDto {
  studentId: string;
  courseId: string;
  teacherId: string;
  method: PaymentMethod;
  transactionId?: string;
  amount: number;
  currency?: 'PKR' | 'USD';
}
```

---

## Enrollment API Response

`GET /enrollments/my` must populate `payment` with at minimum: `_id status method amount currency screenshotUrl rejectionReason adminNote createdAt` so the frontend can determine access and display status without a second request.

If the enrollment controller does not currently populate `payment`, add `.populate('payment', '_id status method amount currency rejectionReason adminNote createdAt')` to the query.

---

## Notification Integration

Use the existing `Notification` model. After approve/reject, create a notification document directly in the payment controller (no separate service needed):

```js
await Notification.create({
  recipient: payment.student,
  title: '...',
  message: '...',
  type: 'payment',
  severity: 'low' | 'medium',
  relatedId: payment._id,
  relatedType: 'Payment',
})
```

---

## Out of Scope

- Email/WhatsApp notifications (admin contacts student externally — no change needed)
- Auto-approval logic
- Recurring payment / subscription billing
- Refund flow
