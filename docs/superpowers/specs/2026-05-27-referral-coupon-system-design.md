# Referral & Coupon System Design

**Date:** 2026-05-27  
**Status:** Approved  

---

## Overview

A unified referral and coupon code management system for the English LMS. Students can generate referral links (general or per-course) and earn wallet credits when referred students pay. Admins can create standalone coupon codes for promotions and configure global referral reward rates. All discount codes share a single coupon engine.

---

## Architecture

### Approach: Separate Models, Linked at Coupon

Three new models + one payment model extension + one site-settings extension. A referral code IS a coupon — when a student generates a referral link, it creates a `Coupon` doc with `source: 'referral'`. Discount validation lives in one place (coupon validation endpoint). Reward crediting is triggered as a side-effect of payment approval.

---

## Section 1 — Database Models

### `Coupon` (`server/src/models/coupon.model.js`)

| Field | Type | Notes |
|---|---|---|
| `code` | String, unique, required | e.g. `SAVE20`, `REF-ABC123` |
| `source` | enum: `admin` \| `referral` | who created it |
| `discountType` | enum: `percentage` \| `fixed` | |
| `discountValue` | Number, required | e.g. 20 (%) or 500 (PKR) |
| `scope` | enum: `platform` \| `course` | platform = valid on any course |
| `course` | ref → Course, nullable | only when scope = `course` |
| `maxUses` | Number, nullable | null = unlimited |
| `usedCount` | Number, default 0 | incremented on payment approval |
| `expiresAt` | Date, nullable | null = no expiry |
| `isActive` | Boolean, default true | admin can toggle |
| `createdBy` | ref → User | admin who created it |
| `referrer` | ref → User, nullable | only when source = `referral` |

**Indexes:** `code` (unique), `referrer + course` (for idempotent generation), `source + isActive`

---

### `ReferralReward` (`server/src/models/referral-reward.model.js`)

One record per successful referral use. A single referral code can generate multiple reward records (one per referee).

| Field | Type | Notes |
|---|---|---|
| `referrer` | ref → User, required | student who shared the code |
| `referee` | ref → User, required | student who used the code |
| `coupon` | ref → Coupon, required | which code was used |
| `course` | ref → Course, required | course enrolled in |
| `enrollment` | ref → Enrollment, required | |
| `payment` | ref → Payment, required | |
| `discountGiven` | Number, required | amount referee saved (PKR/USD) |
| `rewardAmount` | Number, required | amount referrer earned |
| `status` | enum: `pending` \| `credited` \| `paid_out`, default `pending` | |
| `creditedAt` | Date, nullable | when wallet was credited |

**Indexes:** `referrer + status`, `referee`, `payment` (unique — one reward per payment)

---

### `ReferralWallet` (`server/src/models/referral-wallet.model.js`)

One document per student. Auto-created on first referral reward.

| Field | Type | Notes |
|---|---|---|
| `student` | ref → User, unique, required | |
| `balance` | Number, default 0 | current withdrawable balance |
| `totalEarned` | Number, default 0 | lifetime earned |
| `totalPaidOut` | Number, default 0 | lifetime withdrawals |
| `transactions` | Array | `{ type: 'credit'\|'debit', amount, description, date }` |

---

### `PayoutRequest` (`server/src/models/payout-request.model.js`)

Separate collection (not embedded) so admin can query all requests across all students efficiently.

| Field | Type | Notes |
|---|---|---|
| `student` | ref → User, required | |
| `wallet` | ref → ReferralWallet, required | |
| `amount` | Number, required | requested amount |
| `status` | enum: `pending` \| `approved` \| `rejected`, default `pending` | |
| `adminNote` | String, nullable | admin's note on approval/rejection |
| `processedAt` | Date, nullable | when admin acted |

**Constraint:** Only one payout request can be in `pending` status at a time per student.

---

### `Payment` model extension

Add two fields to the existing `paymentSchema`:
- `coupon` — `ref → Coupon`, nullable
- `discountApplied` — `Number`, default 0 (the PKR/USD amount discounted)

---

### `SiteSettings` extension

Add `referral` sub-document to the existing site settings schema:

```js
referral: {
  enabled: { type: Boolean, default: false },
  refereeDiscountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  refereeDiscountValue: { type: Number, default: 0 },  // e.g. 15 = 15% off for new student
  referrerRewardType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  referrerRewardValue: { type: Number, default: 0 },   // e.g. 10 = 10% of course price for referrer
}
```

---

