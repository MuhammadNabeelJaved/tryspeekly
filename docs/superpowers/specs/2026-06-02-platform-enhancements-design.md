# Platform Enhancements Design
**Date:** 2026-06-02  
**Status:** Approved  
**Scope:** 5 independent subsystems delivered in priority order

---

## Overview

Five enhancement systems for the English Learning Platform:

1. Team Member CRUD Access + Activity Tracking
2. Guided Tours (all dashboards)
3. Search Page Updates
4. Newsletter Advanced Features
5. SEO for Google Ranking (meta injection + sitemap + robots.txt)

---

## System 1 — Team Member CRUD Access + Activity Tracking

### Problem
Some admin routes still use `authorize('admin')` for operations team members should be able to perform. There is zero visibility into what team members do on the platform.

### ActivityLog Model (`server/src/models/activity-log.model.js`)

```js
{
  teamMember:   { type: ObjectId, ref: 'User', required: true },
  action:       { type: String, enum: ['create','update','delete','approve','reject','send','other'], required: true },
  resource:     { type: String, required: true },   // 'blog', 'review', 'payment', 'certificate', etc.
  resourceId:   { type: ObjectId, default: null },
  resourceName: { type: String, default: '' },       // human-readable label
  details:      { type: String, default: '' },       // e.g. "Status: pending → approved"
  ip:           { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now }
}
// Indexes: { teamMember: 1, createdAt: -1 }, { resource: 1, createdAt: -1 }
```

### `logActivity` Middleware (`server/src/middlewares/activityLogger.js`)

- HOF: `logActivity(action, resource, getNameFn?)` returns an Express middleware
- Wraps `res.json` to intercept the outgoing response
- On 2xx response: creates ActivityLog entry using `req.user._id`, the action, resource, and optional `getNameFn(req, responseData)` to derive `resourceName` and `details`
- On non-2xx: skips logging
- Only logs when `req.user.role === 'team_member'` (admins are not tracked — they own the platform)
- Fire-and-forget (no await) so it never slows the response

### Route Audit

Every team-accessible route that currently uses `authorize('admin')` is changed to `authorizeTeamPage(permissionName)`. Routes added in this session (bulk delete for certificates, support, contacts, financial aid, newsletter) all need this review.

Routes that must stay admin-only: user role changes, block/unblock users, site settings, geo-access toggles.

`logActivity` middleware is injected into these resource types:
- Blog: create, update, delete
- Reviews: update status (approve/reject)
- Payments: approve, reject
- Certificates: revoke, delete, bulk delete
- Financial Aid: update status, delete, bulk delete
- Support: reply, update status, delete, bulk delete
- Contacts: update, delete, bulk delete
- Newsletter: create campaign, send campaign, delete subscriber, bulk delete
- SEO: update any page
- CMS: update any section
- Announcements/Notifications: create, delete

### ActivityLog API (`server/src/routes/activity-log.route.js`)

```
GET /api/v1/activity-logs                  admin only — paginated list
  ?page, ?limit, ?teamMember, ?resource, ?startDate, ?endDate

GET /api/v1/activity-logs/summary          admin only — counts per team member (last 30 days)
```

### Admin UI Changes

**AdminTeam.tsx** — new "Activity" tab:
- Paginated table: Avatar + name | Action badge | Resource | Details | Time (relative)
- Filters: team member dropdown, resource type, date range
- Empty state for new team members

**Per-resource "last edited" badge:**
- A small `LastEditedBadge` component queries the ActivityLog for the most recent entry for a given resourceId
- Used on: blog post cards, review rows, certificate rows, payment rows
- Shows: "Edited by [name] · 2h ago" in muted text below the row

---

## System 2 — Guided Tours (All Dashboards)

### Library: `driver.js` v1.x
- Zero React dependency, 28kb gzipped
- Install: `npm install driver.js`

### `useTour(tourKey, steps)` Hook (`client/src/hooks/useTour.ts`)
- Reads `localStorage.getItem('tour_done_${tourKey}')` — if absent, auto-starts on mount after 1s delay
- Exposes `startTour()` for manual re-launch
- Marks done in localStorage on completion or skip

### Tour Definitions (`client/src/tours/`)
One file per dashboard:

| File | Key | Steps |
|---|---|---|
| `adminTour.ts` | `admin_v2` | Overview → Bulk-select payments → Financial Aid delete → Certificates → Referrals payout → SEO score → Newsletter stats → Team activity |
| `teamTour.ts` | `team_v2` | Their permitted pages → how to edit/delete → where activity is tracked |
| `studentTour.ts` | `student_v2` | Courses → Pay → Referrals (earn rewards) → Certificates (download) |
| `teacherTour.ts` | `teacher_v2` | Live classes schedule → Students list → Salary requests |

### "?" Help Button
- Added to every dashboard's top-right header area
- Clicking re-launches the tour for that dashboard
- Icon: `Question` from phosphor-icons

### Tour Step Anatomy
Each step: `{ element: '#css-selector', popover: { title, description, side } }`
Steps target existing DOM elements via stable `id` or `data-tour` attributes added to key UI elements.

---

## System 3 — Search Page Updates

### Admin Search (`client/src/pages/AdminPage.tsx`)
Missing items added to `ADMIN_SEARCH_ITEMS`:
- **Payments Setup** → `/admin/payments-setup`
- **Team Activity** → `/admin/team` (description: "View team member activity logs")

### Student Dashboard Search
Add to student `DashboardSearch` items:
- Referrals (earn rewards by sharing codes)
- Certificates (download and share)
- Financial Aid (apply for free course access)

### Teacher Dashboard Search
Add:
- Salary Requests
- Student Progress

### Team Dashboard Search
Add:
- Activity Log shortcut (opens AdminTeam activity tab via deep-link)

