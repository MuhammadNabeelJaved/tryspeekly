# LMS Feature Connections — Design Spec
**Date:** 2026-05-16
**Approach:** C — one new backend stats endpoint; all other connections use existing routes

---

## Scope

Connect the remaining disconnected features across admin, instructor, and student dashboards:

1. Assignments full flow (student submit + instructor grade)
2. InstructorOverview real stats (remove mock fallback)
3. InstructorStudents real data (wire to enrollment API)
4. AdminPaymentsSetup backend persistence (move off localStorage)
5. Admin stats endpoint (server-side aggregation)

Live Classes are explicitly out of scope.

---

## 1. Backend Additions

### 1a. New route: `GET /api/v1/stats/admin`
- **Auth:** `authenticate` + `authorize('admin')`
- **Controller:** `stats.controller.js` (new file)
- **Route file:** `stats.route.js` (new file), mounted at `/stats` in `app.js`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalStudents": 142,
      "totalInstructors": 8,
      "totalRevenue": 450000,
      "pendingPayments": 3,
      "pendingCourseReviews": 2,
      "coursesByStatus": {
        "published": 12,
        "pending": 2,
        "draft": 5,
        "rejected": 1,
        "archived": 0
      }
    }
  }
  ```
- **Implementation:** `Promise.all` of four parallel Mongoose queries (countDocuments + aggregates). No new models needed.

### 1b. New route: `GET /api/v1/assignments/instructor/my`
- **Auth:** `authenticate` + `authorize('teacher', 'admin')`
- **Controller:** `assignment.controller.js` — new `getInstructorAssignments` export
- **Logic:** Find all courses where `teacher === req.user.id`, then find assignments for those course IDs. Populate `course.title`, `submissions.student` (name + profileImage).
- **Response:** Array of assignments, each with nested `submissions[]`

### 1c. Extend SiteSettings schema — `paymentsSetup` field
- **Model:** `site-settings.model.js` — add `paymentsSetup: { type: mongoose.Schema.Types.Mixed, default: {} }`
- **No new routes** — existing `PATCH /api/v1/site-settings` and `GET /api/v1/site-settings` handle it

---

## 2. Assignments Full Flow

### Student side

**`StudentCourseDetails.tsx`**
- Currently uses `MOCK_ENROLLED_COURSES` and `MOCK_ASSIGNMENTS` entirely — full page needs API wiring
- On mount: call `enrollmentsService.getMyEnrollments()` and find the enrollment matching `courseId` from URL params; use `enrollment._id` as `enrollmentId` throughout
- Fetch course data from `coursesService.getCourse(courseId)` for title, instructor, schedule, meet link
- Add "Assignments" tab alongside existing tabs
- On tab open: call `assignmentsService.getCourseAssignments(courseId)`
- Find student's submission in `assignment.submissions` where `submission.student === currentUser.id`
- Render assignment cards: title, due date, status badge (`not submitted` / `submitted` / `graded`)
- "View / Submit" button opens `StudentAssignmentModal`
- Pass `assignmentId`, `enrollmentId`, `submissionStatus`, `grade`, `feedback` as props to modal

**`StudentAssignmentModal.tsx`**
- Currently: UI shell only, submit button does nothing
- Add: file input (`<input type="file">`) + call `assignmentsService.submitAssignment(assignmentId, { enrollmentId, file })`
- Show loading state on submit button
- On success: show "Submitted!" confirmation, close modal, refresh assignment list
- If `submissionStatus === 'graded'`: show grade badge + feedback text instead of upload form

**`assignments.service.ts`** — create this file (does not exist yet). Methods needed:
- `getCourseAssignments(courseId)` → `GET /api/v1/assignments/course/:courseId`
- `submitAssignment(assignmentId, formData)` → `POST /api/v1/assignments/:id/submit` — must send `multipart/form-data` with `file` + `enrollmentId` field (backend uses multer + requires enrollmentId)
- `gradeSubmission(assignmentId, submissionId, { grade, feedback })` → `PATCH /api/v1/assignments/:id/submissions/:submissionId/grade`
- `getInstructorAssignments()` → `GET /api/v1/assignments/instructor/my`

### Instructor side

**New page: `InstructorAssignments.tsx`**
- Fetch from `GET /api/v1/assignments/instructor/my`
- List assignments grouped by course
- Each assignment row: title, due date, submission count badge (`X / Y submitted`)
- Expand row → show submission list: student name, submitted date, status
- Grade button (only visible when `status: submitted`) → inline form: numeric grade (0–100) + feedback textarea → `PATCH /assignments/:id/submissions/:submissionId/grade`
- On success: update submission status to `graded` optimistically in local state

**Routing**
- `AdminPage.tsx` (InstructorDashboard): add `assignments` to the `InstructorView` union type
- Add nav sidebar link "Assignments" with appropriate icon
- Add `<Route path="assignments" element={<InstructorAssignments />} />` inside instructor routes

---

## 3. InstructorOverview — Real Stats

**File:** `InstructorOverview.tsx`

Current problem: `fetchData` catches errors and sets mock data. Fix:
- Remove mock fallback entirely — show `0` or `—` on error, display error toast
- Stats to compute from existing service calls:
  - **My Courses** — `courses.length` from `coursesService.getTeacherCourses()`
  - **Total Students** — sum of `course.enrolledStudents.length` across all courses
  - **Total Earnings** — sum of `payment.amount` where `payment.status === 'approved'` from `paymentsService.getMyPayments()`
  - **Pending Reviews** — `courses.filter(c => c.status === 'pending').length`
- Keep existing loading skeleton UI; replace mock numbers with computed values

---

## 4. InstructorStudents — Real Data

**File:** `InstructorStudents.tsx`

- Call `enrollmentsService.getTeacherEnrollments()` → `GET /api/v1/enrollments/teacher/my`
- Deduplicate by `enrollment.student._id` to get unique students (a student may be in multiple courses)
- Display table/cards: avatar, name, enrolled course(s), attendance % (`sessionsAttended / totalSessions * 100`), enrolled date
- If a student is in multiple courses: show all courses as stacked badges
- Loading skeleton while fetching; empty state if no enrollments

---

## 5. AdminPaymentsSetup — Backend Persistence

**`AdminPaymentsSetup.tsx`**
- On mount: `siteSettingsService.getSettings()` → read `data.paymentsSetup` as initial state (fall back to `INITIAL_PAYMENTS_SETUP` if null)
- On save: `siteSettingsService.updateSettings({ paymentsSetup: currentState })` → `PATCH /api/v1/site-settings`
- Remove all `localStorage.getItem/setItem` calls
- Show save success/error toast

**`siteSettings.service.ts`** — verify `updateSettings` accepts partial payload (it should, PATCH is partial update)

**`PaymentsPage.tsx`** (public page)
- On mount: call `siteSettingsService.getSettings()` → read `paymentsSetup.localMethods`, `paymentsSetup.intlMethods` etc.
- Fall back to `INITIAL_PAYMENTS_SETUP` if API returns null/empty (first-time setup)
- Remove any hardcoded payment method data

---

## 6. AdminOverview — Stats Endpoint

**`AdminOverview.tsx`**
- Replace the current multi-call approach with single `GET /api/v1/stats/admin`
- Add `statsService.ts` (or add to existing service file): `getAdminStats()`
- Map response fields to existing stat card components

---

## Data Flow Summary

```
Admin saves payment setup
  → PATCH /api/v1/site-settings { paymentsSetup: {...} }
  → SiteSettings.paymentsSetup saved in MongoDB
  → Public PaymentsPage reads GET /api/v1/site-settings → renders live data

