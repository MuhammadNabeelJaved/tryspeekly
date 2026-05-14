# Course Approval Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** End-to-end course approval pipeline — teacher submits → pending → admin approves/rejects with in-app notification → published courses appear publicly → course details page shows real API data.

**Architecture:** Add `pending`/`rejected` to the course status enum; a dedicated admin `reviewCourse` endpoint handles the state transition and writes a notification to the teacher's User document; existing admin/instructor UIs are wired to these real endpoints; the public CourseDetailsPage merges more real API fields.

**Tech Stack:** Node.js/Express/Mongoose (server), React/TypeScript/Tailwind/Framer Motion (client), axios via `axiosClient`, react-hot-toast for feedback.

---

## File Map

| File | Change |
|------|--------|
| `server/src/models/course.model.js` | Add `'pending'`, `'rejected'` to status enum |
| `server/src/controllers/course.controller.js` | Force `pending` on teacher create; add `getAdminCourses`; add `reviewCourse` |
| `server/src/routes/course.route.js` | Register 2 new admin routes |
| `client/src/services/courses.service.ts` | Add `getAdminCourses`, `reviewCourse`, `submitForReview` |
| `client/src/pages/admin/AdminCourses.tsx` | Wire fetch + review actions to real API |
| `client/src/pages/instructor/InstructorCourses.tsx` | Map `pending`/`rejected` status; add re-submit; toast on create |
| `client/src/pages/CourseDetailsPage.tsx` | Extend API merge; 404 redirect |

---

## Task 1: Extend course status enum

**Files:**
- Modify: `server/src/models/course.model.js`

- [ ] **Step 1: Update the enum**

Open `server/src/models/course.model.js`. Find the `status` field (line ~62) and replace:

```js
// BEFORE
status: {
  type: String,
  enum: ['draft', 'published', 'archived'],
  default: 'draft',
},
```

```js
// AFTER
status: {
  type: String,
  enum: ['draft', 'pending', 'published', 'rejected', 'archived'],
  default: 'draft',
},
```

- [ ] **Step 2: Verify server still starts**

