# Course Delete Approval Workflow

**Date:** 2026-05-15  
**Status:** Approved  

## Summary

When an instructor requests to delete a course, the deletion does not happen immediately. Instead, a pending flag is set on the course and the admin receives a notification. The admin approves or rejects the request. Only on approval is the course soft-deleted.

---

## Data Model

**`course.model.js` — two new fields:**

```js
pendingDeletion: { type: Boolean, default: false }
deletionRequestedAt: { type: Date }
```

The existing `isDeleted` + `status: 'archived'` fields handle the actual deletion. No new collection is needed.

---

## Backend

### New Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `PATCH` | `/api/v1/courses/:id/request-delete` | teacher (owner) | Instructor requests deletion |
| `PATCH` | `/api/v1/courses/:id/review-delete` | admin | Admin approves or rejects |

### `request-delete` — Controller Logic

1. Verify `course.teacher === req.user.id` — return `403` if not owner
2. Return `400` if `course.enrolledStudents.length > 0` — blocked for enrolled courses
3. Return `409` if `course.pendingDeletion === true` — already requested
4. Set `pendingDeletion = true`, `deletionRequestedAt = new Date()`
5. Find admin: `User.findOne({ role: 'admin' })` to get recipient `_id`
6. Create a `Notification` document for the admin:
   - `recipient: admin._id`, `type: 'course'`, `severity: 'high'`
   - `title: 'Course Deletion Request'`
   - `message: 'Instructor "<name>" has requested to delete course "<title>".'`
   - `relatedId: course._id`, `relatedType: 'course_delete_request'`
7. Return `200` with updated course

### `review-delete` — Controller Logic

**Body:** `{ action: 'approve' | 'reject', reason?: string }`

**Guard:** Return `400` if `course.pendingDeletion !== true` — only courses with a pending delete request can be reviewed.

**Approve:**
- Set `isDeleted = true`, `status = 'archived'`, `pendingDeletion = false`, `deletionRequestedAt = null`
- Create `Notification` for instructor: type `course`, severity `high`, message: *"Your course '<title>' has been deleted by admin."*
- Return `200`

**Reject:**
- Set `pendingDeletion = false`, `deletionRequestedAt = null`
- Create `Notification` for instructor: type `course`, severity `medium`, message: *"Your deletion request for '<title>' was rejected.[ Reason: <reason>]"*
- Return `200` with updated course

### Route Registration (`course.route.js`)

```js
router.route('/:id/request-delete').patch(authenticate, authorize('teacher'), requestDeleteCourse)
router.route('/:id/review-delete').patch(authenticate, authorize('admin'), reviewDeleteCourse)
```

---

## Frontend

### `courses.service.ts` — Two new methods

```ts
requestDeleteCourse(id: string): Promise<CourseSingleResponse>
// PATCH /courses/:id/request-delete

reviewDeleteCourse(id: string, action: 'approve' | 'reject', reason?: string): Promise<CourseSingleResponse>
// PATCH /courses/:id/review-delete
```

### `InstructorCourses.tsx`

**`mapBackendCourse()`:** include `pendingDeletion: c.pendingDeletion` in the mapped object.

**`InstructorCourse` type:** add `pendingDeletion?: boolean`.

**Delete button — three states:**
1. `enrolledStudents > 0` → disabled, tooltip: *"Cannot delete — students enrolled"*
2. `pendingDeletion === true` → disabled, tooltip: *"Deletion request pending admin approval"*
3. Otherwise → enabled, opens confirm modal

**Confirm modal:** text changes to *"Request course deletion? Admin will review and confirm before the course is removed."*

**`handleDelete()`:** calls `coursesService.requestDeleteCourse(id)` instead of `deleteCourse`. On success: toast *"Deletion request sent to admin."*. Updates course in local state to show `pendingDeletion: true`.

**Course card badge:** when `pendingDeletion === true`, show an amber `"Deletion Pending"` badge alongside the status badge (top-left of image).

### `AdminNotifications.tsx`

- Replace hardcoded `INITIAL_NOTIFICATIONS` with real API call via `notificationsService.getMyNotifications()`
- For notifications where `relatedType === 'course_delete_request'`: render inline **Approve** (red) and **Reject** (grey) action buttons on the card
- **Approve flow:** calls `coursesService.reviewDeleteCourse(relatedId, 'approve')` → on success, removes notification from list or marks as actioned
- **Reject flow:** reveals an inline text input for reason → submit calls `coursesService.reviewDeleteCourse(relatedId, 'reject', reason)` → same cleanup
- After either action, the notification card shows a static outcome badge ("Approved" / "Rejected") and hides the buttons

---

## Error Handling

| Scenario | Response |
|----------|----------|
| Non-owner instructor tries to request delete | `403 Forbidden` |
| Course has enrolled students | `400 Bad Request` |
| Duplicate delete request | `409 Conflict` |
| Admin reviews non-pending-deletion course | `400 Bad Request` |
| Invalid action value | `400 Bad Request` |

---

## Notification Flow Summary

```
Instructor clicks Delete
        ↓
PATCH /courses/:id/request-delete
        ↓
pendingDeletion = true
Notification → Admin (course_delete_request, severity: high)
        ↓
Admin sees notification with Approve / Reject buttons
        ↓
   ┌────────────┬─────────────────────┐
Approve        Reject (+ reason)
   ↓                   ↓
isDeleted=true   pendingDeletion=false
status=archived  course restored
Notify instructor  Notify instructor
```

---

## Out of Scope

- Email notifications (only in-app)
- Delete requests for courses with enrolled students (blocked at source)
- Bulk delete requests
