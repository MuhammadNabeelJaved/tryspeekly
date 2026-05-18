# Instructor Dashboard Feature Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 features to the instructor dashboard: fix the class history counter display, add DB-persisted class scheduling with edit/delete, add Live Classes Workspace filters, add loading states across instructor pages, increase the global rate limit, and verify the My Students DB fetch.

**Architecture:** Server changes extend the existing `live-class.model.js` (add `scheduledAt` + `'scheduled'` status) and add three new controller functions + routes. Frontend changes are isolated to the four instructor pages plus the live-class service. No new files needed — all changes extend existing modules.

**Tech Stack:** Node.js + Express + Mongoose (server, JS ESM), React + TypeScript + Tailwind + Framer Motion (client)

---

## File Map

| File | What changes |
|---|---|
| `server/app.js` | Rate limit `max` 100 → 500 |
| `server/src/models/live-class.model.js` | Add `scheduledAt` field, add `'scheduled'` status, make `meetingLink` optional |
| `server/src/controllers/live-class.controller.js` | Add `scheduleClass`, `updateSchedule`, `deleteSchedule` |
| `server/src/routes/live-class.route.js` | Wire three new schedule endpoints |
| `client/src/services/live-class.service.ts` | Add `scheduleClass`, `updateSchedule`, `deleteSchedule` methods |
| `client/src/pages/instructor/InstructorLiveClasses.tsx` | Counter fix, workspace filters, DB-persisted scheduling |
| `client/src/pages/instructor/InstructorOverview.tsx` | Add loading skeleton |
| `client/src/pages/instructor/InstructorCourses.tsx` | Add loading skeleton |

---

## Task 1: Increase Rate Limit

**Files:**
- Modify: `server/app.js:36-40`

- [ ] **Step 1: Update the rate limiter `max` value**

In `server/app.js`, change the `globalLimiter`:

```js
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, error: { message: 'Too many requests, please try again later.' } }
})
```

- [ ] **Step 2: Verify server restarts without error**

```
npm run dev  (in server/)
```
Expected: Server starts on port 5000, no errors.

- [ ] **Step 3: Commit**

```bash
git add server/app.js
git commit -m "feat: increase global rate limit to 500 req/15min for dashboard use"
```

---

## Task 2: Extend LiveClass Model for Scheduling

**Files:**
- Modify: `server/src/models/live-class.model.js`

- [ ] **Step 1: Add `scheduledAt` field, `'scheduled'` status, make `meetingLink` optional**

Replace the entire file content:

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const liveClassSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
    },
    classNumber: {
      type: Number,
      default: 0,
      min: [0, 'Class number must be at least 0'],
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled'],
      default: 'active',
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
)

liveClassSchema.pre(/^find/, function () {
  this.where({ isDeleted: false })
})

const LiveClass = mongoose.models.LiveClass || model('LiveClass', liveClassSchema)

export default LiveClass
```

- [ ] **Step 2: Restart server and confirm no Mongoose schema errors**

```
npm run dev  (in server/)
```
Expected: Server starts, MongoDB connects — no cast/validation errors in console.

- [ ] **Step 3: Commit**

```bash
git add server/src/models/live-class.model.js
git commit -m "feat: add scheduledAt field and scheduled status to LiveClass model"
```

---

## Task 3: Add Schedule Controller Functions

**Files:**
- Modify: `server/src/controllers/live-class.controller.js`

- [ ] **Step 1: Add `scheduleClass` controller (append at end of file)**

Add the following three functions after the existing `getTeacherCompletedClasses` function:

```js
// POST /api/v1/live-classes/schedule - Create a scheduled class
export const scheduleClass = asyncHandler(async (req, res) => {
  const { courseId, scheduledAt } = req.body

  if (!courseId || !scheduledAt) {
    return res.status(400).json({ success: false, message: 'courseId and scheduledAt are required' })
  }

  const course = await Course.findById(courseId)
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' })
  }

  if (course.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to schedule class for this course' })
  }

  // Remove any existing scheduled class for this course before creating new one
  await LiveClass.updateMany(
    { course: courseId, teacher: req.user.id, status: 'scheduled' },
    { isDeleted: true }
  )

  const liveClass = await LiveClass.create({
    course: courseId,
    teacher: req.user.id,
    meetingLink: '',
    classNumber: 0,
    scheduledAt: new Date(scheduledAt),
    status: 'scheduled',
  })

  await liveClass.populate('course', 'title totalSessions')

  res.status(201).json({
    success: true,
    message: 'Class scheduled successfully',
    data: liveClass,
  })
})

