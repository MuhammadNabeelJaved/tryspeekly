# Salary Request Feature — Design Spec

**Date:** 2026-05-22
**Status:** Approved

---

## Overview

Teachers can submit salary payment requests from their `InstructorSalary` page. The admin receives a real-time notification and can approve (which auto-creates a `SalaryPayment`) or reject (with a reason). The teacher is notified of either outcome in real-time.

---

## Section 1 — Data Layer

### New model: `salary-request.model.js`

```js
{
  teacher:     { type: ObjectId, ref: 'User',          required: true },
  package:     { type: ObjectId, ref: 'SalaryPackage', required: true },
  amount:      { type: Number,   required: true, min: 0 },
  periodLabel: { type: String,   trim: true, maxlength: 100 },       // e.g. "May 2026"
  periodStart: { type: Date,     required: true },
  periodEnd:   { type: Date },
  note:        { type: String,   trim: true, maxlength: 500 },
  status:      { type: String,   enum: ['pending','approved','rejected'], default: 'pending' },
  adminReply:  { type: String,   trim: true, maxlength: 500 },        // rejection reason or approval note
  resolvedAt:  { type: Date },                                        // set on approve or reject
}
// timestamps: true, versionKey: false
// indexes: { teacher: 1 }, { status: 1 }, { createdAt: -1 }
```

**Constraint:** A teacher may only have **one pending request at a time**. The server returns `ConflictError` if they submit while one is already pending.

### TypeScript types (`client/src/types/api.ts`)

Three new interfaces added:

```ts
export interface SalaryRequest {
  _id: string
  teacher: string
  package: string
  amount: number
  periodLabel?: string
  periodStart: string
  periodEnd?: string
  note?: string
  status: 'pending' | 'approved' | 'rejected'
  adminReply?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSalaryRequestDto {
  amount: number
  periodStart: string
  periodLabel?: string
  periodEnd?: string
  note?: string
}

export interface AdminResolveSalaryRequestDto {
  adminReply?: string   // optional on approve, encouraged on reject
}
```

### API endpoints (new route file: `salary-request.route.js`)

Mounted at `/api/v1/salary-requests`

| Method | Path | Auth | Action |
|--------|------|------|--------|
| `POST` | `/` | teacher | Submit new request (ConflictError if pending exists) |
| `GET` | `/my` | teacher | List own requests, sorted newest first |
| `DELETE` | `/:id` | teacher | Cancel own pending request (403 if not pending or not owner) |
| `GET` | `/` | admin | List all requests (`?status=pending` filter supported) |
| `PATCH` | `/:id/approve` | admin | Approve → auto-creates SalaryPayment, notifies teacher |
| `PATCH` | `/:id/reject` | admin | Reject with reason → notifies teacher |

No changes to existing `/api/v1/salaries` routes.

---

## Section 2 — Real-time Notifications

All three triggers use the existing `createAndEmitNotification` utility from `server/src/utils/notify.js`. Type is `'payment'`, which is a valid enum value in the Notification model.

### Trigger 1 — Teacher submits request → all admins notified

```js
// Query all admin users
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
```

### Trigger 2 — Admin approves → teacher notified

```js
await createAndEmitNotification({
  recipientId: request.teacher,
  title: 'Salary Request Approved',
  message: `Your salary request of ₨${request.amount} for ${request.periodLabel || formatPeriod(...)} has been approved.`,
  type: 'payment',
  severity: 'low',
  relatedId: request._id,
  relatedType: 'SalaryRequest',
})
```

### Trigger 3 — Admin rejects → teacher notified

```js
await createAndEmitNotification({
  recipientId: request.teacher,
  title: 'Salary Request Update',
  message: `Your salary request of ₨${request.amount} for ${request.periodLabel || formatPeriod(...)} was not approved.${adminReply ? ' Reason: ' + adminReply : ''}`,
  type: 'payment',
  severity: 'low',
  relatedId: request._id,
  relatedType: 'SalaryRequest',
})
```

The `formatPeriod(start, end)` helper is already defined in `salary.controller.js` — it will be extracted to a shared util or duplicated in the new controller.

---

## Section 3 — Teacher UI (`InstructorSalary.tsx`)

### New "Request Salary" section

Inserted between the Current Package card and Payment History. Hidden entirely if the teacher has no salary package.

**Request button / collapsed state:**
- "+ Request Salary" button (violet, outline style)
- Disabled with tooltip "You already have a pending request" when a `pending` request exists