Student views course
  → GET /api/v1/assignments/course/:courseId
  → Sees assignment list with status badges
  → Submits file via modal → POST /api/v1/assignments/:id/submit
  → Instructor sees submission in InstructorAssignments

Instructor grades submission
  → PATCH /api/v1/assignments/:id/submissions/:submissionId/grade
  → Student sees grade + feedback in modal on next open

Admin views overview
  → GET /api/v1/stats/admin (single aggregated call)
  → Stats cards update with real numbers
```

---

## Build Order

1. **Backend:** `stats.controller.js` + `stats.route.js` + mount in `app.js`
2. **Backend:** `getInstructorAssignments` in `assignment.controller.js` + route
3. **Backend:** Add `paymentsSetup` field to `SiteSettings` model
4. **Frontend:** `AdminOverview` → wire to stats endpoint
5. **Frontend:** `InstructorOverview` → remove mock, compute real stats
6. **Frontend:** `InstructorStudents` → wire to enrollments API
7. **Frontend:** `StudentCourseDetails` → add Assignments tab
8. **Frontend:** `StudentAssignmentModal` → wire submit + show grades
8a. **Frontend:** Create `assignments.service.ts`
9. **Frontend:** `StudentCourseDetails` → full API wiring (replace all mock data)
10. **Frontend:** `StudentAssignmentModal` → wire submit + show grades
11. **Frontend:** `InstructorAssignments` → new page + routing
12. **Frontend:** `AdminPaymentsSetup` + `PaymentsPage` → backend persistence

---

## Error Handling

- All new API calls wrapped in try/catch; show toast on error
- Empty states for zero data (no assignments, no students, no enrollments)
- Loading skeletons on all new data-fetching sections
- `submitAssignment`: validate file selected before calling API; show file size error if >10MB

## Out of Scope
- Live Classes backend
- Assignment creation UI for instructors (already exists in InstructorCourses)
- Certificate auto-issue on course completion (separate workflow)
- Payment approval → auto enrollment trigger (separate workflow)
