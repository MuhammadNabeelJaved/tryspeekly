# Real-Time Live Class Updates via Socket.io — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Push all live class mutations (create, update, complete, cancel, schedule, reschedule, delete) to enrolled students via Socket.io so the student dashboard updates instantly without a page refresh.

**Architecture:** A new `server/src/utils/socket.js` singleton avoids circular imports between `index.js` and controllers. On student socket connect, enrolled course IDs are fetched from DB and the student joins `course:{courseId}` rooms. The live-class controller emits `live-class:updated` or `live-class:deleted` to the course room after each DB mutation. `StudentOverview` subscribes to these events and upserts or removes entries from `upcomingClasses` state.

**Tech Stack:** Socket.io 4.x (server), socket.io-client (client), Mongoose, React + TypeScript, Vitest + React Testing Library

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `server/src/utils/socket.js` | **CREATE** | `setIO` / `getIO` singleton — breaks circular import |
| `server/index.js` | **MODIFY** | Call `setIO(io)` + join student course rooms on connect |
| `server/src/controllers/live-class.controller.js` | **MODIFY** | Emit `live-class:updated` / `live-class:deleted` after every mutation |
| `client/src/pages/student/StudentOverview.tsx` | **MODIFY** | Subscribe to socket events; upsert/remove `upcomingClasses` state |
| `client/src/pages/student/__tests__/StudentOverview.socket.test.tsx` | **CREATE** | Vitest tests for socket event → UI update behaviour |

---

## Task 1: Create socket.js io singleton

**Files:**
- Create: `server/src/utils/socket.js`

- [ ] **Step 1: Create the file**

```js
// server/src/utils/socket.js
let _io = null

export const setIO = (io) => { _io = io }
export const getIO = () => _io
```

- [ ] **Step 2: Commit**

```bash
git add server/src/utils/socket.js
git commit -m "feat: add socket.js io singleton utility"
```

---

## Task 2: Wire setIO and join course rooms on connect

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Add imports at the top of server/index.js**

After the existing imports, add:
```js
import { setIO } from './src/utils/socket.js'
import Enrollment from './src/models/enrollment.model.js'
```

The full imports section should be:
```js
import dns from 'dns'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import app from './app.js'
import connectDB from './src/database/db.js'
import { setIO } from './src/utils/socket.js'
import Enrollment from './src/models/enrollment.model.js'
```

- [ ] **Step 2: Call setIO immediately after creating the Server**

Find this block:
```js
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
})
```

Add `setIO(io)` on the very next line:
```js
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
})

setIO(io)
```

- [ ] **Step 3: Replace the connection handler to join course rooms for students**

Replace the entire `io.on('connection', ...)` block (currently lines 37–44) with:

```js
io.on('connection', async (socket) => {
  const { id: userId, role } = socket.data.user ?? {}
  if (userId) socket.join(`user:${userId}`)

  if (role === 'student') {
    try {
      const enrollments = await Enrollment.find({ student: userId }).select('course').lean()
      enrollments.forEach((e) => socket.join(`course:${e.course}`))
    } catch (err) {
      console.warn('[Socket] failed to join course rooms for student:', err.message)
    }
  }

  socket.on('disconnect', () => {
    if (userId) socket.leave(`user:${userId}`)
  })
})
```

- [ ] **Step 4: Verify server starts without errors**

```bash
cd "server" && node index.js
```

Expected output (no errors):
```
✓ Server running in development mode on port 5000
```

Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add server/index.js
git commit -m "feat: join course rooms for students on socket connect"
```

---

## Task 3: Emit live-class events from controller

**Files:**
- Modify: `server/src/controllers/live-class.controller.js`

- [ ] **Step 1: Add getIO import**

At the top of `server/src/controllers/live-class.controller.js`, add the import after the existing ones:

```js
import asyncHandler from '../utils/asyncHandler.js'
import LiveClass from '../models/live-class.model.js'
import Course from '../models/course.model.js'
import Enrollment from '../models/enrollment.model.js'
import { getIO } from '../utils/socket.js'
```

- [ ] **Step 2: Update createLiveClass — add teacher populate + emit**

Find the `createLiveClass` handler. Replace the section after `LiveClass.create(...)`:

```js
const liveClass = await LiveClass.create({
  course: courseId,
  teacher: req.user.id,
  meetingLink,
  classNumber,
  status: 'active',
})

await liveClass.populate('course', 'title totalSessions')
await liveClass.populate('teacher', 'name profileImage')

getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

res.status(201).json({
  success: true,
  message: 'Live class started successfully',
  data: liveClass,
})
```

- [ ] **Step 3: Update updateLiveClass — add teacher populate + emit**

Find the `updateLiveClass` handler. Replace the save/populate/respond section:

```js
liveClass.meetingLink = meetingLink
await liveClass.save()

await liveClass.populate('course', 'title totalSessions')
await liveClass.populate('teacher', 'name profileImage')

getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

