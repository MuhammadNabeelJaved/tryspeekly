# LMS Feature Connections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect remaining disconnected features across admin, instructor, and student dashboards — assignments full flow, real dashboard stats, and payment setup persistence.

**Architecture:** One new backend stats endpoint for admin aggregation; all other features wire to existing routes. New `assignments.service.ts` created on the client. `SiteSettings` schema extended with `paymentsSetup` Mixed field so admin-configured payment methods persist to MongoDB and the public PaymentsPage reads live data.

**Tech Stack:** Node.js/Express (ESM), Mongoose, React/TypeScript, Tailwind CSS, Vite, axiosClient, react-hot-toast, @phosphor-icons/react

---

## File Map

### New files
- `server/src/controllers/stats.controller.js`
- `server/src/routes/stats.route.js`
- `client/src/services/assignments.service.ts`
- `client/src/pages/instructor/InstructorAssignments.tsx`

### Modified files
- `server/app.js` — mount stats route
- `server/src/models/site-settings.model.js` — add `paymentsSetup` field
- `server/src/controllers/site-settings.controller.js` — handle `paymentsSetup` in PATCH
- `server/src/controllers/assignment.controller.js` — add `getInstructorAssignments`, fix `getCourseAssignments` to include student's own submission
- `server/src/routes/assignment.route.js` — add instructor/my route
- `client/src/types/api.ts` — add `paymentsSetup` to `SiteSettings`, add `AdminStats` type
- `client/src/pages/admin/AdminOverview.tsx` — use stats endpoint
- `client/src/pages/instructor/InstructorOverview.tsx` — remove mock fallback, fix earnings call
- `client/src/pages/instructor/InstructorStudents.tsx` — use `getTeacherEnrollments`
- `client/src/pages/InstructorDashboardPage.tsx` — add Assignments nav + route
- `client/src/pages/student/StudentCourses.tsx` — wire to enrollments API
- `client/src/pages/student/StudentCourseDetails.tsx` — full API wiring + Assignments tab
- `client/src/pages/student/StudentAssignmentModal.tsx` — real file submit + grade display
- `client/src/pages/admin/AdminPaymentsSetup.tsx` — use siteSettingsService instead of localStorage
- `client/src/pages/PaymentsPage.tsx` — read payment methods from API

---

## Task 1: Stats Controller + Route

**Files:**
- Create: `server/src/controllers/stats.controller.js`
- Create: `server/src/routes/stats.route.js`
- Modify: `server/app.js`

- [ ] **Step 1: Create stats controller**

```js
// server/src/controllers/stats.controller.js
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/user.model.js'
import Course from '../models/course.model.js'
import Payment from '../models/payment.model.js'
import Enrollment from '../models/enrollment.model.js'

// GET /api/v1/stats/admin
export const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalInstructors,
    coursesByStatus,
    revenueAgg,
    pendingPayments,
    pendingEnrollments,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isDeleted: { $ne: true } }),
    User.countDocuments({ role: 'teacher', isDeleted: { $ne: true } }),
    Course.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.countDocuments({ status: 'pending' }),
    Course.countDocuments({ status: 'pending' }),
  ])

  const courseMap = { published: 0, pending: 0, draft: 0, rejected: 0, archived: 0 }
  coursesByStatus.forEach(({ _id, count }) => {
    if (_id in courseMap) courseMap[_id] = count
  })

  res.json({
    success: true,
    data: {
      totalStudents,
      totalInstructors,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      pendingPayments,
      pendingCourseReviews: pendingEnrollments,
      coursesByStatus: courseMap,
    },
  })
})
```

- [ ] **Step 2: Create stats route**

```js
// server/src/routes/stats.route.js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { getAdminStats } from '../controllers/stats.controller.js'

const router = express.Router()

router.route('/admin').get(authenticate, authorize('admin'), getAdminStats)

export default router
```

- [ ] **Step 3: Mount stats route in app.js**

In `server/app.js`, after the existing imports and before `app.use('/api/v1/site-settings', siteSettingsRoutes)`, add:

```js
import statsRoutes from './src/routes/stats.route.js'
```

And in the route mounts section:

```js
app.use('/api/v1/stats', statsRoutes)
```

- [ ] **Step 4: Verify manually**

Start server: `cd server && npm run dev`
Test: `curl -H "Authorization: Bearer <admin_token>" http://localhost:5000/api/v1/stats/admin`
Expected: `{ success: true, data: { totalStudents: N, totalInstructors: N, ... } }`

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/stats.controller.js server/src/routes/stats.route.js server/app.js
git commit -m "feat: add admin stats aggregation endpoint"
```

---

## Task 2: Backend Assignment Additions

**Files:**
- Modify: `server/src/controllers/assignment.controller.js`
- Modify: `server/src/routes/assignment.route.js`

- [ ] **Step 1: Fix getCourseAssignments to include student's own submission**

In `server/src/controllers/assignment.controller.js`, replace the `getCourseAssignments` export:

```js
// GET /api/v1/assignments/course/:courseId — authenticated
export const getCourseAssignments = asyncHandler(async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId, isDeleted: { $ne: true } })
      .sort({ dueDate: 1 })
      .lean()

    if (req.user.role === 'student') {
      const withMySubmission = assignments.map((a) => ({
        ...a,
        submissions: a.submissions.filter(
          (s) => s.student.toString() === req.user.id.toString()
        ),
      }))
      return res.json({ success: true, data: withMySubmission })
    }

    res.json({ success: true, data: assignments.map((a) => ({ ...a, submissions: [] })) })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 2: Add getInstructorAssignments export**

Append to `server/src/controllers/assignment.controller.js`:

