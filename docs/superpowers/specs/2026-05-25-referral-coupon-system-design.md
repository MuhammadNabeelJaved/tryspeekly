# Referral & Coupon Code Management System — Design Spec

**Date:** 2026-05-25
**Status:** Approved

---

## Overview

A full referral and coupon code management system for the English LMS platform. Students can refer others to any course they are enrolled in. Referred students receive an automatic discount at enrollment. Referring students earn a wallet reward when the referred student's payment is approved. Admins manage all referral settings, coupon codes, and wallet payouts through the admin dashboard.

---

## 1. Database Models

### 1.1 New Model: `Coupon` (`coupon.model.js`)

| Field | Type | Notes |
|---|---|---|
| `code` | String | unique, uppercase, trimmed |
| `discountType` | enum | `'percentage'` \| `'flat'` |
| `discountValue` | Number | 10 = 10% or PKR/USD 10 |
| `maxUses` | Number | `null` = unlimited |
| `usedCount` | Number | default `0` |
| `expiresAt` | Date | `null` = never expires |
| `applicableTo` | `[ObjectId→Course]` | empty array = all courses |
| `isActive` | Boolean | default `true` |
| `createdBy` | ObjectId→User | admin who created it |

Indexes: `code` (unique), `expiresAt`, `isActive`.

### 1.2 New Model: `Referral` (`referral.model.js`)

| Field | Type | Notes |
|---|---|---|
| `referrer` | ObjectId→User | the student who shared the code |
| `referred` | ObjectId→User | the new enrolling student |
| `course` | ObjectId→Course | the course being referred |
| `status` | enum | `'pending'` \| `'rewarded'` \| `'expired'` |
| `discountGiven` | Number | PKR/USD discount the referred student received |
| `rewardAmount` | Number | PKR/USD credit earned by the referrer |
| `payment` | ObjectId→Payment | payment that triggered the reward (set on approve) |
| `couponCode` | String | the referral code string that was used |

Indexes: `referrer`, `referred + course` (unique — one referral per student per course).

### 1.3 New Model: `WalletTransaction` (`wallet-transaction.model.js`)

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId→User | owner of the wallet |
| `type` | enum | `'referral_reward'` \| `'manual_payout'` \| `'used_as_discount'` |
| `amount` | Number | positive = credit, negative = debit |
| `referral` | ObjectId→Referral | set when `type = referral_reward` |
| `payment` | ObjectId→Payment | set when `type = used_as_discount` or `manual_payout` |
| `note` | String | admin note (manual payout) |
| `createdBy` | ObjectId→User | admin id for admin-created entries |

Index: `user`, `createdAt`.

### 1.4 Modified: `User` model

Add two fields:
- `walletBalance: { type: Number, default: 0, min: 0 }` — accumulated credit
- `referralCode: { type: String, unique: true, sparse: true }` — auto-generated on account creation (first 5 chars of name uppercased + 4-digit random, e.g. `NABEE1234`). Generated in a `pre('save')` hook only when not yet set.

### 1.5 Modified: `Course` model

Add optional per-course referral override:
```js
referralOverride: {
  discountPct: { type: Number, min: 0, max: 100 },
  rewardPct:   { type: Number, min: 0, max: 100 },
}
```
When present, these values override the global `referralSettings` for this course.

### 1.6 Modified: `Payment` model

Add discount tracking fields:
```js
discountAmount: { type: Number, default: 0, min: 0 }
finalAmount:    { type: Number, min: 0 }      // amount - discountAmount
couponUsed:     { type: Schema.Types.ObjectId, ref: 'Coupon' }
referralUsed:   { type: Schema.Types.ObjectId, ref: 'Referral' }
walletUsed:     { type: Number, default: 0 }  // wallet credit applied to this payment
```

### 1.7 Modified: `SiteSettings` model

Add global referral configuration:
```js
referralSettings: {
  isEnabled:   { type: Boolean, default: true },
  discountPct: { type: Number, default: 10, min: 0, max: 100 },  // for referred student
  rewardPct:   { type: Number, default: 5,  min: 0, max: 100 },  // for referrer
}
```

---

## 2. API Endpoints

### 2.1 Referral Settings — Admin

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/referrals/settings` | Get global referral settings |
| `PATCH` | `/api/v1/referrals/settings` | Update global discountPct, rewardPct, isEnabled |

### 2.2 Referral Code — Student

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/referrals/my-code` | Own referral code + stats (total referred, total earned, pending) |
| `GET` | `/api/v1/referrals/validate` | `?code=NABEE1234&courseId=xxx` — validate code, return discount amount |

