# Salary Payment Method & Notification — Design Spec

**Date:** 2026-05-22
**Status:** Approved

---

## Overview

Two additions to the existing salary management system:

1. **Real-time notification** — when admin marks a salary payment as `paid`, the teacher receives an in-app notification via Socket.io
2. **Payment method field** — admin selects from a searchable list of 29 Pakistani banks and fintech apps (with logos) when adding/editing a payment; teacher sees the chosen method in their payment history

---

## Section 1 — Data Layer

### Server model change

Add `paymentMethod` to `SalaryPayment` (optional string, no enum — stored as the option `id`):

```js
paymentMethod: {
  type: String,
  trim: true,
  maxlength: [100, 'Payment method cannot exceed 100 characters'],
},
```

### TypeScript types

Add `paymentMethod?: string` to three interfaces in `client/src/types/api.ts`:
- `SalaryPayment`
- `CreateSalaryPaymentDto`
- `UpdateSalaryPaymentDto`

### Static data file

New file: `client/src/data/pakistanPaymentMethods.ts`

```ts
export interface PaymentMethodOption {
  id: string        // e.g. 'jazzcash' — stored in DB and sent to API
  name: string      // e.g. 'JazzCash' — displayed in UI
  category: 'fintech' | 'bank'
  domain: string    // e.g. 'jazzcash.com.pk' — used for favicon URL
  color: string     // brand hex color — fallback when logo fails to load
}
```

Logo URL pattern: `https://www.google.com/s2/favicons?domain={domain}&sz=64`

**29 entries** — fintech first, then banks:

| # | id | name | category | domain | color |
|---|-----|------|----------|--------|-------|
| 1 | jazzcash | JazzCash | fintech | jazzcash.com.pk | #CC0000 |
| 2 | easypaisa | Easypaisa | fintech | easypaisa.com.pk | #00A651 |
| 3 | nayapay | NayaPay | fintech | nayapay.com | #6C3CE1 |
| 4 | sadapay | SadaPay | fintech | sadapay.com | #000000 |
| 5 | zindigi | Zindigi | fintech | zindigi.com | #7B2D8B |
| 6 | upaisa | UPaisa | fintech | upaisa.com | #F7941D |
| 7 | timepey | TimePey | fintech | timepey.com | #00AEEF |
| 8 | raast | Raast (SBP) | fintech | raast.com.pk | #009B77 |
| 9 | hbl | HBL | bank | hbl.com | #00874E |
| 10 | ubl | UBL | bank | ubl.com | #C8202E |
| 11 | mcb | MCB Bank | bank | mcb.com.pk | #E31E24 |
| 12 | allied | Allied Bank | bank | abl.com | #003087 |
| 13 | alfalah | Bank Alfalah | bank | bankalfalah.com | #00539B |
| 14 | meezan | Meezan Bank | bank | meezanbank.com | #007749 |
| 15 | askari | Askari Bank | bank | askaribank.com | #006341 |
| 16 | alhabib | Bank Al-Habib | bank | bankalhabib.com | #C8202E |
| 17 | faysal | Faysal Bank | bank | faysalbank.com | #009A44 |
| 18 | soneri | Soneri Bank | bank | soneribank.com | #D4A017 |
| 19 | sc | Standard Chartered | bank | sc.com | #0072AA |
| 20 | habibmetro | Habib Metro | bank | habibmetro.com | #C8202E |
| 21 | silkbank | Silk Bank | bank | silkbank.com.pk | #9B1B30 |
| 22 | nbp | National Bank of Pakistan | bank | nbp.com.pk | #005B9F |
| 23 | bop | Bank of Punjab | bank | bop.com.pk | #004C97 |
| 24 | bok | Bank of Khyber | bank | bok.com.pk | #005A9C |
| 25 | sindhbank | Sindh Bank | bank | sindhbank.com.pk | #00843D |
| 26 | fwb | First Women Bank | bank | fwbl.com.pk | #9B1B30 |
| 27 | summit | Summit Bank | bank | summitbank.com.pk | #005BAA |
| 28 | ztbl | Zarai Taraqiati Bank | bank | ztbl.gov.pk | #4CAF50 |
| 29 | cash | Cash | fintech | — | #4CAF50 |

