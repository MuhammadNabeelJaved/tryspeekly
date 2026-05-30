# Newsletter Management System — Design Spec

**Date:** 2026-05-30  
**Status:** Approved  

---

## Overview

A full newsletter management system for the EnglishPro LMS. Visitors subscribe via the footer form; admins compose campaigns with a rich text editor, schedule or send immediately, and manage the subscriber list from the admin panel. One-click unsubscribe is included in every campaign email.

---

## Architecture

Follows the existing project pattern: one model + one controller + one route file per resource.

```
server/src/models/
  newsletter-subscriber.model.js
  newsletter-campaign.model.js

server/src/controllers/
  newsletter-subscriber.controller.js
  newsletter-campaign.controller.js

server/src/routes/
  newsletter.route.js          ← single route file, mounts both controllers

client/src/
  pages/admin/AdminNewsletter.tsx
  services/newsletter.service.ts
  pages/UnsubscribePage.tsx    ← public, no auth
```

---

## Data Models

### `newsletter-subscriber`

| Field           | Type     | Notes                                          |
|-----------------|----------|------------------------------------------------|
| `email`         | String   | unique, required, lowercase                    |
| `status`        | String   | enum: `active` \| `unsubscribed`, default: `active` |
| `token`         | String   | unique UUID — used in unsubscribe URL          |
| `subscribedAt`  | Date     | default: `Date.now`                            |
| `unsubscribedAt`| Date     | nullable, set when unsubscribed                |

### `newsletter-campaign`

| Field          | Type     | Notes                                           |
|----------------|----------|-------------------------------------------------|
| `subject`      | String   | required                                        |
| `htmlBody`     | String   | required — rich text HTML from TipTap           |
| `status`       | String   | enum: `draft` \| `scheduled` \| `sending` \| `sent` \| `failed`, default: `draft` |
| `scheduledAt`  | Date     | nullable — if set with `status: scheduled`, auto-sent by scheduler |
| `sentAt`       | Date     | nullable — set when dispatch completes          |
| `totalSent`    | Number   | default: 0                                      |
| `totalFailed`  | Number   | default: 0                                      |
| `createdBy`    | ObjectId | ref: User                                       |

---

## API Routes

All mounted at `/api/v1/newsletter`.

### Subscriber endpoints

| Method | Path                                    | Auth   | Description                                 |
|--------|-----------------------------------------|--------|---------------------------------------------|
| POST   | `/subscribers`                          | public | Subscribe from footer form (rate-limited 5/15min/IP) |
| GET    | `/subscribers`                          | admin  | List all — pagination + search by email     |
| DELETE | `/subscribers/:id`                      | admin  | Hard delete a subscriber                    |
| PATCH  | `/subscribers/:id/unsubscribe`          | admin  | Manually mark unsubscribed                  |
| GET    | `/unsubscribe?token=xx`                 | public | One-click unsubscribe from email link       |

### Campaign endpoints

| Method | Path                        | Auth  | Description                                    |
|--------|-----------------------------|-------|------------------------------------------------|
| GET    | `/campaigns`                | admin | List all campaigns with status + counts        |
| POST   | `/campaigns`                | admin | Create — `status: draft` or `scheduled`        |
| GET    | `/campaigns/:id`            | admin | Get single campaign                            |
| PUT    | `/campaigns/:id`            | admin | Update draft (blocked if status !== draft)     |
| DELETE | `/campaigns/:id`            | admin | Delete draft only                              |
| POST   | `/campaigns/:id/send`       | admin | Dispatch immediately (sets status → sending → sent) |

---

## Email Sending

- Sent directly via Resend (not through the existing template system — content is custom per campaign).
- An unsubscribe footer is appended to every email's `htmlBody` before sending:
  ```html
  <p style="...">
    <a href="{{CLIENT_URL}}/unsubscribe?token={{token}}">Unsubscribe</a>
  </p>
  ```
- Emails dispatched in **batches of 50** with a 200ms delay between batches.
- Each send attempt logged to the existing `EmailLog` model with `type: 'newsletter_campaign'` and campaign ID in `metadata`.
- `totalSent` and `totalFailed` updated after each batch completes.

---

## Scheduler

Added to `server/index.js` as a `setInterval` running every **60 seconds**:

1. Query: `status === 'scheduled' && scheduledAt <= now`
2. Atomically set `status → sending` (prevents double-send on overlap)
3. Fetch all active subscribers
4. Batch-send emails
5. Set `status → sent`, `sentAt → now`, update counts

If sending throws, set `status → failed` so admin can see and retry via the send endpoint.

---

## Frontend

### `Footer.tsx`
- Wire existing `onSubmit` to `POST /api/v1/newsletter/subscribers`
- Toast: "Subscribed! Check your inbox." on success
- Toast: "You're already subscribed." on 409 conflict
- Toast: error message on other failures

### `AdminNewsletter.tsx`
Added to `NAV_COMMUNICATION` in `AdminPage.tsx` (path: `newsletter`, icon: `Newspaper`).

Two tabs:

**Subscribers tab**
- Search bar (by email)
- Table: email, status badge, subscribed date, actions (unsubscribe / delete)
- Total active count chip at top

**Campaigns tab**
- List of campaigns: subject, status badge, scheduled/sent date, sent count
- "New Campaign" button → inline form / modal with:
  - Subject input
  - TipTap rich text editor (bold, italic, underline, links, lists)
  - Schedule toggle: "Send now" vs "Schedule for later" (date+time picker)
  - Buttons: Save Draft / Schedule / Send Now
- Click a campaign to view details (read-only if sent)

### `UnsubscribePage.tsx`
- Public route: `/unsubscribe`
- On mount: calls `GET /api/v1/newsletter/unsubscribe?token=xx`
- Shows: "You've been unsubscribed from EnglishPro newsletters."
- Link back to homepage

### `newsletter.service.ts`
All Axios calls for subscribers and campaigns, following existing service file patterns.

---

## Routing & Navigation

**`AdminPage.tsx` changes:**
- Add `'newsletter'` to `AdminView` type
- Add to `NAV_COMMUNICATION`: `{ view: 'newsletter', label: 'Newsletter', path: 'newsletter', Icon: Newspaper }`
- Lazy-import `AdminNewsletter`
- Add `<Route path="newsletter" element={<AdminNewsletter />} />`

**`App.tsx` changes:**
- Add public route: `<Route path="/unsubscribe" element={<UnsubscribePage />} />`

**`app.js` changes:**
- Import and mount `newsletterRoutes` at `/api/v1/newsletter`

---

## Security & Validation

- Subscribe endpoint: Joi validates email format; 409 on duplicate active subscriber
- Rate limit: dedicated limiter (5 req / 15 min per IP) on `POST /subscribers`
- Unsubscribe token: UUID v4, never guessable, single-use conceptually (idempotent — re-clicking just confirms already unsubscribed)
- Campaign send/delete/update guarded by `authenticate + authorize('admin')`
- Campaign edit blocked server-side if `status` is `sending`, `sent`, or `failed` (only `draft` and `scheduled` are editable)

---

## Out of Scope

- Email open/click tracking
- Subscriber segmentation / tags
- A/B testing
- Bounce handling
- Import subscribers from CSV
