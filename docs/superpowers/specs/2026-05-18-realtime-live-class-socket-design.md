# Real-Time Live Class Updates via Socket.io

**Date:** 2026-05-18
**Branch:** feat/lms-feature-connections
**Status:** Approved

---

## Problem

When a teacher creates, updates, completes, cancels, or schedules a live class, enrolled students must manually refresh their dashboard to see the change. The goal is to push all live class mutations to connected students instantly using the existing Socket.io infrastructure.

---

## Architecture

Four files are modified; one new utility file is added.

```
server/src/utils/socket.js          ← NEW: singleton io holder
server/index.js                     ← EDIT: join course rooms on student connect
server/src/controllers/
  live-class.controller.js          ← EDIT: emit after every DB mutation
client/src/pages/student/
  StudentOverview.tsx               ← EDIT: subscribe to events, update state
```

### Why a separate `socket.js` utility

`index.js` imports `app.js` → routes → controllers. A direct import of `io` from `index.js` inside a controller would create a circular dependency. The utility breaks the cycle:

```js
// server/src/utils/socket.js
let _io = null
export const setIO = (io) => { _io = io }
export const getIO = () => _io
```

`index.js` calls `setIO(io)` immediately after creating the server. Controllers call `getIO()` — if it returns `null` (e.g. during tests), the emit is silently skipped and the HTTP response is unaffected.

---

## Room Strategy — Course Rooms

On every authenticated socket connection:
- User joins their personal room `user:{userId}` (existing behavior, kept as-is)
- If `role === 'student'`, additionally fetch `Enrollment.find({ student: userId })` and join `course:{courseId}` for each enrolled course

Teachers do **not** join course rooms — they are the senders, not receivers, of these events.

Room join is async. A failure in enrollment fetch logs a warning but does **not** drop the connection.

---

## Socket Events

### Emitted by server → `course:{courseId}` room

| Event | Trigger | Payload |
|-------|---------|---------|
| `live-class:updated` | createLiveClass, updateLiveClass, completeLiveClass, cancelLiveClass, scheduleClass, updateSchedule | Full `liveClass` object populated with `course {_id, title, totalSessions}` and `teacher {_id, name, profileImage}` |
| `live-class:deleted` | deleteSchedule | `{ _id: string }` |

A single `live-class:updated` event covers all mutation types. The `status` field in the payload tells the client what to do:
- `active` or `scheduled` → upsert into `upcomingClasses`
- `completed` or `cancelled` → remove from `upcomingClasses`

### Client-side handler in `StudentOverview.tsx`

```ts
socket.on('live-class:updated', (liveClass) => {
  setUpcomingClasses(prev => {
    const filtered = prev.filter(c => c._id !== liveClass._id)
    if (liveClass.status === 'active' || liveClass.status === 'scheduled') {
      return [...filtered, liveClass]
    }
    return filtered   // completed or cancelled → just remove
  })
})

socket.on('live-class:deleted', ({ _id }) => {
  setUpcomingClasses(prev => prev.filter(c => c._id !== _id))
})

return () => {
  socket.off('live-class:updated')
  socket.off('live-class:deleted')
}
```

---

## Data Flow

```
Teacher HTTP action (POST / PATCH / DELETE)
    │
    ▼
live-class.controller.js
    ├─ Mongoose save / update
    ├─ populate course + teacher fields
    └─ getIO()?.to(`course:${courseId}`).emit('live-class:updated', liveClass)
                        │
              Socket.io broadcasts to room
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
     Student A (connected)      Student B (connected)
     StudentOverview             StudentOverview
     state upsert/remove         state upsert/remove
     (no HTTP re-fetch)          (no HTTP re-fetch)
```

---

## Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| `getIO()` returns null (socket not yet initialized) | Emit silently skipped; HTTP response unaffected |
| Enrollment fetch fails on connect | `try/catch` — warning logged, socket still connects, student misses real-time but initial HTTP fetch still works |
| Student was offline during mutation | Next page open triggers `liveClassService.getStudentUpcomingClasses()` HTTP fetch — always fresh |
| Duplicate event (same `_id`) | Upsert logic: filter-then-prepend prevents duplicates |
| `StudentOverview` unmounts | `useEffect` cleanup removes both listeners — no memory leak |
| Student enrolled mid-session | Will not be in course room for current session; gets update on next reconnect |

---

## Files Changed

### `server/src/utils/socket.js` (new)
- Exports `setIO` and `getIO`

### `server/index.js`
- Import `setIO` from `./src/utils/socket.js`
- Call `setIO(io)` after `new Server(...)`
- In `io.on('connection')`: if role is `student`, fetch enrollments and join course rooms

### `server/src/controllers/live-class.controller.js`
- Import `getIO` from `../utils/socket.js`
- Add emit call after `res.json(...)` in: `createLiveClass`, `updateLiveClass`, `completeLiveClass`, `cancelLiveClass`, `scheduleClass`, `updateSchedule`
- Add `live-class:deleted` emit in `deleteSchedule`

### `client/src/pages/student/StudentOverview.tsx`
- Import `useSocket`
- Add `useEffect` that registers `live-class:updated` and `live-class:deleted` listeners
- Cleanup on unmount

---

## Out of Scope

- Notification bell real-time updates (separate feature)
- Teacher receiving events (not needed for this feature)
- Re-joining course rooms after enrollment mid-session (acceptable limitation)