> Note: entry 29 `cash` uses no domain (hand-to-hand cash payment) — show a generic icon (PhosphorIcon `Money`) instead of a favicon.

---

## Section 2 — Real-time Notification

### Trigger points

In `server/src/controllers/salary.controller.js`:

**`addPayment`** — after `SalaryPayment.create(...)`, if `status === 'paid'`:
```js
await createAndEmitNotification({
  recipient: pkg.teacher,
  title: 'Salary Payment Received',
  message: `Your salary of ₨${amount} for ${periodLabel || formatPeriod(periodStart, periodEnd)} has been paid via ${paymentMethod || 'bank transfer'}.`,
  type: 'salary_payment',
  severity: 'low',
  relatedId: payment._id,
  relatedType: 'SalaryPayment',
})
```

**`updatePayment`** — after `payment.save()`, if incoming `status === 'paid'` AND the previous status was NOT `'paid'`:
```js
// Capture old status before save
const wasNotPaid = payment.status !== 'paid'
// ... apply updates ...
await payment.save()
if (status === 'paid' && wasNotPaid) {
  await createAndEmitNotification({ ... }) // same shape as above
}
```

### Helper

A small inline helper `formatPeriod(start, end)` formats dates as `"May 2026"` or `"May 1–31, 2026"` — used only in the notification message string.

### Infrastructure

No new infrastructure. Uses existing:
- `createAndEmitNotification` from `server/src/utils/notify.js`
- Socket.io `emitToUser` already wired up
- Teacher's notification bell already receives and displays notifications

---

## Section 3 — Admin UI (Add/Edit Payment Form)

File: `client/src/pages/admin/AdminSalaries.tsx`

### New field in PaymentFormValues

```ts
paymentMethod?: string  // stores the option id, e.g. 'jazzcash'
```

### Searchable payment method selector

A custom combobox component built inline (no new file — small enough):

- Text input with placeholder "Search payment method..."
- Dropdown opens on focus, closes on outside click or selection
- Filters the 29 options client-side by `name` (case-insensitive)
- Options grouped: Fintech first, then Banks (visual separator between groups)
- Each row: `[32×32 favicon]  Name  [category badge]`
- Selected state: shows `[24×24 favicon]  Name` in the input area
- Cash option: PhosphorIcon `Money` instead of favicon
- Clearing: small × button appears when a value is selected
- Optional field — can be submitted without selecting a method

### Edit pre-population

When editing an existing payment, `paymentMethod` from the fetched payment populates the selector.

---

## Section 4 — Teacher UI (Payment History)

File: `client/src/pages/instructor/InstructorSalary.tsx`

### New column in payment table

Added between "Period" and "Amount":

| Period | Payment Method | Amount | Status | Paid Date |
|--------|---------------|--------|--------|-----------|

**Cell content:**
- If `paymentMethod` is set and matches a known id: `[24×24 logo]  Name`
- Cash: PhosphorIcon `Money` + "Cash"
- Unknown id: raw string (defensive fallback)
- Not set: `—`

No other changes. View remains read-only.

---

## Files Changed

| File | Action |
|------|--------|
| `server/src/models/salary-payment.model.js` | Add `paymentMethod` field |
| `server/src/controllers/salary.controller.js` | Accept `paymentMethod` in addPayment + updatePayment; fire notifications on paid status |
| `client/src/data/pakistanPaymentMethods.ts` | Create — 29 entries static list |
| `client/src/types/api.ts` | Add `paymentMethod?: string` to 3 interfaces |
| `client/src/pages/admin/AdminSalaries.tsx` | Add payment method selector to add/edit payment form |
| `client/src/pages/instructor/InstructorSalary.tsx` | Add payment method column to table |

---

## Constraints

- No new API endpoints — `paymentMethod` piggybacks on existing payment create/update routes
- No enum in the DB — stored as a plain string for flexibility
- Logo loading is best-effort — broken images are hidden via `onError` handler
- Notification fires only on the transition to `paid`, not on every save
- Static list is client-only — server does not validate the payment method value against the list
