# Reviews & Feedback Feature — Design Spec

**Date:** 2026-05-20  
**Status:** Approved  
**Approach:** Option A — Single `Review` model with `type` field

---

## Overview

Full CRUD reviews/feedback system for the English learning LMS. Covers platform-level reviews (shown on the home page "What our learners say" section) and course-specific reviews (shown on the public CourseDetailsPage and inside the student dashboard). All reviews go through an admin approval workflow before being publicly visible. Admins can also feature specific reviews on the home page.

---

## Data Model

**File:** `server/src/models/review.model.js`

```js
{
  type:          String, enum: ['platform', 'course'], required
  author:        ObjectId ref: User, required
  course:        ObjectId ref: Course (required only when type === 'course')
  rating:        Number, min: 1, max: 5, required
  content:       String, maxlength: 1000, required
  status:        String, enum: ['pending', 'approved', 'rejected'], default: 'pending'
  featuredOnHome: Boolean, default: false
  adminNote:     String (optional — admin rejection/approval note)
  isDeleted:     Boolean, default: false
  timestamps:    createdAt, updatedAt
}
```

**Indexes:**
- Compound unique: `{ author, course }` (sparse — only applies when course is set) — enforces one review per student per course
- `{ status, featuredOnHome }` — fast home page query
- `{ course, status }` — fast course review listing

**Constraints:**
- `course` field is required when `type === 'course'`, forbidden when `type === 'platform'`
- Only `status === 'approved'` documents are served to public endpoints
- `featuredOnHome` can only be `true` on approved reviews (enforced in controller)

---

## API Endpoints

Base: `/api/v1/reviews`

### Public (no auth)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/public` | Approved + featured home page reviews (`featuredOnHome: true`) |
| `GET` | `/course/:courseId` | Approved course reviews for a specific course |

### Authenticated (student or teacher)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Submit a new review (platform or course) |
| `GET` | `/my` | Fetch own reviews |
| `GET` | `/my/course/:courseId` | Check if student already reviewed this course |
| `PATCH` | `/:id` | Edit own review (any status — resets to pending on edit) |
| `DELETE` | `/:id` | Soft-delete own review |

### Admin only
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin` | All reviews with filters (status, type, search, pagination) |
| `PATCH` | `/admin/:id/status` | Approve or reject with optional `adminNote` |
| `PATCH` | `/admin/:id/feature` | Toggle `featuredOnHome` (only works on approved reviews) |
| `DELETE` | `/admin/:id` | Hard delete |

**Business rules enforced server-side:**
- `POST /` with `type: 'course'` requires the requesting user to have an active enrollment where `sessionsAttended >= totalSessions` (course must be complete)
- `POST /` with `type: 'course'` checks for existing review (unique per student per course) — returns `409 Conflict` if already exists
- `type: 'platform'` is available to both `student` and `teacher` roles
- `type: 'course'` is available to `student` role only
- Editing a review resets `status` back to `'pending'` (re-enters approval queue)

---

## Frontend

### New file
- `client/src/services/reviews.service.ts` — typed service wrapping all review API calls
- `client/src/pages/admin/AdminReviews.tsx` — admin management page

### Modified files

**`client/src/components/Reviews.tsx`**
- On mount: fetch from `GET /reviews/public` to replace hardcoded `REVIEWS` array
- Graceful fallback: if API returns 0 featured reviews, show a placeholder message (not an empty marquee)
- "Write a Review" button:
  - Not logged in → `toast.error('Please login to write a review')`
  - Logged in → open modal with `type: 'platform'`
- Modal: user name + profile avatar auto-filled from `AuthContext` (read-only, not editable)
- On success: "Your review has been submitted and is pending approval" toast

**`client/src/pages/CourseDetailsPage.tsx`** (public page)
- New "Student Reviews" section at bottom of page
- Fetches approved reviews from `GET /reviews/course/:courseId`
- Shows star rating, review content, author name + avatar, date
- Empty state: "No reviews yet for this course"

**`client/src/pages/student/StudentCourseDetails.tsx`**
- Course completion condition: `sessionsAttended >= totalSessions`
  - "Join Next Class" button and "Join Live Class" sidebar button → hidden when course is complete
  - New "Leave a Review" button appears alongside "Claim Certificate" card
  - If student already has a review → button label changes to "Edit Your Review", shows their existing review content
- Course-review modal: star selector + textarea, name/avatar auto-filled from auth (read-only)
- On success: pending approval toast

**`client/src/pages/student/StudentCourses.tsx`**
- Completed course cards: show "Reviewed ✓" badge if student has a review for that course

**`client/src/pages/instructor/InstructorOverview.tsx`**
- "Share Your Experience" card/button → opens platform-review modal

**`client/src/pages/admin/AdminReviews.tsx`** (new)
- Table columns: Author, Role, Type (platform/course), Course (if applicable), Rating, Excerpt, Status, Featured, Date, Actions
- Filters: status (All/Pending/Approved/Rejected), type (All/Platform/Course), search by author name
- Per-row actions: Approve, Reject (with note input), Toggle Featured (only on approved), Delete
- Pending reviews count badge in admin sidebar nav item

**Admin sidebar / nav**
- Add "Reviews" link with a badge showing pending count
- Badge fetched from `GET /admin` with `status=pending&limit=1` (use `pagination.total`)

---

## Key UX Rules

1. A student cannot write a course review until `sessionsAttended >= totalSessions` — enforced both UI (button hidden) and server (403 if bypassed)
2. A logged-out user clicking "Write a Review" sees a toast, not a modal
3. Editing any review resets it to `pending` — admin must re-approve
4. `featuredOnHome` toggle is disabled in UI until review is approved
5. "Join Next Class" and "Join Live Class" buttons are hidden (not just disabled) on completed courses
6. The home page marquee shows only `featuredOnHome: true` + `approved` reviews from the database

---

## Files to Create / Modify

### Server (new)
- `server/src/models/review.model.js`
- `server/src/controllers/review.controller.js`
- `server/src/routes/review.route.js`

### Server (modify)
- `server/app.js` — register `/api/v1/reviews` route

### Client (new)
- `client/src/services/reviews.service.ts`
- `client/src/pages/admin/AdminReviews.tsx`

### Client (modify)
- `client/src/components/Reviews.tsx`
- `client/src/pages/CourseDetailsPage.tsx`
- `client/src/pages/student/StudentCourseDetails.tsx`
- `client/src/pages/student/StudentCourses.tsx`
- `client/src/pages/instructor/InstructorOverview.tsx`
- `client/src/types/api.ts` — add `Review`, `ReviewDto`, related types
- Admin sidebar/nav — add Reviews link + pending badge