// PATCH /api/v1/live-classes/:id/reschedule - Update scheduled datetime
export const updateSchedule = asyncHandler(async (req, res) => {
  const { scheduledAt } = req.body

  if (!scheduledAt) {
    return res.status(400).json({ success: false, message: 'scheduledAt is required' })
  }

  const liveClass = await LiveClass.findById(req.params.id)
  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Scheduled class not found' })
  }

  if (liveClass.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this schedule' })
  }

  if (liveClass.status !== 'scheduled') {
    return res.status(400).json({ success: false, message: 'Only scheduled classes can be rescheduled' })
  }

  liveClass.scheduledAt = new Date(scheduledAt)
  await liveClass.save()

  await liveClass.populate('course', 'title totalSessions')

  res.json({
    success: true,
    message: 'Schedule updated successfully',
    data: liveClass,
  })
})

// DELETE /api/v1/live-classes/:id/schedule - Remove a scheduled class
export const deleteSchedule = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id)
  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Scheduled class not found' })
  }

  if (liveClass.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this schedule' })
  }

  if (liveClass.status !== 'scheduled') {
    return res.status(400).json({ success: false, message: 'Only scheduled classes can be deleted this way' })
  }

  liveClass.isDeleted = true
  await liveClass.save()

  res.json({
    success: true,
    message: 'Schedule removed successfully',
    data: null,
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/live-class.controller.js
git commit -m "feat: add scheduleClass, updateSchedule, deleteSchedule controllers"
```

---

## Task 4: Add Schedule Routes

**Files:**
- Modify: `server/src/routes/live-class.route.js`

- [ ] **Step 1: Import new controllers and add routes**

Replace the entire file:

```js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  createLiveClass,
  updateLiveClass,
  completeLiveClass,
  cancelLiveClass,
  getActiveLiveClasses,
  getLiveClassByCourse,
  getTeacherLiveClasses,
  getTeacherCompletedClasses,
  scheduleClass,
  updateSchedule,
  deleteSchedule,
} from '../controllers/live-class.controller.js'

const router = express.Router()

// IMPORTANT: Specific routes must come before parameterized routes
router.route('/teacher').get(authenticate, authorize('teacher'), getTeacherLiveClasses)
router.route('/teacher/completed').get(authenticate, authorize('teacher'), getTeacherCompletedClasses)
router.route('/active').get(getActiveLiveClasses)
router.route('/course/:courseId').get(getLiveClassByCourse)
router.route('/schedule').post(authenticate, authorize('teacher'), scheduleClass)
router.route('/').post(authenticate, authorize('teacher'), createLiveClass)
router.route('/:id').patch(authenticate, authorize('teacher'), updateLiveClass)
router.route('/:id/complete').patch(authenticate, authorize('teacher'), completeLiveClass)
router.route('/:id/cancel').patch(authenticate, authorize('teacher'), cancelLiveClass)
router.route('/:id/reschedule').patch(authenticate, authorize('teacher'), updateSchedule)
router.route('/:id/schedule').delete(authenticate, authorize('teacher'), deleteSchedule)

export default router
```

- [ ] **Step 2: Quick smoke test via curl (optional but recommended)**

```bash
# Get teacher live classes (should include scheduled ones)
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/v1/live-classes/teacher
```
Expected: `{ "success": true, "data": [...] }`

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/live-class.route.js
git commit -m "feat: add schedule CRUD routes to live-class router"
```

---

## Task 5: Update Frontend Live-Class Service

**Files:**
- Modify: `client/src/services/live-class.service.ts`

- [ ] **Step 1: Add schedule methods to the service**

Replace the entire file:

```ts
import { axiosClient } from '../lib/axiosClient';
import type { ApiResponse } from '../types/api';

interface LiveClass {
  _id: string;
  course: {
    _id: string;
    title: string;
    totalSessions: number;
  };
  teacher: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  meetingLink: string;
  classNumber: number;
  scheduledAt: string | null;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export const liveClassService = {
  async startLiveClass(dto: {
    courseId: string;
    meetingLink: string;
    classNumber: number;
  }): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.post<ApiResponse<LiveClass>>('/live-classes', dto);
    return response.data;
  },

  async updateLiveClass(id: string, meetingLink: string): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.patch<ApiResponse<LiveClass>>(`/live-classes/${id}`, { meetingLink });
    return response.data;
  },

  async completeLiveClass(id: string): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.patch<ApiResponse<LiveClass>>(`/live-classes/${id}/complete`);
    return response.data;
  },

  async cancelLiveClass(id: string): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.patch<ApiResponse<LiveClass>>(`/live-classes/${id}/cancel`);
    return response.data;
  },

  async getTeacherLiveClasses(): Promise<ApiResponse<LiveClass[]>> {
    const response = await axiosClient.get<ApiResponse<LiveClass[]>>('/live-classes/teacher');
    return response.data;
  },

  async getActiveLiveClasses(): Promise<ApiResponse<LiveClass[]>> {
    const response = await axiosClient.get<ApiResponse<LiveClass[]>>('/live-classes/active');
    return response.data;
  },

  async getLiveClassByCourse(courseId: string): Promise<ApiResponse<LiveClass | null>> {
    const response = await axiosClient.get<ApiResponse<LiveClass | null>>(`/live-classes/course/${courseId}`);
    return response.data;
  },

  async getTeacherCompletedClasses(): Promise<ApiResponse<LiveClass[]>> {
    const response = await axiosClient.get<ApiResponse<LiveClass[]>>('/live-classes/teacher/completed');
    return response.data;
  },

  async scheduleClass(dto: { courseId: string; scheduledAt: string }): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.post<ApiResponse<LiveClass>>('/live-classes/schedule', dto);
    return response.data;
  },

  async updateSchedule(id: string, scheduledAt: string): Promise<ApiResponse<LiveClass>> {
    const response = await axiosClient.patch<ApiResponse<LiveClass>>(`/live-classes/${id}/reschedule`, { scheduledAt });
    return response.data;
  },

  async deleteSchedule(id: string): Promise<ApiResponse<null>> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/live-classes/${id}/schedule`);
    return response.data;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add client/src/services/live-class.service.ts