---

## System 4 — Newsletter Advanced Features

### Subscriber Stats Header
Two summary cards added above the subscriber table:
- **Total / Active / Unsubscribed** (counts, computed from paginated total + status counts)
- **This Month** — new subscribers added in the current calendar month

Server: `GET /api/v1/newsletter/stats` — returns `{ total, active, unsubscribed, thisMonth }`

### Subscriber Growth Chart
- Monthly bar chart using the existing `recharts` package (already in project or add it)
- Server: `GET /api/v1/newsletter/growth` — aggregation pipeline groups subscribers by `subscribedAt` month, last 6 months
- Displayed as a simple bar chart on the Subscribers tab

### Export CSV
- Client-side: fetches all subscribers (no pagination, limit=9999), builds CSV string, triggers download
- Button: "Export CSV" in the subscriber tab header
- Format: `email,status,subscribedAt`

### Campaign Delivery Stats
- Per-campaign row: show `Sent: 245 / Failed: 3` in the Date column (data already stored in `totalSent`, `totalFailed` on the model)
- No server change needed

---

## System 5 — SEO for Google Ranking

### 5a. Meta Tag Injection into React `<head>`

**Current state:** SEO data stored in MongoDB but never injected into HTML — Google sees nothing.

**Implementation:**
- Public endpoint: `GET /api/v1/seo/page?slug=home` — returns the SEO entry for that slug (no auth)
- `useSEO(slug)` hook (`client/src/hooks/useSEO.ts`):
  - Fetches SEO data for the current page slug on mount
  - Uses `react-helmet-async` (install if not present) to inject into `<head>`:
    - `<title>`, `<meta name="description">`, `<meta name="keywords">`
    - `<meta name="robots">`
    - Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`)
    - Twitter Card tags
    - `<link rel="canonical">`
    - JSON-LD `<script type="application/ld+json">` if schemaMarkup is set
  - Falls back to site default title if no entry exists for the slug
- `HelmetProvider` added to `main.tsx` wrapping the app
- Hook applied to every public page: `Home`, `Courses`, `CourseDetails`, `Blog`, `BlogPost`, `About`, `Contact`, `Privacy`
- Slug mapping: `home`, `courses`, `blog`, `about`, `contact`, `privacy`, `course-detail` (generic for course pages)

### 5b. Global SEO (Title Suffix + Default OG Image)
- `__global__` slug entry in DB stores `titleSuffix` (e.g. `" | EnglishPro Academy"`) and `defaultOgImage`
- `useSEO` hook reads global entry and appends suffix to all page titles

### 5c. `/sitemap.xml` Endpoint (`server/src/routes/seo.route.js`)
```
GET /sitemap.xml   (public, no auth)
```
- Builds XML by combining:
  1. All SEO entries where `sitemap.include = true`, using `pageUrl`, `sitemap.priority`, `sitemap.changeFreq`
  2. All published blog posts with `slug` → `/blog/:slug`
  3. All published courses with `_id` → `/courses/:id`
- Returns `Content-Type: application/xml`

### 5d. `/robots.txt` Endpoint
```
GET /robots.txt   (public, no auth)
```
- Returns the `global.robotsTxt` string from the `__global__` SEO entry
- Falls back to a sensible default if not set

### 5e. SEO Score Dashboard (existing page enhancement)
- The existing `AdminSEO.tsx` already calculates a score per page
- Enhancement: add a **"Site SEO Health"** summary card at the top:
  - Count of pages with score ≥ 80 (Good), 50–79 (Needs work), < 50 (Poor)
  - Quick-fix suggestions for the lowest-scoring page

### 5f. Structured Data Templates
- In the Schema tab of AdminSEO, add template buttons:
  - **FAQ** — generates FAQ JSON-LD from an array of Q&A pairs with a simple UI
  - **Course** — generates Course JSON-LD (name, description, provider, url)
  - **Organization** — generates Organization JSON-LD (name, url, logo, contactPoint)
- Templates pre-fill the `schemaMarkup` textarea on click

### 5g. Google Search Console
- The `global.googleSiteVerification` field already exists in the model
- `useSEO` on any public page injects `<meta name="google-site-verification" content="...">` from the global entry
- AdminSEO Global tab shows a help text: "After saving, submit `https://yoursite.com/sitemap.xml` to Google Search Console"

---

## Implementation Order

1. **ActivityLog model + middleware + routes** (server)
2. **Route audit** — change `authorize('admin')` → `authorizeTeamPage(...)` where appropriate, inject `logActivity`
3. **AdminTeam Activity tab** (client)
4. **LastEditedBadge** component (client)
5. **Install driver.js**, create `useTour` hook + tour definitions
6. **Add "?" Help button** to all dashboard headers
7. **Search updates** — add missing items to all dashboard search lists
8. **Newsletter stats endpoint + growth endpoint** (server)
9. **Newsletter stats header + growth chart + CSV export** (client)
10. **Install react-helmet-async**, create `useSEO` hook
11. **Apply `useSEO`** to all public pages
12. **`/sitemap.xml` and `/robots.txt` Express routes**
13. **SEO score summary card** (AdminSEO enhancement)
14. **Structured data templates** (AdminSEO Schema tab)

---

## Constraints & Non-Goals

- Activity log does NOT track admin actions (admins own the platform)
- Open-rate email tracking is out of scope (requires tracking pixel infra)
- No SSR/pre-rendering — meta tags are client-side injected (React app); this means Googlebot must render JS. This is fine for modern Google crawling but not ideal for social sharing previews. A future improvement would be a server-side render layer.
- Tour steps target existing elements via `data-tour` attributes — no visual redesign
- CSV export is client-side (no streaming for very large lists)