res.json({
  success: true,
  message: 'Live class updated successfully',
  data: liveClass,
})
```

- [ ] **Step 4: Update completeLiveClass — add teacher populate + emit**

Find the `completeLiveClass` handler. Replace the save/populate/respond section:

```js
liveClass.status = 'completed'
await liveClass.save()

await liveClass.populate('course', 'title totalSessions')
await liveClass.populate('teacher', 'name profileImage')

getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

res.json({
  success: true,
  message: 'Live class marked as completed',
  data: liveClass,
})
```

- [ ] **Step 5: Update cancelLiveClass — add teacher populate + emit**

Find the `cancelLiveClass` handler. Replace the save/populate/respond section:

```js
liveClass.status = 'cancelled'
await liveClass.save()

await liveClass.populate('course', 'title totalSessions')
await liveClass.populate('teacher', 'name profileImage')

getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

res.json({
  success: true,
  message: 'Live class cancelled',
  data: liveClass,
})
```

- [ ] **Step 6: Update scheduleClass — add teacher populate + emit**

Find the `scheduleClass` handler. Replace the populate/respond section after `LiveClass.create(...)`:

```js
await liveClass.populate('course', 'title totalSessions')
await liveClass.populate('teacher', 'name profileImage')

getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

res.status(201).json({
  success: true,
  message: 'Class scheduled successfully',
  data: liveClass,
})
```

- [ ] **Step 7: Update updateSchedule — add teacher populate + emit**

Find the `updateSchedule` handler. Replace the save/populate/respond section:

```js
liveClass.scheduledAt = new Date(scheduledAt)
await liveClass.save()

await liveClass.populate('course', 'title totalSessions')
await liveClass.populate('teacher', 'name profileImage')

getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

res.json({
  success: true,
  message: 'Schedule updated successfully',
  data: liveClass,
})
```

- [ ] **Step 8: Update deleteSchedule — emit live-class:deleted**

Find the `deleteSchedule` handler. After `liveClass.isDeleted = true` + `await liveClass.save()`, add the emit before `res.json(...)`:

```js
liveClass.isDeleted = true
await liveClass.save()

// liveClass.course is still an ObjectId here (not populated) — toString() via template literal is correct
getIO()?.to(`course:${liveClass.course}`).emit('live-class:deleted', { _id: liveClass._id })

res.json({
  success: true,
  message: 'Schedule removed successfully',
  data: null,
})
```

- [ ] **Step 9: Smoke test — verify WS frame arrives in browser**

1. Start server: `cd server && node index.js`
2. Start client: `cd client && npm run dev`
3. **Tab A** — log in as a student, open dashboard (`http://localhost:5173/dashboard`)
4. Open DevTools → Network → WS → select the socket.io connection → Frames tab
5. **Tab B** — log in as a teacher, use Postman or the instructor UI to PATCH a live class with a meeting link
6. **Tab A** — verify a `live-class:updated` frame appears in the WS Frames panel

- [ ] **Step 10: Commit**

```bash
git add server/src/controllers/live-class.controller.js
git commit -m "feat: emit live-class socket events after every mutation"
```

---

## Task 4: Subscribe to socket events in StudentOverview

**Files:**
- Modify: `client/src/pages/student/StudentOverview.tsx`
- Create: `client/src/pages/student/__tests__/StudentOverview.socket.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create directory and file `client/src/pages/student/__tests__/StudentOverview.socket.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import StudentOverview from '../StudentOverview'