git commit -m "feat: add scheduleClass, updateSchedule, deleteSchedule to live-class service"
```

---

## Task 6: InstructorLiveClasses — Counter Fix, Filters, DB Scheduling

This is the largest task. It has three sub-goals, all in `InstructorLiveClasses.tsx`.

**Files:**
- Modify: `client/src/pages/instructor/InstructorLiveClasses.tsx`

### 6a: Add `ScheduledClass` type and state

- [ ] **Step 1: Add new type and state variables**

After the existing `CompletedClass` type (around line 44), add:

```tsx
type ScheduledClass = {
  _id: string
  courseId: string
  scheduledAt: string
}
```

After the existing `completedClasses` state (around line 80), add:

```tsx
const [scheduledClasses, setScheduledClasses] = useState<Record<string, ScheduledClass>>({})
const [isSavingSchedule, setIsSavingSchedule] = useState(false)
```

Also change the schedule input type to accommodate datetime-local format. Change:
```tsx
const [scheduleInput, setScheduleInput] = useState('')
```
to stay as-is (it will hold `YYYY-MM-DDTHH:mm` value).

### 6b: Add workspace filter state

- [ ] **Step 2: Add filter state variables**

After `const [mainSearchTerm, setMainSearchTerm] = useState('')` (line 65), add:

```tsx
const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming'>('all')
const [levelFilter, setLevelFilter] = useState<string>('all')
```

### 6c: Fetch scheduled classes in the main useEffect

- [ ] **Step 3: Update the main `fetchData` useEffect to extract scheduled classes**

Inside the `fetchData` function, after the line `const completedLiveClasses = liveClassesRes.data?.filter(...)`, add:

```tsx
const scheduledLiveClasses = liveClassesRes.data?.filter((lc: { status: string }) => lc.status === 'scheduled') || []

const scheduledMap: Record<string, ScheduledClass> = {}
scheduledLiveClasses.forEach((lc: { _id: string; course: { _id: string }; scheduledAt: string }) => {
  scheduledMap[String(lc.course._id)] = {
    _id: lc._id,
    courseId: String(lc.course._id),
    scheduledAt: lc.scheduledAt,
  }
})
setScheduledClasses(scheduledMap)
```

### 6d: Replace schedule handlers with API calls

- [ ] **Step 4: Replace `openScheduleModal`, `handleSaveSchedule`, `handleRemoveSchedule`**

Replace the three existing schedule handler functions (lines ~407-423) with:

```tsx
function openScheduleModal(course: InstructorCourse) {
  setScheduleModalCourse(course)
  const existing = scheduledClasses[course.id || course._id]
  if (existing?.scheduledAt) {
    // Convert ISO string to datetime-local format: YYYY-MM-DDTHH:mm
    const dt = new Date(existing.scheduledAt)
    const pad = (n: number) => String(n).padStart(2, '0')
    const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
    setScheduleInput(local)
  } else {
    setScheduleInput('')
  }
}