### 2.3 Referral History — Admin

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/referrals` | List all referrals, paginated, filterable by status |
| `GET` | `/api/v1/referrals/:id` | Single referral detail |

### 2.4 Coupons — Admin

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/coupons` | List all coupons, paginated |
| `POST` | `/api/v1/coupons` | Create coupon |
| `GET` | `/api/v1/coupons/:id` | Single coupon detail |
| `PATCH` | `/api/v1/coupons/:id` | Update coupon |
| `DELETE` | `/api/v1/coupons/:id` | Delete coupon |
| `POST` | `/api/v1/coupons/validate` | `{ code, courseId }` — validate + return discount |

### 2.5 Wallet — Student + Admin

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/wallet/my` | Student's own balance + transaction history |
| `GET` | `/api/v1/wallet/user/:userId` | Admin: view any student's wallet |
| `POST` | `/api/v1/wallet/payout/:userId` | Admin: mark manual payout (deducts balance, creates WalletTransaction) |

### 2.6 Modified: Payment Controller

**`createPayment`** — accept optional `couponCode`, `referralCode`, `useWallet` (boolean) in request body:
1. Validate referral code (check referrer is enrolled in the course, code belongs to a different student)
2. Validate coupon code (active, not expired, not over limit, applicable to this course)
3. Calculate `discountAmount` = coupon discount + referral discount (stacked)
4. If `useWallet`, deduct up to available `walletBalance` from `finalAmount`
5. Create `Referral` record with `status: 'pending'` if referral code used
6. Increment coupon `usedCount` if coupon used
7. Deduct `walletUsed` from user's `walletBalance` and create `WalletTransaction` if wallet used

**`approvePayment`** — after setting `status: 'approved'`:
1. Check if `payment.referralUsed` exists
2. If yes: calculate `rewardAmount` (rewardPct of `payment.amount`), credit referrer's `walletBalance`, update `Referral.status` to `'rewarded'`, create `WalletTransaction` of type `referral_reward`
3. Send notification to referrer: "You earned PKR X for referring [Student Name] to [Course]!"

---

## 3. Frontend — Admin Dashboard

### 3.1 `AdminPage.tsx` changes

- Add `'referrals' | 'coupons' | 'wallet'` to `AdminView` type
- Add to `NAV_FINANCE` array:
  - `{ view: 'referrals', label: 'Referrals', path: 'referrals', Icon: ShareNetwork }`
  - `{ view: 'coupons',   label: 'Coupons',   path: 'coupons',   Icon: Tag }`
  - `{ view: 'wallet',    label: 'Wallet',    path: 'wallet',    Icon: Wallet }`
- Lazy-load `AdminReferrals`, `AdminCoupons`, `AdminWallet`
- Add entries to `ADMIN_SEARCH_ITEMS`

### 3.2 `AdminReferrals.tsx`

Two tabs:

**Settings tab:**
- Global toggle: enable/disable referral system
- Number input: "Discount for referred student (%)"
- Number input: "Reward for referrer (%)"
- Save button (PATCH `/api/v1/referrals/settings`)
- Per-course overrides table: course name, override discount %, override reward %, edit inline

**History tab:**
- Stats row: total referrals, rewarded, pending, total rewards paid out
- Filter by status (all / pending / rewarded / expired)
- Search by referrer or referred student name
- Table columns: Referrer, Referred Student, Course, Discount Given, Reward Amount, Status, Date

### 3.3 `AdminCoupons.tsx`

- Stats row: total coupons, active, expired, total redemptions
- "Create Coupon" button → modal:
  - Code (auto-suggest uppercase, user can edit)
  - Discount type: percentage / flat amount
  - Discount value
  - Max uses (blank = unlimited)
  - Expiry date (blank = never)
  - Applicable courses (multi-select; leave empty = all courses)
  - Active toggle
- Table: Code, Type, Value, Uses (used/max), Expiry, Status, Actions (edit / toggle active / delete)
- Edit inline in modal (same form, pre-filled)

### 3.4 `AdminWallet.tsx`

- Search student by name or email
- On select: show wallet balance + full transaction history (type, amount, date, note)
- "Mark Manual Payout" form: amount, note → POST `/api/v1/wallet/payout/:userId`
- Transaction type badges: referral_reward (green), manual_payout (blue), used_as_discount (orange)

---

## 4. Frontend — Student Dashboard

### 4.1 `StudentDashboardPage.tsx` changes

- Add `'referrals' | 'wallet'` to `StudentView` type
- Add sidebar entries for Referrals and Wallet

### 4.2 `StudentReferrals.tsx`

Three sections:

**My Referral Code:**
- Large code display box with copy-to-clipboard button
- "Share" button copies `<CLIENT_URL>/?ref=NABEE1234`
- Stats: total referred, total earned, pending rewards

**Course Referral Links:**
- List of enrolled courses (only active enrollments)
- Each row: course name + "Copy link" button → `<CLIENT_URL>/courses/:id?ref=NABEE1234`

**Referral History:**
- Table: Referred Student, Course, Status, Discount Given to Them, Your Reward, Date

### 4.3 `StudentWallet.tsx`

- Balance card (large number, with currency)
- Transaction history list: type icon, description, amount (+/-), date
- Note: wallet balance can be applied at payment time (shown in PaymentSubmitModal)

### 4.4 `StudentOverview.tsx` change

- Add a "Wallet" card to the overview stats row showing current balance with "View details" link

### 4.5 `PaymentSubmitModal.tsx` changes

- Add optional "Referral Code" text input — on blur, validate via `GET /api/v1/referrals/validate`
- Add optional "Coupon Code" text input — on blur, validate via `POST /api/v1/coupons/validate`
- Add "Use Wallet Balance" toggle (shows available balance) — if toggled, applies wallet credit
- Show discount breakdown before submission:
  - Original price
  - Referral discount (if applied)
  - Coupon discount (if applied)
  - Wallet credit used (if applied)
  - **Final amount** (bold)
- Stacking rule: coupon + referral both apply; wallet applies after both

---

## 5. Discount Calculation Logic

```
discountAmount = 0