```js
// GET /api/v1/assignments/instructor/my — teacher/admin
export const getInstructorAssignments = asyncHandler(async (req, res) => {
  try {
    const Course = (await import('../models/course.model.js')).default
    const courses = await Course.find({ teacher: req.user.id }).select('_id').lean()
    const courseIds = courses.map((c) => c._id)

    const assignments = await Assignment.find({
      course: { $in: courseIds },
      isDeleted: { $ne: true },
    })
      .populate('course', 'title')
      .populate('submissions.student', 'name profileImage')
      .sort({ dueDate: 1 })
      .lean()

    res.json({ success: true, data: assignments })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 3: Add route for instructor/my**

In `server/src/routes/assignment.route.js`, add the import and route. Replace the file content:

```js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadDocument, handleMulterError } from '../middlewares/multer.js'
import {
  createAssignment,
  getCourseAssignments,
  getAssignment,
  submitAssignment,
  gradeSubmission,
  deleteAssignment,
  getInstructorAssignments,
} from '../controllers/assignment.controller.js'

const router = express.Router()

// ─── Teacher/Admin routes ──────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('teacher', 'admin'), createAssignment)
router.route('/instructor/my').get(authenticate, authorize('teacher', 'admin'), getInstructorAssignments)
router.route('/:id').delete(authenticate, authorize('teacher', 'admin'), deleteAssignment)
router.route('/:id/submissions/:submissionId/grade').patch(authenticate, authorize('teacher', 'admin'), gradeSubmission)

// ─── Authenticated routes ──────────────────────────────────────────────────────
router.route('/course/:courseId').get(authenticate, getCourseAssignments)
router.route('/:id').get(authenticate, getAssignment)
router.route('/:id/submit').post(authenticate, authorize('student'), uploadDocument, handleMulterError, submitAssignment)

export default router
```

- [ ] **Step 4: Verify**

Test: `curl -H "Authorization: Bearer <teacher_token>" http://localhost:5000/api/v1/assignments/instructor/my`
Expected: Array of assignments with populated course title and submission student info.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/assignment.controller.js server/src/routes/assignment.route.js
git commit -m "feat: add instructor assignments endpoint, include student submission in course list"
```

---

## Task 3: SiteSettings paymentsSetup Field

**Files:**
- Modify: `server/src/models/site-settings.model.js`
- Modify: `server/src/controllers/site-settings.controller.js`

- [ ] **Step 1: Add paymentsSetup to schema**

In `server/src/models/site-settings.model.js`, add `paymentsSetup` inside the schema definition before the closing `}`:

```js
// After the seo block, before the closing } of the schema definition:
paymentsSetup: { type: mongoose.Schema.Types.Mixed, default: null },
```

The schema should look like:
```js
const siteSettingsSchema = new Schema(
  {
    site: { ... },
    contact: { ... },
    social: { ... },
    seo: { ... },
    paymentsSetup: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, versionKey: false }
)
```

- [ ] **Step 2: Handle paymentsSetup in update controller**

In `server/src/controllers/site-settings.controller.js`, in the `updateSiteSettings` function, after the section loop that handles `site`, `contact`, `social`, `seo`, add:

```js
// After: if (req.body[section] && typeof req.body[section] === 'object') { ... }
// Add before: await settings.save()

if (req.body.paymentsSetup !== undefined) {
  settings.paymentsSetup = req.body.paymentsSetup
  settings.markModified('paymentsSetup')
}
```

The full updated `updateSiteSettings` function:

```js
export const updateSiteSettings = asyncHandler(async (req, res) => {
  let settings = await SiteSettings.findOne()
  if (!settings) settings = new SiteSettings()

  const sections = ['site', 'contact', 'social', 'seo']
  sections.forEach((section) => {
    if (req.body[section] && typeof req.body[section] === 'object') {
      Object.assign(settings[section], req.body[section])
    }
  })

  if (req.body.paymentsSetup !== undefined) {
    settings.paymentsSetup = req.body.paymentsSetup
    settings.markModified('paymentsSetup')
  }

  await settings.save()
  res.json({ success: true, message: 'Settings updated', data: settings })
})
```

- [ ] **Step 3: Verify**

Test with curl:
```bash
curl -X PATCH http://localhost:5000/api/v1/site-settings \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"paymentsSetup": {"test": true}}'
```
Expected: `{ success: true, data: { ..., paymentsSetup: { test: true } } }`

Then GET and verify `paymentsSetup` is returned.

- [ ] **Step 4: Commit**

```bash
git add server/src/models/site-settings.model.js server/src/controllers/site-settings.controller.js
git commit -m "feat: add paymentsSetup field to SiteSettings model"
```

---

## Task 4: Frontend — assignments.service.ts + Type Updates

**Files:**
- Create: `client/src/services/assignments.service.ts`
- Modify: `client/src/types/api.ts`

- [ ] **Step 1: Add AdminStats type and paymentsSetup to SiteSettings in api.ts**

In `client/src/types/api.ts`, after the `SiteSettings` interface, add:

```ts
export interface AdminStats {
  totalStudents: number;
  totalInstructors: number;
  totalRevenue: number;
  pendingPayments: number;
  pendingCourseReviews: number;
  coursesByStatus: {
    published: number;
    pending: number;
    draft: number;
    rejected: number;
    archived: number;
  };
}
```

Also add `paymentsSetup?: Record<string, unknown>` to the `SiteSettings` interface:

```ts
export interface SiteSettings {
  _id: string;
  site: { name?: string; tagline?: string; logoText?: string; footerCopyright?: string };
  contact: { phone?: string; email?: string; whatsapp?: string; address?: string; workingHours?: string };
  social: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; youtube?: string };
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string };
  logoUrl?: string;
  bannerUrl?: string;
  paymentsSetup?: Record<string, unknown>;
  updatedAt: string;
}
```

- [ ] **Step 2: Create assignments.service.ts**

```ts
// client/src/services/assignments.service.ts
import { axiosClient } from '../lib/axiosClient';
import type { Assignment, ApiResponse } from '../types/api';