vi.mock('@/services/enrollments.service', () => ({
  enrollmentsService: { getMyEnrollments: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/services/live-class.service', () => ({
  liveClassService: { getStudentUpcomingClasses: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/services/assignments.service', () => ({
  assignmentsService: { getMyAssignments: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/services/announcements.service', () => ({
  announcementsService: { getMyAnnouncements: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/services/payments.service', () => ({
  paymentsService: { getMyPayments: vi.fn().mockResolvedValue({ success: true, data: [] }) },
}))
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test Student', _id: 'student1' } }),
}))

// Fake socket that captures registered handlers
const handlers: Record<string, (payload: unknown) => void> = {}
const mockSocket = {
  on: vi.fn((event: string, handler: (payload: unknown) => void) => {
    handlers[event] = handler
  }),
  off: vi.fn((event: string) => {
    delete handlers[event]
  }),
}

vi.mock('@/context/SocketContext', () => ({
  useSocket: () => ({ socket: mockSocket, isConnected: true }),
}))

const renderComponent = () =>
  render(
    <BrowserRouter>
      <StudentOverview onNavigate={vi.fn()} />
    </BrowserRouter>
  )

const mockLiveClass = {
  _id: 'lc1',
  course: { _id: 'c1', title: 'English Basics', totalSessions: 20 },
  teacher: { _id: 't1', name: 'Mr. Ahmed', profileImage: '' },
  meetingLink: 'https://meet.google.com/abc-defg-hij',
  classNumber: 1,
  scheduledAt: null,
  createdAt: new Date().toISOString(),
  status: 'active' as const,
}

describe('StudentOverview — socket live-class events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(handlers).forEach((k) => delete handlers[k])
  })

  it('shows "Join Live Class" button when live-class:updated fires with active status', async () => {
    renderComponent()

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    expect(screen.getByText(/join live class/i)).toBeInTheDocument()
  })

  it('removes the join button when live-class:updated fires with completed status', async () => {
    renderComponent()

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    await act(async () => {
      handlers['live-class:updated']?.({ ...mockLiveClass, status: 'completed' })
    })

    expect(screen.queryByText(/join live class/i)).not.toBeInTheDocument()
  })

  it('removes the join button when live-class:updated fires with cancelled status', async () => {
    renderComponent()

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    await act(async () => {
      handlers['live-class:updated']?.({ ...mockLiveClass, status: 'cancelled' })
    })

    expect(screen.queryByText(/join live class/i)).not.toBeInTheDocument()
  })

  it('removes the join button when live-class:deleted fires', async () => {
    renderComponent()

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    await act(async () => {
      handlers['live-class:deleted']?.({ _id: 'lc1' })
    })

    expect(screen.queryByText(/join live class/i)).not.toBeInTheDocument()
  })

  it('upserts without duplicating when same _id fires twice', async () => {
    renderComponent()

    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })
    await act(async () => {
      handlers['live-class:updated']?.(mockLiveClass)
    })

    expect(screen.getAllByText(/join live class/i)).toHaveLength(1)
  })

  it('registers and cleans up both socket listeners on unmount', () => {
    const { unmount } = renderComponent()

    expect(mockSocket.on).toHaveBeenCalledWith('live-class:updated', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('live-class:deleted', expect.any(Function))

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith('live-class:updated', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('live-class:deleted', expect.any(Function))
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd client && npx vitest run src/pages/student/__tests__/StudentOverview.socket.test.tsx
```

Expected: All 6 tests **FAIL** — `handlers['live-class:updated']` is never registered because the listener doesn't exist yet.

- [ ] **Step 3: Add useSocket import to StudentOverview.tsx**

Open `client/src/pages/student/StudentOverview.tsx`. Find the existing imports block. Add:

```tsx
import { useSocket } from '@/context/SocketContext'
```

- [ ] **Step 4: Add createdAt to the UpcomingClass interface**

Find the `UpcomingClass` interface near the top of the file. Add `createdAt` (the component already uses it for display):

```tsx
interface UpcomingClass {
  _id: string
  course: { _id: string; title: string; totalSessions: number }
  teacher: { _id: string; name: string }
  meetingLink: string
  classNumber: number
  scheduledAt: string | null
  createdAt: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
}
```

- [ ] **Step 5: Destructure socket from useSocket**

Find:
```tsx
const { user } = useAuth()
```

Add below it:
```tsx
const { socket } = useSocket()
```

- [ ] **Step 6: Add socket event listener useEffect**

Add this `useEffect` immediately after the existing data-fetch `useEffect` (the one that calls `fetchAll`):

```tsx
useEffect(() => {
  if (!socket) return

  const handleUpdated = (liveClass: UpcomingClass) => {
    setUpcomingClasses((prev) => {
      const filtered = prev.filter((c) => c._id !== liveClass._id)
      if (liveClass.status === 'active' || liveClass.status === 'scheduled') {
        return [...filtered, liveClass]
      }
      return filtered
    })
  }

  const handleDeleted = ({ _id }: { _id: string }) => {
    setUpcomingClasses((prev) => prev.filter((c) => c._id !== _id))
  }

  socket.on('live-class:updated', handleUpdated)
  socket.on('live-class:deleted', handleDeleted)

  return () => {
    socket.off('live-class:updated', handleUpdated)
    socket.off('live-class:deleted', handleDeleted)
  }
}, [socket])
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
cd client && npx vitest run src/pages/student/__tests__/StudentOverview.socket.test.tsx
```

Expected: All 6 tests **PASS**.

- [ ] **Step 8: Run full client test suite — check for regressions**

```bash
cd client && npx vitest run
```

Expected: All tests pass, no regressions.

- [ ] **Step 9: End-to-end manual test**

1. Start server: `cd server && node index.js`
2. Start client: `cd client && npm run dev`
3. **Tab A** — log in as a student, open `http://localhost:5173/dashboard`
4. **Tab B** — log in as a teacher, go to a course that the student is enrolled in
5. Teacher starts a live class (without a meeting link) → banner in Tab A should appear showing "Link not set yet" without refresh
6. Teacher adds a meeting link via PATCH → Tab A shows "Join Live Class" button without refresh
7. Teacher marks the class as completed → Tab A banner disappears without refresh
8. Teacher schedules a new class → Tab A shows the scheduled class without refresh
9. Teacher deletes the schedule → Tab A removes it without refresh

- [ ] **Step 10: Commit**

```bash
git add client/src/pages/student/StudentOverview.tsx client/src/pages/student/__tests__/StudentOverview.socket.test.tsx
git commit -m "feat: real-time live class updates on student dashboard via socket.io"
```

---

## Done

All four files are wired together. The feature is complete when:
- `vitest run` passes (6 new tests + no regressions)
- Manual end-to-end test in Step 9 of Task 4 passes with zero page refreshes