async function handleSaveSchedule() {
  if (!scheduleModalCourse || !scheduleInput) return
  const courseId = scheduleModalCourse._id || scheduleModalCourse.id
  const existing = scheduledClasses[courseId]
  setIsSavingSchedule(true)
  try {
    if (existing) {
      const res = await liveClassService.updateSchedule(existing._id, new Date(scheduleInput).toISOString())
      if (res.success) {
        setScheduledClasses(prev => ({
          ...prev,
          [courseId]: { _id: existing._id, courseId, scheduledAt: res.data.scheduledAt! }
        }))
        toast.success('Schedule updated!')
      }
    } else {
      const res = await liveClassService.scheduleClass({ courseId, scheduledAt: new Date(scheduleInput).toISOString() })
      if (res.success) {
        setScheduledClasses(prev => ({
          ...prev,
          [courseId]: { _id: res.data._id, courseId, scheduledAt: res.data.scheduledAt! }
        }))
        toast.success('Class scheduled!')
      }
    }
  } catch {
    toast.error('Failed to save schedule')
  } finally {
    setIsSavingSchedule(false)
    setScheduleModalCourse(null)
  }
}

async function handleRemoveSchedule() {
  if (!scheduleModalCourse) return
  const courseId = scheduleModalCourse._id || scheduleModalCourse.id
  const existing = scheduledClasses[courseId]
  if (!existing) { setScheduleModalCourse(null); return }
  setIsSavingSchedule(true)
  try {
    const res = await liveClassService.deleteSchedule(existing._id)
    if (res.success) {
      setScheduledClasses(prev => {
        const copy = { ...prev }
        delete copy[courseId]
        return copy
      })
      toast.success('Schedule removed')
    }
  } catch {
    toast.error('Failed to remove schedule')
  } finally {
    setIsSavingSchedule(false)
    setScheduleModalCourse(null)
  }
}
```

### 6e: Fix the counter display

- [ ] **Step 5: Fix `{completed} / {course.totalClasses} Completed` (line ~697)**

Find this JSX block inside the course card:

```tsx
<div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md text-xs border ${isAllCompleted ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-neutral-800/80 text-violet-600 dark:text-violet-400 border-slate-200 dark:border-neutral-700'}`}>
  {isAllCompleted ? <CheckCircle size={14} weight="fill" /> : <ListDashes size={14} weight="bold" />}
  {completed} / {course.totalClasses} Completed
</div>
```

Replace it with:

```tsx
<div className="flex items-center gap-2">
  <div className="flex items-center gap-1 font-bold px-2 py-1 rounded-md text-xs border bg-slate-50 dark:bg-neutral-800/80 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700">
    <ListDashes size={12} weight="bold" />
    {course.totalClasses} Total
  </div>
  <div className={`flex items-center gap-1 font-bold px-2 py-1 rounded-md text-xs border ${isAllCompleted ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800'}`}>
    {isAllCompleted ? <CheckCircle size={12} weight="fill" /> : <CheckCircle size={12} weight="regular" />}
    {completed} Done
  </div>
</div>
```

### 6f: Update `filteredMainCourses` to include filter logic

- [ ] **Step 6: Replace the `filteredMainCourses` derivation**

Find (around line 549):
```tsx
const filteredMainCourses = courses.filter(c => 
  c.title.toLowerCase().includes(mainSearchTerm.toLowerCase())
)
```

Replace with:
```tsx
const filteredMainCourses = courses.filter(c => {
  const matchesSearch = c.title.toLowerCase().includes(mainSearchTerm.toLowerCase())
  const matchesStatus = statusFilter === 'all'
    || (statusFilter === 'live' && c.isLive)
    || (statusFilter === 'upcoming' && !c.isLive)
  const matchesLevel = levelFilter === 'all' || (c.level || '').toLowerCase() === levelFilter.toLowerCase()
  return matchesSearch && matchesStatus && matchesLevel
})
```

### 6g: Add filter bar to the workspace header

- [ ] **Step 7: Add filter chips below the search/history bar**

In the header section, right after the closing `</div>` of the flex row containing the search input and history button (around line 619), add a new filter bar row:

```tsx
{/* Filter bar */}
<div className="flex flex-wrap items-center gap-3 mt-1">
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
    {(['all', 'live', 'upcoming'] as const).map(s => (
      <button
        key={s}
        onClick={() => setStatusFilter(s)}
        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
          statusFilter === s
            ? 'bg-violet-600 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
        }`}
      >
        {s === 'all' ? 'All' : s === 'live' ? 'Live Now' : 'Upcoming'}
      </button>
    ))}
  </div>
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level:</span>
    {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(l => (
      <button
        key={l}
        onClick={() => setLevelFilter(l)}
        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors capitalize ${
          levelFilter === l
            ? 'bg-violet-600 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
        }`}
      >
        {l === 'all' ? 'All Levels' : l}
      </button>
    ))}
  </div>