## Section 2 — Backend API

### Coupon routes — `/api/v1/coupons`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/` | admin | Create manual coupon |
| `GET` | `/` | admin | List all coupons (paginated, filterable) |
| `GET` | `/:id` | admin | Get single coupon |
| `PATCH` | `/:id` | admin | Update coupon (toggle active, edit limits/expiry) |
| `DELETE` | `/:id` | admin | Delete coupon |
| `POST` | `/validate` | student | Validate code at enrollment — returns discount info |

**Validate response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountType": "percentage",
    "discountValue": 15,
    "discountAmount": 750,
    "finalPrice": 4250,
    "couponId": "..."
  }
}
```

---

### Referral routes — `/api/v1/referrals`

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/generate` | student | Generate referral code — idempotent (returns existing if already generated) |
| `GET` | `/my-codes` | student | Get all my referral codes (general + per-course) |
| `GET` | `/my-rewards` | student | Get my reward history |
| `GET` | `/my-wallet` | student | Get wallet balance + transactions + payout requests |
| `POST` | `/payout-request` | student | Request a payout (blocked if one already pending) |
| `GET` | `/` | admin | List all referral rewards (all students, paginated) |
| `GET` | `/payout-requests` | admin | List all payout requests (filterable by status) |
| `PATCH` | `/payout-requests/:requestId` | admin | Approve / reject payout request |
| `GET` | `/settings` | admin | Get referral settings from SiteSettings |
| `PATCH` | `/settings` | admin | Update referral settings |
| `GET` | `/public-settings` | public | Get referral rates for "How It Works" display (no auth required) |

**Generate request body:**
```json
{ "courseId": "optional — omit for general code" }
```

---

### Business Logic Hooks

#### Referral code generation (`POST /referrals/generate`)
1. Check if a `Coupon` with `source: referral`, `referrer: req.user.id`, `course: courseId` already exists → return it (idempotent)
2. If not, read referral settings from SiteSettings
3. Create `Coupon` with `source: referral`, `discountType/Value` from settings, `scope: course` (or `platform` if no courseId), `maxUses: null` (unlimited), `expiresAt: null`
4. Return the coupon code + shareable URL: `{CLIENT_URL}/courses/{courseId}?coupon={code}` or `{CLIENT_URL}/courses?coupon={code}`

#### Coupon validation at enrollment (`POST /coupons/validate`)
Checks in order:
1. Code exists
2. `isActive === true`
3. Not expired (`expiresAt` is null or > now)
4. Not exceeded max uses (`maxUses` is null or `usedCount < maxUses`)
5. Scope check: if `scope: course`, verify `courseId` matches
6. Calculate discount amount based on course price and discount type/value
7. Return discount details

#### Payment creation — coupon attachment
On `createPayment` (existing controller), if `couponCode` in request body:
- Re-validate coupon server-side (same checks as above)
- Attach `coupon` ref and `discountApplied` amount to the Payment document

#### Payment approval — reward crediting
On `approvePayment` (existing admin controller), after status update:
- If `payment.coupon` exists and coupon `source === 'referral'`:
  1. Read referral settings for reward calculation
  2. Calculate `rewardAmount` = referrerRewardValue% of original course price (or fixed amount)
  3. Upsert `ReferralWallet` for referrer: increment `balance` and `totalEarned`, push credit transaction
  4. Create `ReferralReward` record with `status: credited`
  5. Increment `coupon.usedCount`

#### Payout approval (`PATCH /referrals/payout-requests/:requestId`)
- Admin approves → deduct amount from wallet `balance`, increment `totalPaidOut`, push debit transaction, update request status to `approved`
- Admin rejects → update request status to `rejected`, optionally add `adminNote`

---

## Section 3 — Frontend: Admin Dashboard

### New page: `AdminReferrals.tsx`
Added to admin sidebar nav. Four tabs:

#### Tab 1 — Coupon Codes
- Table columns: Code, Type (manual/referral), Discount, Scope, Uses (used/max), Expiry, Status toggle, Delete
- "Create Coupon" button → modal:
  - Code input (auto-generate button available)
  - Discount type: percentage | fixed
  - Discount value
  - Scope: platform-wide | course-specific (course picker if course-specific)
  - Max uses (optional)
  - Expiry date (optional)
- Search bar + filter by type (manual/referral), status (active/inactive), scope

#### Tab 2 — Referral Settings
- Enable/disable toggle for the entire referral system
- Referee discount: type selector + value input with live preview ("New student gets X% off")
- Referrer reward: type selector + value input with live preview ("Referrer earns Y% of course price")
- Save button with success feedback