if referralCode valid:
  referralDiscount = course.price * (referralOverride.discountPct ?? globalSettings.discountPct) / 100
  discountAmount += referralDiscount

if couponCode valid:
  if coupon.discountType === 'percentage':
    couponDiscount = course.price * coupon.discountValue / 100
  else:
    couponDiscount = coupon.discountValue
  discountAmount += couponDiscount

subtotal = course.price - discountAmount  (min 0)

if useWallet:
  walletUsed = min(user.walletBalance, subtotal)
  finalAmount = subtotal - walletUsed
else:
  walletUsed = 0
  finalAmount = subtotal
```

---

## 6. Business Rules

1. A student cannot use their own referral code.
2. A referral code is only valid for courses the referrer is actively enrolled in.
3. Each student can only use one referral code per course (one `Referral` record per `referred + course`).
4. A coupon's `usedCount` increments on payment creation (not approval) to prevent abuse.
5. Wallet reward is only credited after payment approval, not on submission.
6. If a payment is rejected after approval (re-rejected), the referral reward is NOT reversed automatically — admin must manually payout correct amounts.
7. Coupons and referrals can be stacked; wallet credit applies on top of both.
8. Wallet balance cannot go below zero.

---

## 7. Notifications

| Trigger | Recipient | Message |
|---|---|---|
| Payment approved + referral used | Referrer | "You earned PKR X for referring [Name] to [Course]!" |
| Referral code validated successfully | Referred student | (inline UI feedback only, no push notification) |
| Manual payout processed | Student | "Admin has processed a manual payout of PKR X to your account." |

---

## 8. File Checklist

### Server (new files)
- `server/src/models/coupon.model.js`
- `server/src/models/referral.model.js`
- `server/src/models/wallet-transaction.model.js`
- `server/src/controllers/coupon.controller.js`
- `server/src/controllers/referral.controller.js`
- `server/src/controllers/wallet.controller.js`
- `server/src/routes/coupon.route.js`
- `server/src/routes/referral.route.js`
- `server/src/routes/wallet.route.js`

### Server (modified files)
- `server/src/models/user.model.js` — add `walletBalance`, `referralCode`
- `server/src/models/course.model.js` — add `referralOverride`
- `server/src/models/payment.model.js` — add discount fields
- `server/src/models/site-settings.model.js` — add `referralSettings`
- `server/src/controllers/payment.controller.js` — discount logic in createPayment + reward logic in approvePayment
- `server/app.js` — register three new routes

### Client (new files)
- `client/src/pages/admin/AdminReferrals.tsx`
- `client/src/pages/admin/AdminCoupons.tsx`
- `client/src/pages/admin/AdminWallet.tsx`
- `client/src/pages/student/StudentReferrals.tsx`
- `client/src/pages/student/StudentWallet.tsx`
- `client/src/services/referrals.service.ts`
- `client/src/services/coupons.service.ts`
- `client/src/services/wallet.service.ts`

### Client (modified files)
- `client/src/pages/AdminPage.tsx` — new nav items + views
- `client/src/pages/StudentDashboardPage.tsx` — new nav items + views
- `client/src/pages/student/StudentOverview.tsx` — wallet balance card
- `client/src/pages/student/PaymentSubmitModal.tsx` — referral + coupon + wallet inputs
- `client/src/types/api.ts` — new types for Coupon, Referral, WalletTransaction