```bash
cd server && node --watch src/index.js
```
Expected: `MongoDB Connected Securely` + `Server running on port 5000` — no validation errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/models/course.model.js
git commit -m "feat: add pending and rejected to course status enum"
```

---

## Task 2: Force `pending` on teacher course create

**Files:**
- Modify: `server/src/controllers/course.controller.js` — `createCourse` function

- [ ] **Step 1: Update createCourse**

Find the `createCourse` handler (line ~44) and replace it:

```js
// POST /api/v1/courses — teacher/admin
export const createCourse = asyncHandler(async (req, res) => {
  try {
    // Teachers always submit for review; admins can set their own status
    const status = req.user.role === 'admin' ? (req.body.status ?? 'draft') : 'pending'
    const course = await Course.create({ ...req.body, teacher: req.user.id, status })
    res.status(201).json({ success: true, message: 'Course submitted for review', data: course })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 2: Manual test via curl (server must be running)**

```bash
# Login as teacher first to get a token, then:
curl -X POST http://localhost:5000/api/v1/courses \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Course","description":"Desc","price":5000,"currency":"PKR","type":"group","level":"beginner","focus":"general","totalSessions":10,"sessionDuration":60}'
```
Expected response: `"message": "Course submitted for review"` and `"status": "pending"` in data.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/course.controller.js
git commit -m "feat: force pending status when teacher creates a course"
```

---

## Task 3: Add `getAdminCourses` endpoint

**Files:**
- Modify: `server/src/controllers/course.controller.js` — add new export
- Modify: `server/src/routes/course.route.js` — register route

- [ ] **Step 1: Add controller function**

At the end of `server/src/controllers/course.controller.js`, add:

```js
// GET /api/v1/courses/admin/all — admin: all courses any status
export const getAdminCourses = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query
    const filter = {}

    if (status && status !== 'all') filter.status = status
    if (search) filter.title = { $regex: search, $options: 'i' }

    const skip = (Number(page) - 1) * Number(limit)
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('teacher', 'name profileImage')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Course.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: courses,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 2: Register route**

Open `server/src/routes/course.route.js`. Add the import and route:

```js
import {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  updateCourseThumbnail,
  deleteCourse,
  getTeacherCourses,
  getAdminCourses,   // ← add this
} from '../controllers/course.controller.js'
```

Then add the route before the `/:id` routes (important — specific paths before parameterised paths):

```js
// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/admin/all').get(authenticate, authorize('admin'), getAdminCourses)
router.route('/:id').delete(authenticate, authorize('admin'), deleteCourse)
```

- [ ] **Step 3: Verify route works**

```bash
curl http://localhost:5000/api/v1/courses/admin/all \
  -H "Authorization: Bearer <admin_token>"
```
Expected: `{ "success": true, "data": [...] }` with all courses including pending/draft.

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/course.controller.js server/src/routes/course.route.js
git commit -m "feat: add GET /courses/admin/all endpoint for admin course management"
```

---

## Task 4: Add `reviewCourse` endpoint with in-app notification

**Files:**
- Modify: `server/src/controllers/course.controller.js` — add new export
- Modify: `server/src/routes/course.route.js` — register route

- [ ] **Step 1: Import User model at the top of the controller**

At the top of `server/src/controllers/course.controller.js`, add:

```js
import User from '../models/user.model.js'
```

- [ ] **Step 2: Add reviewCourse controller function**

At the end of `server/src/controllers/course.controller.js`, add:

```js
// PATCH /api/v1/courses/:id/review — admin: approve or reject
export const reviewCourse = asyncHandler(async (req, res) => {
  try {
    const { action, reason } = req.body

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: { message: 'action must be "approve" or "reject"' } })
    }

    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    }
    if (course.status === 'published') {
      return res.status(400).json({ success: false, error: { message: 'Course is already published' } })
    }

    course.status = action === 'approve' ? 'published' : 'rejected'
    await course.save()

    // Push in-app notification to teacher
    const notificationType = action === 'approve' ? 'course_approved' : 'course_rejected'
    const notificationMessage = action === 'approve'
      ? `Your course "${course.title}" has been approved and is now live.`
      : `Your course "${course.title}" was rejected.${reason ? ` Reason: ${reason}` : ''}`

    await User.findByIdAndUpdate(course.teacher, {
      $push: {
        notifications: {
          type: notificationType,
          message: notificationMessage,
          read: false,
          createdAt: new Date(),
        },
      },
    })

    res.json({
      success: true,
      message: action === 'approve' ? 'Course approved and published' : 'Course rejected',
      data: course,
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
```

- [ ] **Step 3: Register route**

In `server/src/routes/course.route.js`, add the import and route. The import block should now be:

```js
import {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  updateCourseThumbnail,
  deleteCourse,
  getTeacherCourses,
  getAdminCourses,
  reviewCourse,    // ← add this
} from '../controllers/course.controller.js'
```

Add the route in the admin section:

```js
// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/admin/all').get(authenticate, authorize('admin'), getAdminCourses)
router.route('/:id/review').patch(authenticate, authorize('admin'), reviewCourse)  // ← add
router.route('/:id').delete(authenticate, authorize('admin'), deleteCourse)
```

- [ ] **Step 4: Test approve flow**

```bash
# First create a course as teacher (status becomes pending), then:
curl -X PATCH http://localhost:5000/api/v1/courses/<course_id>/review \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}'
```
Expected: `{ "success": true, "message": "Course approved and published" }`.
Check teacher user in DB — `notifications` array should have one new entry with `type: "course_approved"`.

- [ ] **Step 5: Test reject flow**

```bash
curl -X PATCH http://localhost:5000/api/v1/courses/<course_id>/review \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"reject","reason":"Missing syllabus details"}'
```
Expected: `{ "success": true, "message": "Course rejected" }` and notification with reason in message.

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/course.controller.js server/src/routes/course.route.js
git commit -m "feat: add PATCH /courses/:id/review endpoint with teacher notification"
```

---

## Task 5: Frontend — extend coursesService

**Files:**
- Modify: `client/src/services/courses.service.ts`

- [ ] **Step 1: Add three new methods**

Open `client/src/services/courses.service.ts`. Add these three methods inside the `coursesService` object, after `deleteCourse`:

```ts
  async getAdminCourses(params?: {
    status?: string; search?: string; page?: number; limit?: number;
  }): Promise<CourseListResponse> {
    const response = await axiosClient.get<CourseListResponse>('/courses/admin/all', { params });
    return response.data;
  },

  async reviewCourse(id: string, action: 'approve' | 'reject', reason?: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.patch<CourseSingleResponse>(`/courses/${id}/review`, { action, reason });
    return response.data;
  },

  async submitForReview(id: string): Promise<CourseSingleResponse> {
    const response = await axiosClient.patch<CourseSingleResponse>(`/courses/${id}`, { status: 'pending' });
    return response.data;
  },
```

- [ ] **Step 2: TypeScript check**

```bash
cd client && npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/services/courses.service.ts
git commit -m "feat: add getAdminCourses, reviewCourse, submitForReview to coursesService"
```

---

## Task 6: Wire AdminCourses to real API

**Files:**
- Modify: `client/src/pages/admin/AdminCourses.tsx`

- [ ] **Step 1: Replace the fetch to use getAdminCourses**

Find the `fetchCourses` function inside the `useEffect` (around line 54). Replace it entirely:

```tsx
useEffect(() => {
  async function fetchCourses() {
    try {
      const res = await coursesService.getAdminCourses({ limit: 200 })
      const apiData: any[] = res.data ?? []
      const mapped: Course[] = apiData.map((c: any, idx: number) => ({
        id: c._id ?? c.id ?? `api-c${idx}`,
        title: c.title ?? '',
        level: c.level ? c.level.charAt(0).toUpperCase() + c.level.slice(1) : 'Beginner',
        duration: `${c.totalSessions ?? 0} sessions`,
        price: c.price ?? 0,
        currency: c.currency ?? 'PKR',
        instructorId: c.teacher?._id ?? '',
        instructorName: c.teacher?.name ?? '',
        totalStudents: (c.enrolledStudents ?? []).length,
        maxStudents: c.maxStudents ?? 15,
        status: c.status as Course['status'],
        description: c.description ?? '',
        startDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
        schedule: c.recurringSchedule?.[0] ? `${c.recurringSchedule[0].day} ${c.recurringSchedule[0].time}` : '',
        features: [],
      }))
      setApiCourses(mapped)
    } catch {
      // fallback to store data
    }
  }
  fetchCourses()
}, [])
```

- [ ] **Step 2: Add review loading + reason state**

Add two new state variables near the top of the component (after `const [deleteId, setDeleteId]`):

```tsx
const [reviewLoading, setReviewLoading] = useState(false)
const [rejectReason, setRejectReason] = useState('')
```

Also reset reason when the modal closes — find where `setReviewCourse(null)` is called and add `setRejectReason('')` alongside it.

- [ ] **Step 3: Replace handleReviewAction with real API call**

Find `handleReviewAction` (around line 123) and replace it:

```tsx
async function handleReviewAction(courseId: string, action: 'accept' | 'reject', reason?: string) {
  setReviewLoading(true)
  try {
    await coursesService.reviewCourse(courseId, action === 'accept' ? 'approve' : 'reject', reason)
    // Refresh courses from server
    const res = await coursesService.getAdminCourses({ limit: 200 })
    const apiData: any[] = res.data ?? []
    const mapped: Course[] = apiData.map((c: any, idx: number) => ({
      id: c._id ?? c.id ?? `api-c${idx}`,
      title: c.title ?? '',
      level: c.level ? c.level.charAt(0).toUpperCase() + c.level.slice(1) : 'Beginner',
      duration: `${c.totalSessions ?? 0} sessions`,
      price: c.price ?? 0,
      currency: c.currency ?? 'PKR',
      instructorId: c.teacher?._id ?? '',
      instructorName: c.teacher?.name ?? '',
      totalStudents: (c.enrolledStudents ?? []).length,
      maxStudents: c.maxStudents ?? 15,
      status: c.status as Course['status'],
      description: c.description ?? '',
      startDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      schedule: c.recurringSchedule?.[0] ? `${c.recurringSchedule[0].day} ${c.recurringSchedule[0].time}` : '',
      features: [],
    }))
    setApiCourses(mapped)
    setReviewCourse(null)
    toast.success(action === 'accept' ? 'Course approved and published!' : 'Course rejected.')
  } catch {
    toast.error('Action failed. Please try again.')
  } finally {
    setReviewLoading(false)
  }
}
```

- [ ] **Step 4: Add toast import**

At the top of `AdminCourses.tsx`, add:

```tsx
import toast from 'react-hot-toast'
```

- [ ] **Step 5: Add reason textarea + wire buttons**

In the REVIEW MODAL, just before the two action buttons (inside `<div className="flex gap-3 px-6 pb-6 ...`), add a rejection reason textarea and update the buttons:

```tsx
{/* Reason field (shown always, used on reject) */}
<div className="px-6 pb-4">
  <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">
    Rejection Reason (optional)
  </label>
  <textarea
    value={rejectReason}
    onChange={e => setRejectReason(e.target.value)}
    rows={2}
    placeholder="Missing syllabus, inappropriate content…"
    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors resize-none"
  />
</div>
```

Then in the buttons section (around line 436), update the onClick handlers to pass the reason:

```tsx
onClick={() => handleReviewAction(reviewCourse.id, 'reject', rejectReason || undefined)}
onClick={() => handleReviewAction(reviewCourse.id, 'accept')}
```

- [ ] **Step 6: Disable review buttons while loading**

In the REVIEW MODAL section (around line 436), find the two action buttons and add the `reviewLoading` state:

```tsx
<button
  type="button"
  onClick={() => handleReviewAction(reviewCourse.id, 'reject')}
  disabled={reviewLoading}
  className="flex-1 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:text-red-400 text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  <XCircle size={18} weight="fill" /> {reviewLoading ? 'Processing…' : 'Reject Course'}
</button>
<button
  type="button"
  onClick={() => handleReviewAction(reviewCourse.id, 'accept')}
  disabled={reviewLoading}
  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  <CheckCircle size={18} weight="fill" /> {reviewLoading ? 'Processing…' : 'Approve & Publish'}
</button>
```

- [ ] **Step 7: TypeScript check**

```bash
cd client && npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/admin/AdminCourses.tsx
git commit -m "feat: wire AdminCourses to real API for fetch and approve/reject actions"
```

---

## Task 7: Update InstructorCourses — pending/rejected status handling

**Files:**
- Modify: `client/src/pages/instructor/InstructorCourses.tsx`

- [ ] **Step 1: Extend mapBackendCourse to handle all statuses**

Find `mapBackendCourse` (line ~74) and update the statusMap:

```tsx
function mapBackendCourse(c: any): InstructorCourse {
  const statusMap: Record<string, string> = {
    published: 'active',
    archived: 'draft',
    draft: 'draft',
    pending: 'pending',     // ← add
    rejected: 'rejected',   // ← add
  }
  return {
    id: c._id,
    title: c.title,
    students: c.enrolledStudents?.length || 0,
    status: statusMap[c.status] || c.status,
    nextClass: c.recurringSchedule?.[0] ? `${c.recurringSchedule[0].day}, ${c.recurringSchedule[0].time}` : 'TBD',
    progress: 0,
    totalClasses: c.totalSessions,
    maxStudents: c.maxStudents,
    level: c.level ? c.level.charAt(0).toUpperCase() + c.level.slice(1) : 'Beginner',
    duration: c.type,
    description: c.description,
    category: c.focus,
    price: c.price ? `${c.currency === 'PKR' ? 'Rs' : '$'}${c.price}` : '',
    startDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
    image: c.thumbnail,
    language: 'English',
  }
}
```

- [ ] **Step 2: Add toast to onSave after successful create**

Find the `onSave` function (around line 155). In the `modalType === 'add'` branch, add a toast after `setCourses`:

```tsx
if (modalType === 'add') {
  const res = await coursesService.createCourse({
    title: data.title,
    description: data.description || '',
    price: parseFloat(data.price?.replace(/[^0-9.]/g, '') || '0'),
    currency: 'USD',
    type: (data.category === 'Recorded Course' ? 'one-to-one' : data.category === 'Hybrid' ? 'hybrid' : 'group') as 'group' | 'one-to-one' | 'hybrid',
    level: (data.level?.toLowerCase() || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
    focus: 'general',
    thumbnail: data.image || undefined,
    totalSessions: data.totalClasses || 12,
    sessionDuration: 60,
    maxStudents: data.maxStudents,
  })
  if (res.success) {
    setCourses([...courses, mapBackendCourse(res.data)])
    toast.success('Course submitted for review. You will be notified when approved.')
  }
}
```

- [ ] **Step 3: Verify toast import**

Check that `import toast from 'react-hot-toast'` exists at the top of `InstructorCourses.tsx`. If not, add it.

- [ ] **Step 4: Add status badge colours for pending/rejected**

Search in `InstructorCourses.tsx` for where status badges are rendered (look for `STATUS_BADGE` or inline status class logic). The file likely has a status colour map. Find it and add:

```tsx
// If there's a map like this, extend it:
const STATUS_COLORS: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  draft:    'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400',
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
}

// And display labels:
const STATUS_LABELS: Record<string, string> = {
  active:   'Active',
  draft:    'Draft',
  pending:  'Under Review',
  rejected: 'Rejected',
}
```

Use `STATUS_LABELS[course.status] ?? course.status` wherever the status text is rendered.

- [ ] **Step 5: Add Re-submit button for rejected courses**

Find the course card action buttons in `InstructorCourses.tsx`. Add a re-submit button that appears only for rejected courses. Add `handleResubmit` before the return:

```tsx
async function handleResubmit(courseId: string) {
  try {
    const res = await coursesService.submitForReview(courseId)
    if (res.success) {
      setCourses(courses.map(c => c.id === courseId ? mapBackendCourse(res.data) : c))
      toast.success('Course resubmitted for review.')
    }
  } catch {
    toast.error('Could not resubmit. Please try again.')
  }
}
```

In the course card actions area, add (alongside or below existing buttons):

```tsx
{course.status === 'rejected' && (
  <button
    onClick={() => handleResubmit(course.id)}
    className="w-full mt-2 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold transition-colors"
  >
    Re-submit for Review
  </button>
)}
```

- [ ] **Step 6: TypeScript check**

```bash
cd client && npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/instructor/InstructorCourses.tsx
git commit -m "feat: add pending/rejected status handling in instructor course dashboard"
```

---

## Task 8: Wire CourseDetailsPage to real API data

**Files:**
- Modify: `client/src/pages/CourseDetailsPage.tsx`

- [ ] **Step 1: Add navigate-on-404 logic**

Find the `useEffect` that calls `getCourseById` (around line 329):

```tsx
useEffect(() => {
  if (id) {
    coursesService.getCourseById(id)
      .then(res => setApiCourse(res.data))
      .catch(() => {
        toast.error('Course not found.')
        navigate('/courses', { replace: true })
      })
  }
}, [id])
```

Make sure `navigate` is already imported from `react-router-dom` (it is, line 3).
Make sure `toast` is imported (it is, line 6).

- [ ] **Step 2: Extend the activeCourse merge**

Find the `activeCourse` computation (around line 336). Replace it with:

```tsx
const activeCourse = apiCourse
  ? {
      ...COURSE,
      id: apiCourse._id,
      title: apiCourse.title,
      description: apiCourse.description,
      price: apiCourse.currency === 'PKR'
        ? `Rs.${apiCourse.price?.toLocaleString()}`
        : `$${apiCourse.price}`,
      originalPrice: '',
      level: apiCourse.level
        ? apiCourse.level.charAt(0).toUpperCase() + apiCourse.level.slice(1)
        : COURSE.level,
      duration: `${apiCourse.totalSessions ?? 0} Sessions (${apiCourse.sessionDuration ?? 60} min each)`,
      image: apiCourse.thumbnail || COURSE.image,
      students: apiCourse.enrolledStudents?.length ?? 0,
      maxStudents: apiCourse.maxStudents ?? COURSE.maxStudents,
      schedule: apiCourse.recurringSchedule?.length
        ? apiCourse.recurringSchedule
            .map((s: { day: string; time: string }) => `${s.day.charAt(0).toUpperCase() + s.day.slice(1)} ${s.time}`)
            .join(', ')
        : COURSE.schedule,
      meetLink: apiCourse.meetLink || '',
      instructor: {
        ...COURSE.instructor,
        name: apiCourse.teacher?.name || COURSE.instructor.name,
        image: apiCourse.teacher?.profileImage || COURSE.instructor.image,
        bio: apiCourse.teacher?.bio || COURSE.instructor.bio,
      },
      whatYouWillLearn: COURSE.whatYouWillLearn,
      curriculum: COURSE.curriculum,
      reviewsList: COURSE.reviewsList,
    }
  : COURSE
```

- [ ] **Step 3: TypeScript check**

```bash
cd client && npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/CourseDetailsPage.tsx
git commit -m "feat: extend CourseDetailsPage to use real API data with 404 redirect"
```

---

## Task 9: End-to-end smoke test

Manual verification steps — do these in the browser with all three accounts.

- [ ] **As instructor (`instructor@englishpro.com` / `Instructor@123`)**
  1. Login → go to Instructor Dashboard → Courses
  2. Click "New Course", fill in title, description, price, sessions → Save
  3. Verify: toast says "Course submitted for review"
  4. Verify: course appears in list with **"Under Review"** amber badge

- [ ] **As admin (`graphicsanimation786@gmail.com` / `Nabeel@0308`)**
  1. Login → Admin Dashboard → Courses → "Pending Approvals" tab
  2. Verify: the newly created course appears with pending badge
  3. Click "Review & Approve" → click "Approve & Publish"
  4. Verify: toast "Course approved and published!", course disappears from pending tab
  5. Check "Manage Courses" tab — course now shows as `published`/`active`

- [ ] **As instructor (check notification)**
  1. Go back to instructor dashboard
  2. Check notifications — should see "Your course '...' has been approved and is now live."

- [ ] **As public user (no login)**
  1. Go to `http://localhost:5173/courses`
  2. Verify: approved course appears in the public listing
  3. Click the course → `CourseDetailsPage` opens with real title, description, price, instructor name

- [ ] **Reject flow test**
  1. As instructor: create a second course
  2. As admin: reject it with a reason
  3. As instructor: course shows **"Rejected"** red badge + "Re-submit for Review" button
  4. Click Re-submit → badge changes back to "Under Review"

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete course approval workflow — pending, review, publish, notify"
```