#### Tab 3 — Referral Rewards
- Read-only table: Referrer, Referee, Course, Discount Given, Reward Earned, Status, Date
- Filter by status: all / pending / credited / paid_out
- Shows all reward events across all students

#### Tab 4 — Payout Requests
- Table: Student, Wallet Balance, Requested Amount, Date, Status
- Approve button → confirmation modal with optional admin note
- Reject button → modal with required reason
- Filter by status

---

## Section 4 — Frontend: Student Dashboard

### New page: `StudentReferrals.tsx`
Added to student sidebar nav. Four sections stacked vertically:

#### Section 1 — How It Works
Info banner (non-dismissable): "Share your link → New student gets **X% off** → You earn **Y% of course price** after they pay." Values fetched live from a public referral settings endpoint. Hidden if referral system is disabled by admin.

#### Section 2 — Your Wallet
- Balance card: current balance, total earned, total paid out
- Transaction history list (credit/debit with description and date)
- "Request Payout" button → modal with amount input (min: 1, max: balance), confirmation
- If a payout request is pending: show status badge, disable request button

#### Section 3 — Your Referral Codes
Two sub-sections:
- **General code:** One card with the code, copy-to-clipboard button, shareable URL. Auto-generated on page load if it doesn't exist yet (silent API call).
- **Per-course codes:** Course dropdown (student's enrolled courses) → "Generate Link" button → shows code + URL with copy button. Lists all previously generated per-course codes in a table below.

#### Section 4 — Referral History
Table: Referee (name or "Not used yet" for unused codes), Course, Discount Given, Your Reward, Status (pending/credited/paid out), Date. Empty state with illustration if no referrals yet.

---

## Section 5 — Enrollment Integration

### Coupon input at payment submission

**`PaymentSubmitModal.tsx` changes:**
- Add "Have a coupon code?" collapsible section below the amount field
- On code input (debounced 500ms) → call `POST /api/v1/coupons/validate`
- Show inline feedback:
  - Loading spinner during validation
  - Green: "Code applied! PKR 5000 → PKR 4250 (15% off)"
  - Red: "Invalid code", "Code expired", "Code not valid for this course"
- Valid code updates the displayed price
- `couponCode` included in payment submission payload

**Payment submission payload extension:**
```json
{
  "courseId": "...",
  "method": "jazzcash",
  "transactionId": "...",
  "screenshotUrl": "...",
  "amount": 4250,
  "couponCode": "SAVE20"
}
```

**Server-side double-validation:** Coupon re-validated on `createPayment` to prevent tampered amounts. The `discountApplied` field is calculated server-side from the original course price, not trusted from client.

---

## File Checklist

### New server files
- `server/src/models/coupon.model.js`
- `server/src/models/referral-reward.model.js`
- `server/src/models/referral-wallet.model.js`
- `server/src/models/payout-request.model.js`
- `server/src/controllers/coupon.controller.js`
- `server/src/controllers/referral.controller.js`
- `server/src/routes/coupon.route.js`
- `server/src/routes/referral.route.js`

### Modified server files
- `server/src/models/payment.model.js` — add `coupon`, `discountApplied` fields
- `server/src/models/site-settings.model.js` — add `referral` sub-document
- `server/src/controllers/payment.controller.js` — coupon attachment on create, reward crediting on approve
- `server/app.js` — register new routes

### New client files
- `client/src/pages/admin/AdminReferrals.tsx`
- `client/src/pages/student/StudentReferrals.tsx`

### Modified client files
- `client/src/pages/student/PaymentSubmitModal.tsx` — coupon input field
- Admin and student sidebar nav — add "Referrals" link
- `client/src/App.tsx` — register new routes

---

## Constraints & Edge Cases

1. **Idempotent code generation** — calling generate twice for same student+course returns existing code, no duplicates
2. **Self-referral prevention** — student cannot use their own referral code
3. **Re-enrollment** — coupon validate checks if student is already enrolled to prevent discount abuse
4. **Reward calculation server-side only** — client sends `couponCode`, server calculates `discountApplied` and `rewardAmount`; amounts are never trusted from client
5. **Referral system disabled** — if admin toggles off, validate endpoint returns invalid for all referral-source coupons (manual coupons still work)
6. **Payout limit** — only one pending payout request per student at a time
7. **Currency** — reward amounts stored in same currency as course price (PKR or USD)