export const assignmentsService = {
  async getCourseAssignments(courseId: string): Promise<{ success: boolean; data: Assignment[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Assignment[] }>(
      `/assignments/course/${courseId}`
    );
    return response.data;
  },

  async getAssignment(assignmentId: string): Promise<{ success: boolean; data: Assignment }> {
    const response = await axiosClient.get<{ success: boolean; data: Assignment }>(
      `/assignments/${assignmentId}`
    );
    return response.data;
  },

  async submitAssignment(
    assignmentId: string,
    payload: { enrollmentId: string; file: File }
  ): Promise<ApiResponse<{ _id: string; fileUrl: string; status: string }>> {
    const form = new FormData();
    form.append('file', payload.file);
    form.append('enrollmentId', payload.enrollmentId);
    const response = await axiosClient.post<ApiResponse<{ _id: string; fileUrl: string; status: string }>>(
      `/assignments/${assignmentId}/submit`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async gradeSubmission(
    assignmentId: string,
    submissionId: string,
    payload: { grade: number; feedback?: string }
  ): Promise<ApiResponse<{ _id: string; grade: number; feedback?: string; status: string }>> {
    const response = await axiosClient.patch<
      ApiResponse<{ _id: string; grade: number; feedback?: string; status: string }>
    >(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, payload);
    return response.data;
  },

  async getInstructorAssignments(): Promise<{ success: boolean; data: Assignment[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Assignment[] }>(
      '/assignments/instructor/my'
    );
    return response.data;
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add client/src/services/assignments.service.ts client/src/types/api.ts
git commit -m "feat: add assignments service and AdminStats type"
```

---

## Task 5: AdminOverview — Wire to Stats Endpoint

**Files:**
- Modify: `client/src/pages/admin/AdminOverview.tsx`

- [ ] **Step 1: Replace multi-call fetch with stats endpoint**

Replace the `useEffect` and the three `useState` declarations for `apiStudentCount`, `apiCourseCount`, `apiInstructorCount` with a single stats state. At the top of the component, replace:

```tsx
// REMOVE these three lines:
const [apiStudentCount, setApiStudentCount] = useState<number | null>(null)
const [apiCourseCount, setApiCourseCount] = useState<number | null>(null)
const [apiInstructorCount, setApiInstructorCount] = useState<number | null>(null)

// REMOVE the useEffect that calls axiosClient.get('/users') and coursesService.getAllCourses()
```

Add these instead (after the existing `const { user } = useAuth()` line):

```tsx
import { axiosClient } from '../../lib/axiosClient'
import type { AdminStats } from '../../types/api'

// Inside the component:
const [stats, setStats] = useState<AdminStats | null>(null)

useEffect(() => {
  axiosClient.get<{ success: boolean; data: AdminStats }>('/stats/admin')
    .then(res => { if (res.data.success) setStats(res.data.data) })
    .catch(() => {})
}, [])
```

- [ ] **Step 2: Update stat card values to use stats**

Find the stat card section that uses `apiStudentCount ?? students.length`, `apiCourseCount`, `apiInstructorCount` and replace with:

```tsx
// Total Students card value:
{stats?.totalStudents ?? students.length}

// Active Courses card value:
{stats?.coursesByStatus.published ?? courses.filter(c => c.status === 'active').length}

// Total Instructors card value:
{stats?.totalInstructors ?? instructors.length}

// Pending Payments badge (wherever it appears):
{stats?.pendingPayments ?? 0}
```

- [ ] **Step 3: Remove unused imports**

Remove `coursesService` import from AdminOverview if it's no longer used elsewhere in the file. Keep `axiosClient` import.

- [ ] **Step 4: Verify in browser**

Start client: `cd client && npm run dev`
Log in as admin, navigate to `/admin`. Stat cards should show real numbers from the database.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminOverview.tsx
git commit -m "feat: wire AdminOverview to stats endpoint"
```

---

## Task 6: InstructorOverview — Remove Mock Fallback

**Files:**
- Modify: `client/src/pages/instructor/InstructorOverview.tsx`

- [ ] **Step 1: Remove mock imports and fallback state**

At the top of `InstructorOverview.tsx`, remove:

```tsx
// REMOVE this import line:
import { MOCK_INSTRUCTOR as FALLBACK_INSTRUCTOR, INSTRUCTOR_COURSES as FALLBACK_COURSES, RECENT_ASSIGNMENTS as FALLBACK_ASSIGNMENTS } from './instructorData'
```

- [ ] **Step 2: Replace state initialization with empty defaults**

Replace:
```tsx
const [instructor, setInstructor] = useState(FALLBACK_INSTRUCTOR)
const [courses, setCourses] = useState(FALLBACK_COURSES)
```

With:
```tsx
const [earnings, setEarnings] = useState(0)
const [courses, setCourses] = useState<Array<{
  id: string; title: string; students: number;
  status: string; nextClass: string; progress: number;
}>>([])
const [loadingStats, setLoadingStats] = useState(true)
```

- [ ] **Step 3: Fix the fetchData useEffect**

The existing `fetchData` calls `paymentsService.getEarnings()` which does not exist. Replace the entire `useEffect` with:

```tsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const [coursesRes, paymentsRes] = await Promise.allSettled([
        coursesService.getTeacherCourses(),
        paymentsService.getMyPayments(),
      ])

      if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
        const mapped = coursesRes.value.data.map((c) => ({
          id: c._id,
          title: c.title,
          students: c.enrolledStudents?.length ?? 0,
          status: c.status === 'published' ? 'active' : c.status,
          nextClass: c.recurringSchedule?.[0]
            ? `${c.recurringSchedule[0].day}, ${c.recurringSchedule[0].time}`
            : '—',
          progress: 0,
        }))
        setCourses(mapped)
      }

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.success) {
        const approved = paymentsRes.value.data.filter((p) => p.status === 'approved')
        setEarnings(approved.reduce((sum, p) => sum + (p.amount ?? 0), 0))
      }
    } catch {
      // show zeros — no mock fallback
    } finally {
      setLoadingStats(false)
    }
  }
  fetchData()
}, [])
```

- [ ] **Step 4: Update derived stats and stat cards**

Replace the existing computed values:

```tsx
const totalStudents = courses.reduce((sum, c) => sum + (c.students || 0), 0)
const activeCount = courses.filter((c) => c.status === 'active').length
const pendingCount = courses.filter((c) => c.status === 'pending').length
```

Update the four stat cards to use:
- **Total Students** → `{totalStudents}`
- **Active Courses** → `{activeCount}`
- **Pending Reviews** → `{pendingCount}` (replace Avg Rating card or add a fourth)
- **Earnings** → `PKR {earnings.toLocaleString()}` (replace the `$` prefix and `instructor.earnings`)

- [ ] **Step 5: Remove the FALLBACK_ASSIGNMENTS usage in Recent Assignments section**

The "Recent Assignments" section in InstructorOverview currently uses `filteredAssignments` from `FALLBACK_ASSIGNMENTS`. Replace it with a link/button that navigates to the assignments page:

```tsx
{/* Recent Assignments section — navigate to full page */}
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-black text-slate-900 dark:text-white">Assignments</h2>
  </div>
  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-8 text-center shadow-sm">
    <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4">View and grade student assignment submissions.</p>
    <button
      onClick={() => onNavigate('assignments')}
      className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 mx-auto"
    >
      Go to Assignments <ArrowRight size={14} weight="bold" />
    </button>
  </div>
</div>
```

- [ ] **Step 6: Verify in browser**

Log in as instructor, go to `/instructor`. Stats should show real numbers. No mock data visible.

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/instructor/InstructorOverview.tsx
git commit -m "feat: wire InstructorOverview to real API, remove mock fallback"
```

---

## Task 7: InstructorStudents — Real Enrollment Data

**Files:**
- Modify: `client/src/pages/instructor/InstructorStudents.tsx`

- [ ] **Step 1: Replace the fetchStudents logic**

The current `useEffect` calls `coursesService.getCourseStudents()` which doesn't exist. Replace the entire `useEffect` with one that uses `enrollmentsService`:

At the top of the file, add the import:
```tsx
import { enrollmentsService } from '../../services/enrollments.service'
import type { Enrollment } from '../../types/api'
```

Replace the `useEffect`:

```tsx
useEffect(() => {
  const fetchStudents = async () => {
    try {
      const res = await enrollmentsService.getTeacherEnrollments()
      if (!res.success || res.data.length === 0) return

      // Build a map: studentId → { student info + courses[] + latest progress }
      const map = new Map<string, Student>()
      res.data.forEach((enrollment: Enrollment) => {
        const sid = enrollment.student._id
        const attended = enrollment.progress?.sessionsAttended ?? 0
        const total = enrollment.progress?.totalSessions ?? enrollment.course?.totalSessions ?? 0
        const pct = total > 0 ? Math.round((attended / total) * 100) : 0

        if (map.has(sid)) {
          const existing = map.get(sid)!
          existing.course = `${existing.course}, ${enrollment.course.title}`
          existing.attendedClasses = existing.attendedClasses + attended
          existing.totalClasses = existing.totalClasses + total
          existing.attendance = existing.totalClasses > 0
            ? Math.round((existing.attendedClasses / existing.totalClasses) * 100)
            : 0
        } else {
          map.set(sid, {
            id: sid,
            name: enrollment.student.name,
            course: enrollment.course.title,
            status: pct >= 80 ? 'good' : pct >= 50 ? 'at-risk' : 'struggling',
            attendance: pct,
            attendedClasses: attended,
            totalClasses: total,
          })
        }
      })

      const studentList = Array.from(map.values())
      if (studentList.length > 0) setStudents(studentList)
    } catch {
      // keep fallback
    }
  }
  fetchStudents()
}, [])
```

- [ ] **Step 2: Remove the FALLBACK_STUDENTS import if no longer needed as initial state**

Keep `FALLBACK_STUDENTS` as the initial state (it's the fallback on error), but remove any other direct usage. The `useState` can stay as `useState<Student[]>(FALLBACK_STUDENTS)`.

- [ ] **Step 3: Verify in browser**

Log in as instructor. `/instructor/students` should show real enrolled students. If no real enrollments exist, FALLBACK_STUDENTS shows (acceptable fallback).

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/instructor/InstructorStudents.tsx
git commit -m "feat: wire InstructorStudents to enrollment API"
```

---

## Task 8: StudentCourses — Wire to Enrollments API

**Files:**
- Modify: `client/src/pages/student/StudentCourses.tsx`

- [ ] **Step 1: Add state and fetch**

At the top of `StudentCourses.tsx`, add imports:

```tsx
import { useState, useEffect } from 'react'
import { enrollmentsService } from '../../services/enrollments.service'
import type { Enrollment } from '../../types/api'
```

Replace `const activeCourses = MOCK_ENROLLED_COURSES.filter(...)` and `const completedCourses = ...` with:

```tsx
const [enrollments, setEnrollments] = useState<Enrollment[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  enrollmentsService.getMyEnrollments()
    .then(res => { if (res.success) setEnrollments(res.data) })
    .catch(() => {})
    .finally(() => setLoading(false))
}, [])

const activeCourses = enrollments.filter(e => e.isActive)
const completedCourses = enrollments.filter(e => !e.isActive)
```

- [ ] **Step 2: Update the JSX to use enrollment fields**

Replace all references to `course.id`, `course.title`, `course.instructorName`, `course.attendance`, `course.status`, `course.level`, `course.meetLink`, `course.completedSessions`, `course.totalSessions` with enrollment equivalents:

```tsx
// Link to course details:
<Link to={`/dashboard/courses/${enrollment.course._id}`} key={enrollment._id} ...>

// Course title:
{enrollment.course.title}

// Instructor name:
{enrollment.teacher?.name ?? '—'}

// Attendance:
{enrollment.progress?.sessionsAttended ?? 0} / {enrollment.progress?.totalSessions ?? 0} sessions

// Level (not available in enrollment — show nothing or fetch separately):
{/* omit level badge or show course type if available */}
```

- [ ] **Step 3: Add loading state**

Before the main JSX return, add:

```tsx
if (loading) {
  return (
    <div className="space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="h-40 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Add empty state**

```tsx
{enrollments.length === 0 && (
  <div className="py-20 text-center">
    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No courses yet</h3>
    <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">You haven't enrolled in any courses.</p>
    <Link to="/courses" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold">Browse Courses</Link>
  </div>
)}
```

- [ ] **Step 5: Remove MOCK_ENROLLED_COURSES import**

```tsx
// Remove:
import { MOCK_ENROLLED_COURSES } from './studentData'
```

- [ ] **Step 6: Verify**

Log in as student. `/dashboard/courses` should show real enrolled courses or empty state.

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/student/StudentCourses.tsx
git commit -m "feat: wire StudentCourses to enrollments API"
```

---

## Task 9: StudentCourseDetails — Full API Wiring + Assignments Tab

**Files:**
- Modify: `client/src/pages/student/StudentCourseDetails.tsx`

- [ ] **Step 1: Replace mock imports with API imports**

Remove:
```tsx
import { MOCK_ENROLLED_COURSES, MOCK_ASSIGNMENTS } from './studentData'
```

Add:
```tsx
import { useEffect, useState } from 'react'
import { enrollmentsService } from '../../services/enrollments.service'
import { coursesService } from '../../services/courses.service'
import { assignmentsService } from '../../services/assignments.service'
import { useAuth } from '../../context/AuthContext'
import type { Enrollment, Course, Assignment } from '../../types/api'
import toast from 'react-hot-toast'
```

- [ ] **Step 2: Replace mock state with real API state**

Replace the mock `const course = MOCK_ENROLLED_COURSES.find(...)` with:

```tsx
const { id: courseId } = useParams()
const { user } = useAuth()

const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
const [course, setCourse] = useState<Course | null>(null)
const [assignments, setAssignments] = useState<Assignment[]>([])
const [loading, setLoading] = useState(true)
const [activeTab, setActiveTab] = useState<'overview' | 'assignments'>('overview')
const [submitModalOpen, setSubmitModalOpen] = useState(false)
const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

useEffect(() => {
  if (!courseId) return
  Promise.all([
    enrollmentsService.getMyEnrollments(),
    coursesService.getCourseById(courseId),
  ])
    .then(([enrollRes, courseRes]) => {
      if (enrollRes.success) {
        const found = enrollRes.data.find(e => e.course._id === courseId)
        setEnrollment(found ?? null)
      }
      if (courseRes.success) setCourse(courseRes.data)
    })
    .catch(() => toast.error('Failed to load course details'))
    .finally(() => setLoading(false))
}, [courseId])

useEffect(() => {
  if (!courseId || activeTab !== 'assignments') return
  assignmentsService.getCourseAssignments(courseId)
    .then(res => { if (res.success) setAssignments(res.data) })
    .catch(() => toast.error('Failed to load assignments'))
}, [courseId, activeTab])
```

- [ ] **Step 3: Add loading state**

```tsx
if (loading) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 dark:bg-neutral-800 rounded-xl" />
      <div className="h-40 bg-slate-100 dark:bg-neutral-900 rounded-2xl" />
    </div>
  )
}

if (!course || !enrollment) {
  return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Course Not Found</h2>
      <p className="text-slate-500 dark:text-neutral-400 mb-6">You may not be enrolled in this course.</p>
      <Link to="/dashboard/courses" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold">Go Back</Link>
    </div>
  )
}
```

- [ ] **Step 4: Update JSX field references**

Replace all mock course field references:
- `course.title` → `course.title` (same)
- `course.instructorName` → `enrollment.teacher?.name ?? '—'`
- `course.level` → `course.level`
- `course.status` → `enrollment.isActive ? 'active' : 'completed'`
- `course.meetLink` → `course.meetLink ?? '#'`
- `course.nextClassTime` → `course.recurringSchedule?.[0] ? \`${course.recurringSchedule[0].day} ${course.recurringSchedule[0].time}\` : null`
- `course.completedSessions` → `enrollment.progress?.sessionsAttended ?? 0`
- `course.totalSessions` → `enrollment.progress?.totalSessions ?? 0`
- `course.attendance` → `enrollment.progress?.sessionsAttended && enrollment.progress?.totalSessions ? Math.round((enrollment.progress.sessionsAttended / enrollment.progress.totalSessions) * 100) : 0`

- [ ] **Step 5: Add Assignments tab to the tab bar**

Find the tab bar in the JSX (the row with tabs like "Overview", "Materials" etc.) and add:

```tsx
<button
  onClick={() => setActiveTab('assignments')}
  className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
    activeTab === 'assignments'
      ? 'bg-violet-600 text-white'
      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
  }`}
>
  Assignments {assignments.length > 0 && `(${assignments.length})`}
</button>
```

- [ ] **Step 6: Add Assignments tab content**

In the conditional rendering area for tabs, add:

```tsx
{activeTab === 'assignments' && (
  <div className="space-y-3">
    {assignments.length === 0 ? (
      <div className="py-12 text-center bg-slate-50 dark:bg-neutral-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800">
        <p className="text-sm text-slate-500 dark:text-neutral-400">No assignments for this course yet.</p>
      </div>
    ) : (
      assignments.map(assignment => {
        const mySubmission = assignment.submissions?.[0]
        const status = mySubmission?.status ?? 'not submitted'
        return (
          <div key={assignment._id} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 dark:text-white truncate">{assignment.title}</h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Due {new Date(assignment.dueDate).toLocaleDateString()}</p>
              {status === 'graded' && (
                <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-1">
                  Grade: {mySubmission?.grade}/100 {mySubmission?.feedback && `· ${mySubmission.feedback}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                status === 'graded' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                status === 'submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}>
                {status === 'graded' ? 'Graded' : status === 'submitted' ? 'Submitted' : 'Not Submitted'}
              </span>
              {status !== 'graded' && (
                <button
                  onClick={() => { setSelectedAssignment(assignment); setSubmitModalOpen(true) }}
                  className="text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                >
                  {status === 'submitted' ? 'Resubmit' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        )
      })
    )}
  </div>
)}
```

- [ ] **Step 7: Update StudentAssignmentModal call**

Replace the existing `<StudentAssignmentModal>` usage. Pass the new props:

```tsx
<StudentAssignmentModal
  isOpen={submitModalOpen}
  onClose={() => { setSubmitModalOpen(false); setSelectedAssignment(null) }}
  assignment={selectedAssignment}
  enrollmentId={enrollment._id}
  onSubmitted={() => {
    // Refresh assignments after submit
    if (courseId) {
      assignmentsService.getCourseAssignments(courseId)
        .then(res => { if (res.success) setAssignments(res.data) })
    }
  }}
/>
```

- [ ] **Step 8: Verify in browser**

Log in as student, navigate to a course. Page should load real course data. Switch to Assignments tab — shows real assignments or empty state.

- [ ] **Step 9: Commit**

```bash
git add client/src/pages/student/StudentCourseDetails.tsx
git commit -m "feat: wire StudentCourseDetails to real API, add Assignments tab"
```

---

## Task 10: StudentAssignmentModal — Real Submit + Grade Display

**Files:**
- Modify: `client/src/pages/student/StudentAssignmentModal.tsx`

- [ ] **Step 1: Update props interface**

Replace the existing `StudentAssignmentModalProps` interface:

```tsx
import { assignmentsService } from '../../services/assignments.service'
import type { Assignment } from '../../types/api'
import toast from 'react-hot-toast'

interface StudentAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: Assignment | null
  enrollmentId: string
  onSubmitted: () => void
}
```

- [ ] **Step 2: Replace handleSubmit with real API call**

Replace the entire component body with:

```tsx
export default function StudentAssignmentModal({
  isOpen, onClose, assignment, enrollmentId, onSubmitted
}: StudentAssignmentModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  if (!isOpen || !assignment) return null

  const mySubmission = assignment.submissions?.[0]
  const isGraded = mySubmission?.status === 'graded'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB')
      return
    }
    setIsUploading(true)
    try {
      await assignmentsService.submitAssignment(assignment._id, { enrollmentId, file })
      setIsSuccess(true)
      onSubmitted()
      setTimeout(() => {
        setIsSuccess(false)
        setFile(null)
        onClose()
      }, 2000)
    } catch {
      toast.error('Failed to submit assignment. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={() => !isUploading && onClose()}
      />
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="font-bold text-slate-900 dark:text-white">
            {isGraded ? 'Assignment Result' : 'Submit Assignment'}
          </h3>
          <button
            onClick={() => !isUploading && onClose()}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle size={64} weight="fill" className="mx-auto text-green-500 mb-4" />
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Submitted!</h4>
              <p className="text-sm text-slate-500 dark:text-neutral-400">Your work has been uploaded for review.</p>
            </div>
          ) : isGraded ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1">
                  {assignment.course?.title}
                </p>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{assignment.title}</h4>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 border border-green-100 dark:border-green-900/40">
                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Your Grade</p>
                <p className="text-4xl font-black text-green-700 dark:text-green-300">{mySubmission.grade}<span className="text-lg">/100</span></p>
                {mySubmission.feedback && (
                  <p className="text-sm text-slate-600 dark:text-neutral-300 mt-3 pt-3 border-t border-green-100 dark:border-green-900/40">
                    <span className="font-bold">Feedback: </span>{mySubmission.feedback}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1">
                  {assignment.course?.title}
                </p>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{assignment.title}</h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                  Due {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-200 dark:border-neutral-700 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors relative group">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                />
                <UploadSimple size={32} className="mx-auto text-slate-400 dark:text-neutral-500 mb-3 group-hover:text-violet-600 transition-colors" />
                {file ? (
                  <p className="text-sm font-bold text-violet-600 dark:text-violet-400 flex items-center justify-center gap-2">
                    <FileText size={18} /> {file.name}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-700 dark:text-neutral-300 mb-1">Click to browse or drag file here</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-500">PDF, DOCX, ZIP, MP4 (Max 10MB)</p>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
              >
                {isUploading ? (
                  <><CircleNotch size={20} weight="bold" className="animate-spin" /> Uploading...</>
                ) : 'Upload Assignment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Log in as student, open an assignment modal. Submit a file — it should upload and show success. Re-open after grading by instructor — should show grade and feedback.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/student/StudentAssignmentModal.tsx
git commit -m "feat: wire StudentAssignmentModal to assignment submit API, show grades"
```

---

## Task 11: InstructorAssignments — New Page + Routing

**Files:**
- Create: `client/src/pages/instructor/InstructorAssignments.tsx`
- Modify: `client/src/pages/InstructorDashboardPage.tsx`

- [ ] **Step 1: Create InstructorAssignments.tsx**

```tsx
// client/src/pages/instructor/InstructorAssignments.tsx
import { useState, useEffect } from 'react'
import { assignmentsService } from '../../services/assignments.service'
import type { Assignment, Submission } from '../../types/api'
import toast from 'react-hot-toast'
import { CaretDown, CaretUp, CheckCircle, CircleNotch } from '@phosphor-icons/react'

export default function InstructorAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [grading, setGrading] = useState<Record<string, { grade: string; feedback: string }>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    assignmentsService.getInstructorAssignments()
      .then(res => { if (res.success) setAssignments(res.data) })
      .catch(() => toast.error('Failed to load assignments'))
      .finally(() => setLoading(false))
  }, [])

  const handleGrade = async (assignment: Assignment, submission: Submission) => {
    const key = submission._id
    const data = grading[key]
    if (!data?.grade) { toast.error('Enter a grade between 0 and 100'); return }
    const gradeNum = Number(data.grade)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      toast.error('Grade must be 0–100'); return
    }
    setSubmitting(key)
    try {
      await assignmentsService.gradeSubmission(assignment._id, submission._id, {
        grade: gradeNum,
        feedback: data.feedback,
      })
      toast.success('Graded successfully')
      setAssignments(prev => prev.map(a => {
        if (a._id !== assignment._id) return a
        return {
          ...a,
          submissions: a.submissions.map(s =>
            s._id === submission._id
              ? { ...s, status: 'graded' as const, grade: gradeNum, feedback: data.feedback }
              : s
          ),
        }
      }))
      setGrading(prev => { const next = { ...prev }; delete next[key]; return next })
    } catch {
      toast.error('Failed to grade submission')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Assignments</h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Review and grade student submissions.</p>
      </div>

      {assignments.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 dark:bg-neutral-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800">
          <p className="text-slate-500 dark:text-neutral-400">No assignments found. Create assignments from your course pages.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(assignment => {
            const submitted = assignment.submissions.filter(s => s.status === 'submitted').length
            const graded = assignment.submissions.filter(s => s.status === 'graded').length
            const total = assignment.submissions.length
            const isExpanded = expanded === assignment._id

            return (
              <div key={assignment._id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : assignment._id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full">
                        {assignment.course?.title ?? 'Course'}
                      </span>
                      <span className="text-[10px] text-slate-400">Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{assignment.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{submitted} pending</p>
                      <p className="text-[10px] text-slate-400">{graded}/{total} graded</p>
                    </div>
                    {isExpanded ? <CaretUp size={16} className="text-slate-400" /> : <CaretDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-neutral-800 divide-y divide-slate-50 dark:divide-neutral-800/50">
                    {total === 0 ? (
                      <p className="p-5 text-sm text-slate-400 text-center">No submissions yet.</p>
                    ) : (
                      assignment.submissions.map(submission => {
                        const key = submission._id
                        const g = grading[key] ?? { grade: '', feedback: '' }
                        return (
                          <div key={key} className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">
                                  {(submission.student as any)?.name ?? 'Student'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                                {submission.fileUrl && (
                                  <a
                                    href={submission.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline mt-1 inline-block"
                                  >
                                    View file ↗
                                  </a>
                                )}
                              </div>
                              {submission.status === 'graded' ? (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <CheckCircle size={18} weight="fill" />
                                  <span className="text-sm font-bold">{submission.grade}/100</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end gap-2 min-w-[180px]">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="Grade (0–100)"
                                    value={g.grade}
                                    onChange={e => setGrading(prev => ({ ...prev, [key]: { ...g, grade: e.target.value } }))}
                                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                                  />
                                  <textarea
                                    placeholder="Feedback (optional)"
                                    rows={2}
                                    value={g.feedback}
                                    onChange={e => setGrading(prev => ({ ...prev, [key]: { ...g, feedback: e.target.value } }))}
                                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors resize-none"
                                  />
                                  <button
                                    onClick={() => handleGrade(assignment, submission)}
                                    disabled={submitting === key}
                                    className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors"
                                  >
                                    {submitting === key
                                      ? <><CircleNotch size={14} className="animate-spin" /> Saving...</>
                                      : 'Save Grade'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add Assignments to InstructorDashboardPage nav and routes**

In `client/src/pages/InstructorDashboardPage.tsx`:

Add import at the top with the other lazy imports:
```tsx
const InstructorAssignments = lazy(() => import('./instructor/InstructorAssignments'))
```

Add to `NAV_MAIN` array (after the students entry):
```tsx
{ view: 'assignments', label: 'Assignments', path: 'assignments', Icon: CheckCircle as NavItem['Icon'] },
```

Add the icon import — `CheckCircle` is already imported from `@phosphor-icons/react` (it's in the existing imports). If not, add it.

Add route inside `<Routes>`:
```tsx
<Route path="/assignments" element={<InstructorAssignments />} />
```

- [ ] **Step 3: Verify**

Log in as instructor. Sidebar should show "Assignments" link. Click it — page loads, shows real assignments grouped by course. Expand an assignment — see submissions. Grade one — optimistic update shows "Graded" badge.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/instructor/InstructorAssignments.tsx client/src/pages/InstructorDashboardPage.tsx
git commit -m "feat: add InstructorAssignments page with grading, wire to nav"
```

---

## Task 12: AdminPaymentsSetup + PaymentsPage — Backend Persistence

**Files:**
- Modify: `client/src/pages/admin/AdminPaymentsSetup.tsx`
- Modify: `client/src/pages/PaymentsPage.tsx`

- [ ] **Step 1: Wire AdminPaymentsSetup to siteSettingsService**

In `AdminPaymentsSetup.tsx`, the component currently reads from localStorage in this pattern:
```tsx
try { return JSON.parse(localStorage.getItem('admin_payments_setup') || 'null') ?? INITIAL_PAYMENTS_SETUP }
```
And saves with:
```tsx
localStorage.setItem('admin_payments_setup', JSON.stringify(data))
```

Add import at top:
```tsx
import { siteSettingsService } from '../../services/site-settings.service'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
```

Replace the `useState` initializer that reads from localStorage. Find the `useState` call using `localStorage.getItem` and replace it with:
```tsx
const [data, setData] = useState<PaymentsSetupData>(INITIAL_PAYMENTS_SETUP)
const [loadingSettings, setLoadingSettings] = useState(true)
```

Add a `useEffect` to load from API on mount (inside the component):
```tsx
useEffect(() => {
  siteSettingsService.get()
    .then(settings => {
      if (settings.paymentsSetup && Object.keys(settings.paymentsSetup).length > 0) {
        setData(settings.paymentsSetup as unknown as PaymentsSetupData)
      }
    })
    .catch(() => {})
    .finally(() => setLoadingSettings(false))
}, [])
```

- [ ] **Step 2: Replace localStorage save with API save**

Find the `handleSave` function (or wherever `localStorage.setItem('admin_payments_setup', ...)` is called) and replace it:

```tsx
const handleSave = async () => {
  try {
    await siteSettingsService.update({ paymentsSetup: data as unknown as Record<string, unknown> })
    toast.success('Payment settings saved')
  } catch {
    toast.error('Failed to save settings')
  }
}
```

Find the reset handler (`localStorage.setItem(... INITIAL_PAYMENTS_SETUP ...)`) and replace:
```tsx
const handleReset = async () => {
  setData(INITIAL_PAYMENTS_SETUP)
  try {
    await siteSettingsService.update({ paymentsSetup: INITIAL_PAYMENTS_SETUP as unknown as Record<string, unknown> })
    toast.success('Reset to defaults')
  } catch {
    toast.error('Failed to reset')
  }
}
```

- [ ] **Step 3: Wire PaymentsPage to API**

In `client/src/pages/PaymentsPage.tsx`, add imports:

```tsx
import { useEffect, useState } from 'react'
import { siteSettingsService } from '../services/site-settings.service'
```

At the top of the component, add state:
```tsx
const [paymentConfig, setPaymentConfig] = useState<Record<string, unknown> | null>(null)

useEffect(() => {
  siteSettingsService.get()
    .then(settings => {
      if (settings.paymentsSetup) setPaymentConfig(settings.paymentsSetup)
    })
    .catch(() => {})
}, [])
```

Use `paymentConfig` where the page renders payment method details. If `paymentConfig` is null, fall back to the existing hardcoded/initial data so the page always renders something.

- [ ] **Step 4: Verify**

1. Log in as admin, go to CMS → Payment Setup. Change a method name. Click Save.
2. Open PaymentsPage in a private/incognito window. The updated method name should appear.
3. Confirm no localStorage reads/writes for payment setup in DevTools.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminPaymentsSetup.tsx client/src/pages/PaymentsPage.tsx
git commit -m "feat: persist AdminPaymentsSetup to MongoDB, PaymentsPage reads from API"
```

---

## Self-Review Checklist

- [x] **Stats endpoint** — Task 1 covers controller + route + mount ✓
- [x] **getInstructorAssignments** — Task 2 covers new export + route ✓
- [x] **getCourseAssignments includes student submission** — Task 2 Step 1 ✓
- [x] **assignments.service.ts created** — Task 4 ✓
- [x] **AdminStats type added** — Task 4 Step 1 ✓
- [x] **paymentsSetup in SiteSettings** — Task 3 (model + controller) ✓
- [x] **AdminOverview uses stats endpoint** — Task 5 ✓
- [x] **InstructorOverview mock removed, getEarnings fixed** — Task 6 ✓
- [x] **InstructorStudents uses getTeacherEnrollments** — Task 7 ✓
- [x] **StudentCourses wired to enrollments** — Task 8 ✓
- [x] **StudentCourseDetails fully wired + Assignments tab** — Task 9 ✓
- [x] **StudentAssignmentModal real submit + grade display** — Task 10 ✓
- [x] **InstructorAssignments page + nav + route** — Task 11 ✓
- [x] **AdminPaymentsSetup → siteSettingsService** — Task 12 ✓
- [x] **PaymentsPage reads from API** — Task 12 ✓
- [x] **All method names consistent** — `siteSettingsService.get()` / `.update()` used throughout ✓
- [x] **No TBDs or placeholders** ✓