**Expanded form** (shown on button click):
- **Amount (PKR)** — number input, pre-filled with `pkg.amount`, editable
- **Period Label** — text input, e.g. "May 2026" (optional)
- **Period Start** — date input (required)
- **Period End** — date input (optional)
- **Note** — textarea, max 500 chars (optional)
- **Submit** and **Cancel** buttons

**Request history list** (always visible when requests exist):

| Period | Amount | Status | Admin Reply |
|--------|--------|--------|-------------|
| May 2026 | ₨30,000 | `pending` | — |
| Apr 2026 | ₨30,000 | `approved` | — |
| Mar 2026 | ₨30,000 | `rejected` | "Will process next month" |

- Status badges: amber for `pending`, emerald for `approved`, red for `rejected`
- Pending rows show a **Cancel** button (calls `DELETE /api/v1/salary-requests/:id`)
- Admin reply shown as a subtle note below rejected entries
- List sorted newest first, no pagination (limit 20)

---

## Section 4 — Admin UI (`AdminSalaries.tsx`)

### Teacher list — pending indicator

An amber dot (8×8 circle) appears next to any teacher who has one or more `pending` salary requests. The indicator is fetched as part of the initial data load (`GET /api/v1/salary-requests?status=pending` → derive a Set of teacher IDs).

### Teacher detail — "Salary Requests" section

Inserted between the Salary Package form and Payment History.

**Section header:** "Salary Requests (N)" with a count of total requests for this teacher.

**Request rows:**
```
● May 2026 — ₨30,000          [pending]    just now
  Note: "Please process this month"
  [Approve]  [Reject]

○ Apr 2026 — ₨30,000          [approved]   3d ago

○ Mar 2026 — ₨30,000          [rejected]   5d ago
  Admin reply: "Will process next month"
```

**Approve flow (inline, no modal):**
1. Admin clicks "Approve"
2. A small inline form appears: optional "Admin note" text field + "Confirm Approve" button
3. On confirm → `PATCH /api/v1/salary-requests/:id/approve`
4. Server auto-creates a `SalaryPayment` with the request's `amount`, `periodLabel`, `periodStart`, `periodEnd`; marks request `approved`; notifies teacher
5. Payment History section re-fetches and shows the new payment

**Reject flow (inline):**
1. Admin clicks "Reject"
2. A small inline form appears: required "Reason" text field + "Confirm Reject" button
3. On confirm → `PATCH /api/v1/salary-requests/:id/reject` with `{ adminReply: reason }`
4. Server marks request `rejected`, saves reason, notifies teacher

**Real-time update:** When the teacher submits a new request, the admin's `new_notification` Socket.io event triggers a re-fetch of the teacher's requests if that teacher is currently selected.

---

## Section 5 — Service Layer (`salary.service.ts`)

New methods added to the existing `salaryService` object:

```ts
// Teacher methods
createRequest(data: CreateSalaryRequestDto): Promise<ApiResponse<SalaryRequest>>
getMyRequests(): Promise<ApiResponse<SalaryRequest[]>>
cancelRequest(id: string): Promise<{ success: boolean; message: string }>

// Admin methods
getAllRequests(status?: string): Promise<ApiResponse<SalaryRequest[]>>
approveRequest(id: string, data: AdminResolveSalaryRequestDto): Promise<ApiResponse<SalaryRequest>>
rejectRequest(id: string, data: AdminResolveSalaryRequestDto): Promise<ApiResponse<SalaryRequest>>
```

---

## Files Changed

| File | Action |
|------|--------|
| `server/src/models/salary-request.model.js` | Create |
| `server/src/controllers/salary-request.controller.js` | Create |
| `server/src/routes/salary-request.route.js` | Create |
| `server/src/app.js` | Mount new route at `/api/v1/salary-requests` |
| `client/src/types/api.ts` | Add `SalaryRequest`, `CreateSalaryRequestDto`, `AdminResolveSalaryRequestDto` |
| `client/src/services/salary.service.ts` | Add 6 new methods |
| `client/src/pages/instructor/InstructorSalary.tsx` | Add request form + history list |
| `client/src/pages/admin/AdminSalaries.tsx` | Add pending badges + requests section |

---

## Constraints

- One pending request per teacher at a time (server enforces with `ConflictError`)
- Teacher can only cancel their own pending request (server checks ownership + status)
- Admin approval auto-creates a `SalaryPayment` — no extra steps needed
- Admin rejection reason is required on the client but optional on the server (defensive)
- Notifications use type `'payment'` — the only valid enum values in the Notification model are: `system`, `user`, `payment`, `security`, `course`, `message`
- Real-time update on admin side is triggered by the existing Socket.io `new_notification` event (re-fetches requests, does not require a new socket event)
- No pagination on teacher's request list (limit 20, newest first)
