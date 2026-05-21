# Salary Management System — Design Spec

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a salary management system where admins define teacher salary packages and track payment history; teachers view their salary and payment records in their dashboard.

**Architecture:** Two Mongoose models (`SalaryPackage` + `SalaryPayment`) with separate admin CRUD routes and a teacher read-only route. Admin gets a new `AdminSalaries` dashboard page; teachers get a new `InstructorSalary` page.

**Tech Stack:** Node.js + Express v5 + Mongoose (server), React + TypeScript + Tailwind + Framer Motion (client)

---

## Data Models

### SalaryPackage (`salary-package.model.js`)

| Field | Type | Notes |
|-------|------|-------|
| `teacher` | ObjectId → User | required, unique (one active package per teacher) |
| `amount` | Number | PKR, required, min 0 |
| `type` | String enum | `monthly \| weekly \| per_course \| hourly \| custom` |
| `customType` | String | only when `type === 'custom'` (e.g. "bi-weekly") |
| `startDate` | Date | required |
| `endDate` | Date | optional — blank means ongoing |
| `status` | String enum | `active \| inactive`, default `active` |
| `notes` | String | optional, max 500 chars |
| timestamps | — | createdAt, updatedAt |

### SalaryPayment (`salary-payment.model.js`)

| Field | Type | Notes |
|-------|------|-------|
| `package` | ObjectId → SalaryPackage | required |
| `teacher` | ObjectId → User | required (for direct querying) |
| `amount` | Number | PKR, actual paid amount |
| `periodLabel` | String | e.g. "May 2026", "Week 3 - Jan 2026" |
| `periodStart` | Date | required |
| `periodEnd` | Date | optional |
| `status` | String enum | `paid \| pending \| overdue`, default `pending` |
| `paidDate` | Date | set when status = `paid` |
| `notes` | String | optional |
| timestamps | — | createdAt, updatedAt |

---

## API Routes

All routes under `/api/v1/salaries`. Admin routes require `authenticate + authorize('admin')`. Teacher route requires `authenticate + authorize('teacher')`.

### Admin Routes

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/v1/salaries` | List all packages, populated with teacher name/email/avatar |
| POST | `/api/v1/salaries` | Create salary package for a teacher |
| PATCH | `/api/v1/salaries/:id` | Update package fields |
| DELETE | `/api/v1/salaries/:id` | Delete package and all its payments |
| GET | `/api/v1/salaries/:id/payments` | List all payments for a package |
| POST | `/api/v1/salaries/:id/payments` | Add a payment record |
| PATCH | `/api/v1/salaries/:id/payments/:paymentId` | Update a payment record |
| DELETE | `/api/v1/salaries/:id/payments/:paymentId` | Delete a payment record |

### Teacher Route

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/v1/salaries/my` | Own active package + all payment records |

---

## Frontend

### Admin — `AdminSalaries.tsx`

- New page added to admin nav with a Money/Wallet icon
- **Teacher list view:** Cards/rows for each teacher showing name, avatar, salary amount (PKR), type, status badge (active/inactive), and quick "Add Salary" if no package exists
- **Package panel (modal or slide-in):** Opens when clicking a teacher. Contains:
  - Package form: amount, type, customType (conditional), startDate, endDate, status, notes — with Save/Cancel
  - Delete package button (with confirmation)
  - Payment history section below the form:
    - Table: period label, amount, status badge, paid date, actions (edit/delete)
    - "Add Payment" button opens inline form: periodLabel, periodStart, periodEnd, amount, status, paidDate (conditional on status=paid), notes
- Teachers with no salary package show a muted "No package" indicator with an "Add" button

### Teacher — `InstructorSalary.tsx`

- New "Salary" nav item in instructor sidebar (Money icon)
- **Top section:** Current package card showing amount (PKR), type, start date, status, notes
- **No package state:** Friendly empty state — "No salary package assigned yet. Please contact admin."
- **Payment history table:** Period, amount (PKR), status badge (paid/pending/overdue), paid date. Read-only.
- `InstructorDashboardPage.tsx`: add `'salary'` to `InstructorView` type, lazy-load the component, add nav item

---

## Error Handling

- Creating a package for a teacher who already has one → `409 Conflict`
- Deleting a package cascades and deletes all its payments
- Teacher accessing `/my` with no package → `200` with `data: null` (not 404)
- Admin referencing non-existent teacher or package → `404 Not Found`

---

## File Map

**Server (new files):**
- `server/src/models/salary-package.model.js`
- `server/src/models/salary-payment.model.js`
- `server/src/controllers/salary.controller.js`
- `server/src/routes/salary.route.js`

**Server (modified):**
- `server/app.js` — register `/api/v1/salaries` route

**Client (new files):**
- `client/src/pages/admin/AdminSalaries.tsx`
- `client/src/pages/instructor/InstructorSalary.tsx`
- `client/src/services/salary.service.ts`

**Client (modified):**
- `client/src/pages/AdminPage.tsx` — add `'salaries'` view + nav item + lazy import
- `client/src/pages/InstructorDashboardPage.tsx` — add `'salary'` view + nav item + lazy import
- `client/src/types/api.ts` — add `SalaryPackage`, `SalaryPayment` types