</div>
```

### 6h: Update course card to show scheduled datetime

- [ ] **Step 8: Replace the `course.nextClass` display in the card**

Find the `Next Class` row in the course card (around line 673-683):
```tsx
<p className="font-semibold truncate">{course.nextClass !== 'TBD' ? course.nextClass : 'Not Scheduled'}</p>
```

Replace with:
```tsx
{(() => {
  const courseId = (course.id || course._id || '').toString()
  const scheduled = scheduledClasses[courseId]
  if (scheduled?.scheduledAt) {
    const dt = new Date(scheduled.scheduledAt)
    return (
      <p className="font-semibold truncate text-violet-700 dark:text-violet-300">
        {dt.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </p>
    )
  }
  return <p className="font-semibold truncate text-slate-400">Not Scheduled</p>
})()}
```

### 6i: Update schedule modal input to `datetime-local`

- [ ] **Step 9: Change the schedule modal text input to datetime-local**

In the schedule modal (around line 950), find:
```tsx
<input 
  type="text" 
  value={scheduleInput} 
  onChange={e => setScheduleInput(e.target.value)} 
  placeholder="e.g. Tomorrow, 4:00 PM"
  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" 
/>
```

Replace with:
```tsx
<input 
  type="datetime-local" 
  value={scheduleInput} 
  onChange={e => setScheduleInput(e.target.value)} 
  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" 
/>
```

Also update the label:
```tsx
<label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Next Class Date & Time</label>
```

And remove the hint text below it (`<p className="text-[10px] text-slate-400 mt-2">This will be displayed to students...`).

Also update the "Update Schedule" button to show a loading state — find:
```tsx
<button 
  onClick={handleSaveSchedule} 
  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-md shadow-violet-600/20 transition-colors flex items-center justify-center gap-2"
>
  <Check size={16} /> Update Schedule
</button>
```

Replace with:
```tsx
<button 
  onClick={handleSaveSchedule}
  disabled={isSavingSchedule || !scheduleInput}
  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-md shadow-violet-600/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
>
  {isSavingSchedule ? (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  ) : (
    <Check size={16} />
  )}
  {scheduleModalCourse && scheduledClasses[scheduleModalCourse._id || scheduleModalCourse.id] ? 'Update Schedule' : 'Save Schedule'}
</button>
```

Also update the Remove button:
```tsx
<button 
  onClick={handleRemoveSchedule} 
  disabled={isSavingSchedule || !scheduleModalCourse || !scheduledClasses[scheduleModalCourse._id || scheduleModalCourse.id]}
  className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
>
  <Trash size={14} /> Remove
</button>
```

- [ ] **Step 10: Commit**

```bash
git add client/src/pages/instructor/InstructorLiveClasses.tsx client/src/services/live-class.service.ts
git commit -m "feat: counter fix, workspace filters, DB-persisted scheduling in InstructorLiveClasses"
```

---

## Task 7: Add Loading State to InstructorOverview

**Files:**
- Modify: `client/src/pages/instructor/InstructorOverview.tsx`

- [ ] **Step 1: Add `isLoading` state**

After `const [earnings, setEarnings] = useState(0)` (line 24), add:

```tsx
const [isLoading, setIsLoading] = useState(true)
```

- [ ] **Step 2: Set loading state in the fetchData effect**

Wrap `fetchData` to set loading. The existing `useEffect` starts at line 27. Add `setIsLoading(true)` at the start of `fetchData` and `setIsLoading(false)` in a `finally` block:

```tsx
useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true)
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
      // show zeros on error
    } finally {
      setIsLoading(false)
    }
  }
  fetchData()
}, [])
```

- [ ] **Step 3: Add skeleton render before the main return**

Add this block right before the final `return (` in the component (after all the derived values like `activeCourses`, `totalStudents`, etc.):

```tsx
if (isLoading) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-neutral-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-slate-100 dark:bg-neutral-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        ))}
      </div>
      {/* Course list skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/instructor/InstructorOverview.tsx
git commit -m "feat: add loading skeleton to InstructorOverview"
```

---

## Task 8: Add Loading State to InstructorCourses

**Files:**
- Modify: `client/src/pages/instructor/InstructorCourses.tsx`

- [ ] **Step 1: Add `isLoading` state**

After the `setSortBy` state declaration (around line 143), add:

```tsx
const [isLoading, setIsLoading] = useState(true)
```

- [ ] **Step 2: Set loading state in the `fetchCourses` useEffect**

The existing `fetchCourses` function starts at line 149. Wrap it:

```tsx
useEffect(() => {
  const fetchCourses = async () => {
    setIsLoading(true)
    try {
      const [res, liveClassesRes] = await Promise.all([
        coursesService.getTeacherCourses(),
        liveClassService.getTeacherLiveClasses()
      ])

      const completedMap: Record<string, number> = {}
      if (liveClassesRes.success && liveClassesRes.data) {
        const completedClasses = liveClassesRes.data.filter((lc: { status: string }) => lc.status === 'completed')
        completedClasses.forEach((lc: { course: { _id: string } }) => {
          const key = String(lc.course._id)
          completedMap[key] = (completedMap[key] || 0) + 1
        })
        setCompletedClassesMap(completedMap)
      }
      if (res.success && res.data.length > 0) {
        setCourses(res.data.map(mapBackendCourse))
      } else {
        setCourses(FALLBACK_COURSES)
      }
    } catch {
      setCourses(FALLBACK_COURSES)
    } finally {
      setIsLoading(false)
    }
  }
  fetchCourses()
}, [])
```

- [ ] **Step 3: Add skeleton render**

Right before the `return (` of `InstructorCourses` (find it after the `useForm` call and handler functions), add:

```tsx
if (isLoading) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-slate-100 dark:bg-neutral-700 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-56 bg-slate-100 dark:bg-neutral-800 rounded-3xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/instructor/InstructorCourses.tsx
git commit -m "feat: add loading skeleton to InstructorCourses"
```

---

## Task 9: Verify My Students End-to-End

The `InstructorStudents` page already calls `enrollmentsService.getTeacherEnrollments()` → `GET /api/v1/enrollments/teacher/my` → `Enrollment.find({ teacher: req.user.id })`. This is fully DB-backed. 

- [ ] **Step 1: Confirm `teacher` field is set on new enrollments**

Open `server/src/controllers/enrollment.controller.js` at the `createEnrollment` function. Verify line `teacher: course.teacher` is present in the `Enrollment.create()` call. It should already be there.

- [ ] **Step 2: Manual smoke test**

1. Log in as a teacher.
2. Navigate to `/instructor/students`.
3. Confirm students enrolled in that teacher's courses appear.
4. Use the course filter dropdown — confirm it shows only courses belonging to this teacher.

If students don't appear: check the browser Network tab for `GET /api/v1/enrollments/teacher/my` — look at response `data` array.

- [ ] **Step 3: Commit if no changes were needed (or commit any fix)**

```bash
git status
# If no changes: nothing to commit
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Class history counter fix → Task 6e
- [x] DB-persisted scheduling with edit + delete → Tasks 2, 3, 4, 5, 6d, 6h, 6i
- [x] Workspace filters (status + level) → Tasks 6b, 6f, 6g
- [x] Loading states for pages missing them → Tasks 7, 8
- [x] Rate limit increase → Task 1
- [x] My Students DB fetch → Task 9

**Placeholder scan:** No TBDs or TODOs present. All code blocks are complete.

**Type consistency:**
- `ScheduledClass._id` used in `handleSaveSchedule` and `handleRemoveSchedule` matches type definition
- `liveClassService.scheduleClass` / `updateSchedule` / `deleteSchedule` signatures match what's defined in Task 5
- `scheduledClasses` keyed by `courseId` (string) throughout — consistent
- `res.data.scheduledAt` typed as `string | null` in `LiveClass` interface — consistent with model

---

All tasks are ready to execute.
