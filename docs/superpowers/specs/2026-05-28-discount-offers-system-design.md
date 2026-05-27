# Discount Offers Management System — Design Spec

**Date:** 2026-05-28
**Status:** Approved

---

## Overview

Admins can create time-bounded discount offers — either platform-wide (all courses) or for a specific course. These offers are auto-applied: students see struck-through original prices and discounted prices on course listing and detail pages. The admin panel gets an **Offers** tab inside the existing Referrals page plus a scrolling ticker at the top of the admin topbar showing active offer banners.

---

## 1. Data Model

### `offer.model.js` (new)

```js
{
  title:        String,   // e.g. "Eid Sale"
  bannerText:   String,   // e.g. "🎉 Eid Sale — 30% off all courses!"
  discountType: 'percentage' | 'fixed',
  discountValue: Number,  // e.g. 30 (%) or 500 (PKR)
  scope:        'platform' | 'course',
  course:       ObjectId → Course  // required when scope === 'course'
  isActive:     Boolean  (default true)
  startsAt:     Date     (optional — null means no start restriction)
  endsAt:       Date     (optional — null means no end restriction)
  createdBy:    ObjectId → User
}
```

**Effective-offer logic:** An offer is "currently active" if `isActive === true` AND `startsAt` is in the past (or null) AND `endsAt` is in the future (or null).

**Priority:** If both a course-specific offer and a platform-wide offer are active for the same course, the course-specific offer wins (higher specificity).

If multiple platform offers are active, the one with the highest discount value is applied.

---

## 2. Backend

### Routes — `/api/v1/offers`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/active` | public | Returns currently active offers (used by course pages) |
| GET | `/` | admin | Returns all offers (active + inactive) for admin management |
| POST | `/` | admin | Create a new offer |
| PATCH | `/:id` | admin | Update offer (title, discount, active toggle, dates) |
| DELETE | `/:id` | admin | Delete offer |

### Files to create

- `server/src/models/offer.model.js`
- `server/src/controllers/offer.controller.js`
- `server/src/routes/offer.route.js`

### Register in `app.js`

```js
import offerRouter from './src/routes/offer.route.js'
app.use('/api/v1/offers', offerRouter)
```

### Shared utility — `getEffectivePrice(courseId, offers)`

A pure helper function (in `server/src/utils/offerUtils.js`) that takes a course ID and an array of active offers and returns `{ originalPrice, discountedPrice, offer }`. Used in:
- The public `GET /active` response (pre-computes per-course prices)
- Payment submission validation

### Payment validation

In `payment.controller.js`, when a student submits a payment, the server:
1. Fetches active offers
2. Calls `getEffectivePrice(courseId, offers)`
3. Validates that the submitted amount matches the discounted price (within a tolerance of PKR 1 for floating point)
4. If validation fails, returns `400` with a message to refresh and retry

---

## 3. Admin UI

### Offers tab in `AdminReferrals.tsx`

Add a fifth tab `{ key: 'offers', label: 'Offers & Discounts', Icon: Percent }` to the existing tab strip.

**OffersTab component** renders:
- "Create Offer" button → opens `CreateOfferModal`
- Table of all offers (title, type, discount, scope, dates, status, edit/delete actions)
- Toggle active/inactive per row

**CreateOfferModal / EditOfferModal** fields:
- Title (text)
- Banner Text (text — shown in ticker)
- Discount Type (percentage / fixed)
- Discount Value (number)
- Scope (platform / specific course)
- Course selector (shown only when scope = course)
- Start Date (optional)
- End Date (optional)
- Active toggle

### Admin topbar ticker — `AdminPage.tsx`

A `<OffersMarquee />` component rendered **above** the `<header>` topbar. It:
- Fetches `GET /api/v1/offers/active` on mount
- Only renders when there are ≥1 active offers with a non-empty `bannerText`
- Uses CSS `@keyframes marquee` for infinite left-scroll (no extra library)
- Height: 32px, bg: `violet-600`, white text, small `Percent` icon before each item
- Items are separated by a `·` divider
- Clicking an item navigates to `/admin/referrals`

### New frontend service

Add `offersService` in `client/src/services/offers.service.ts`:
```ts
getActiveOffers()        // GET /api/v1/offers/active
getAdminOffers()         // GET /api/v1/offers (admin)
createOffer(data)        // POST /api/v1/offers
updateOffer(id, data)    // PATCH /api/v1/offers/:id
deleteOffer(id)          // DELETE /api/v1/offers/:id
```

---

## 4. Student-Facing Price Display

### Utility — `getDiscountedPrice(course, offers)`

Pure client-side helper in `client/src/utils/offerUtils.ts`:
- Takes a course object and the array of active offers
- Returns `{ originalPrice, discountedPrice, discountLabel, hasDiscount }`
- Mirrors the server-side logic for consistency

### Components updated

**`CoursesPage.tsx` and course card components:**
- On mount, fetch active offers from `offersService.getActiveOffers()`
- Pass offers array down to course cards
- Course card shows:
  ```
  PKR 3,500    PKR 5,000    [30% OFF]
              (strikethrough)
  ```

**`CourseDetailsPage.tsx`:**
- Same fetch on mount
- Shows discounted price + badge in the enrollment/payment section

**Payment submission modal (wherever it lives):**
- Pre-fills the amount field with the discounted price
- Shows a note: "Eid Sale — 30% off applied"

---

## 5. Scope & Constraints

- Offers and coupons are independent systems. Both can be active simultaneously; the coupon discount is applied on top of the offer discount at payment time (offer first, then coupon).
- No student-facing offers listing page in this scope — prices just reflect automatically.
- No push notifications when an offer goes live in this scope.
- `discountValue` for `fixed` type cannot exceed the course price (validated server-side).
- `discountValue` for `percentage` type cannot exceed 100 (validated server-side).

---

## 6. Files Changed / Created

### New files
| Path | Purpose |
|------|---------|
| `server/src/models/offer.model.js` | Mongoose model |
| `server/src/controllers/offer.controller.js` | CRUD handlers |
| `server/src/routes/offer.route.js` | Express router |
| `server/src/utils/offerUtils.js` | `getEffectivePrice` helper |
| `client/src/services/offers.service.ts` | Frontend API calls |
| `client/src/utils/offerUtils.ts` | `getDiscountedPrice` helper |

### Modified files
| Path | Change |
|------|--------|
| `server/app.js` | Register `/api/v1/offers` route |
| `server/src/controllers/payment.controller.js` | Validate discounted price on submission |
| `client/src/pages/AdminPage.tsx` | Add `<OffersMarquee />` above topbar |
| `client/src/pages/admin/AdminReferrals.tsx` | Add Offers tab + OffersTab component |
| `client/src/pages/CoursesPage.tsx` | Fetch offers, pass to course cards |
| `client/src/pages/CourseDetailsPage.tsx` | Fetch offers, show discounted price |
