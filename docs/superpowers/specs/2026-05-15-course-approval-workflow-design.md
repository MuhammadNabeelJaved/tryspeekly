# Course Approval Workflow — Design Spec
**Date:** 2026-05-15  
**Status:** Approved

---

## Overview

A complete end-to-end course approval pipeline: teacher submits a course → admin reviews and approves or rejects → approved courses appear on the public page → clicking a course shows full real-data details.

---

## Status Flow

```
[Teacher creates] → pending → [Admin approves] → published  (visible publicly)
                           → [Admin rejects]  → rejected   (visible only to teacher)
```

The `draft` status is retained for courses a teacher saves but has not submitted yet. `archived` is retained for admin soft-delete.

---

## Section 1 — Backend

### 1.1 Course Model (`course.model.js`)
- Extend `status` enum: `['draft', 'pending', 'published', 'rejected', 'archived']`
- Default status remains `'draft'`; teacher explicitly submits (sets to `pending`)

### 1.2 Course Controller (`course.controller.js`)

**`createCourse`**
- Teacher creates → status forced to `'pending'` regardless of body payload
- Admin creates → status stays as provided (default `'draft'`)

**`getAllCourses` (public)**
- Strictly returns `status = 'published'` only — no overrides, no exceptions
- Admin uses the dedicated `getAdminCourses` endpoint instead

**`getAdminCourses` (new)**
- `GET /api/v1/courses/admin/all` — admin only
- Returns all courses (any status), paginated, with teacher populated
- Supports `?status=pending`, `?status=published`, etc.

**`reviewCourse` (new)**
- `PATCH /api/v1/courses/:id/review` — admin only
- Body: `{ action: 'approve' | 'reject', reason?: string }`
- `approve` → sets `status = 'published'`
- `reject` → sets `status = 'rejected'`
- After either action → creates an in-app notification on the teacher's User document

### 1.3 Routes (`course.route.js`)
```
GET  /courses/admin/all        authenticate + authorize('admin')  → getAdminCourses
PATCH /courses/:id/review      authenticate + authorize('admin')  → reviewCourse
```

### 1.4 Notification Format (stored in `user.notifications[]`)
```json
{
  "type": "course_approved" | "course_rejected",
  "message": "Your course \"<title>\" has been approved and is now live." 
           | "Your course \"<title>\" was rejected. Reason: <reason>",
  "read": false,
  "createdAt": "<timestamp>"
}
```

---

## Section 2 — Admin Dashboard

### 2.1 AdminCourses.tsx
- Replace local-state-only `handleReviewAction` with real API call to `PATCH /courses/:id/review`
- `useEffect` fetches from `GET /courses/admin/all` (not the public endpoint)
- Pending tab badge shows real live count
- On approve: course moves out of pending tab, toast success, instructor notified
- On reject: same, with optional reason field in the review modal
- Loading and error states on the approve/reject buttons

### 2.2 Pending count in AdminOverview
- Overview stat card "Pending Courses" wired to real pending count from `getAdminCourses`

---

## Section 3 — Instructor Dashboard

### 3.1 InstructorCourses.tsx
- `mapBackendCourse` extended to handle `pending` and `rejected` status
- Status badge: `pending` → amber "Under Review", `rejected` → red "Rejected"
- When creating a course via the form → `coursesService.createCourse()` call (already exists), backend forces `pending`
- After successful create: toast "Course submitted for review"
- Rejected courses show a "Re-submit" button that sets status back to `pending`

### 3.2 `coursesService.ts`
- Add `submitForReview(id)` → `PATCH /courses/:id` with `{ status: 'pending' }`
- Add `reviewCourse(id, action, reason?)` → `PATCH /courses/:id/review` (admin use)
- Add `getAdminCourses(params?)` → `GET /courses/admin/all`

---

## Section 4 — Public Courses Page

No changes needed. `getAllCourses` already defaults to `status=published`. Once admin approves, the course automatically appears.

---

## Section 5 — Course Details Page (`CourseDetailsPage.tsx`)

Currently uses mostly hardcoded dummy data. Wire to real API:

- On mount: `coursesService.getCourseById(id)` 
- Map real fields: `title`, `description`, `price`, `level`, `focus`, `type`, `totalSessions`, `sessionDuration`, `recurringSchedule`, `teacher.name`, `teacher.profileImage`, `teacher.bio`, `thumbnail`, `enrolledStudents.length`, `maxStudents`
- Fields not yet in DB (curriculum, whatYouWillLearn, reviews): keep as empty array / graceful empty state — no dummy fallback
- If course not found (404): redirect to `/courses` with a toast

---

## Section 6 — Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Teacher submits duplicate title | 400 from DB unique index (if added) or just saves normally |
| Admin reviews already-published course | 400: "Course is already published" |
| Non-admin tries to hit `/review` endpoint | 403 Forbidden |
| Course not found on details page | Redirect to `/courses` |
| Network error during approve/reject | Toast error, modal stays open |

---

## Out of Scope

- Email notification on approve/reject (Gmail SMTP not configured yet)
- Pagination on instructor course list
- Course editing after rejection (re-submit flow is out of scope beyond the button)
- Student enrollment from the details page (separate feature)
