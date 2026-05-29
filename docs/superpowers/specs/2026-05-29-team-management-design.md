# Team Account Management System — Design Spec

**Date:** 2026-05-29
**Status:** Approved

---

## Overview

A permission-based team management system that allows the admin to create team member accounts, assign granular page-level access to specific admin dashboard features, manage those members, and chat with them in real time. Team members get their own dashboard shell (`/team/*`) that renders only the pages the admin has granted them.

---

## Goals

- Admin can add, edit, and remove team members from the admin dashboard
- Admin can grant or revoke access to any of the 20 admin pages per team member
- Team members log in and land on `/team/dashboard` — a filtered dashboard showing only their permitted pages
- Admin and team members can chat with each other in real time via Socket.io
- All permission enforcement happens server-side on every API request

---

## Data Model

### User model changes (`server/src/models/user.model.js`)

Add `team_member` to the role enum:
```js
role: { type: String, enum: ['student', 'teacher', 'admin', 'team_member'], default: 'student' }
```

Add two new fields:
```js
jobTitle: {
  type: String,
  trim: true,
  maxlength: [100, 'Job title cannot exceed 100 characters'],
},
permissions: {
  type: [String],
  enum: [
    'overview', 'students', 'courses', 'instructors',
    'payments', 'financial-aid', 'salaries', 'certificates', 'referrals',
    'messages', 'support', 'contacts', 'email', 'reviews', 'notifications',
    'blog', 'seo', 'cms', 'geo-access', 'settings'
  ],
  default: [],
},
```

`permissions` stores the exact page keys that match admin nav paths and `authorizeTeamPage` checks. Only meaningful when `role === 'team_member'`.

### New model — `server/src/models/team-chat.model.js`

```js
{
  from:    { type: ObjectId, ref: 'User', required: true },
  to:      { type: ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  read:    { type: Boolean, default: false },
  timestamps: true
}
```

Compound index on `[from, to, createdAt]` for efficient conversation fetching. A conversation is fetched by querying messages where `(from=A, to=B) OR (from=B, to=A)`.

---

## Server-side

### Middleware changes (`server/src/middlewares/auth.js`)

**`authenticate` updated** — attach permissions to `req.user`:
```js
req.user = { id: user._id, role: user.role, permissions: user.permissions || [] }
```

**New `authorizeTeamPage(page)` middleware:**
```js
export const authorizeTeamPage = (page) => (req, res, next) => {
  if (!req.user) throw new UnauthorizedError('Access denied.')
  if (req.user.role === 'admin') return next()
  if (req.user.role === 'team_member' && req.user.permissions.includes(page)) return next()
  throw new ForbiddenError('You do not have access to this section.')
}
```

**Existing route files updated:** Replace `authorize('admin')` with `authorizeTeamPage('<page-key>')` on all routes that team members may legitimately access. The `settings` page remains `authorize('admin')` only — team members must never touch platform-wide settings or admin credentials.

### New API — `/api/v1/team`

All team management endpoints require `authenticate + authorize('admin')`.
Chat endpoints require `authenticate` only (ownership enforced inside controller).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/team` | List all team members (role = team_member, isDeleted = false) |
| `POST` | `/api/v1/team` | Create team member — body: `{ name, email, password, jobTitle, permissions[] }` |
| `GET` | `/api/v1/team/:id` | Get single team member profile |
| `PUT` | `/api/v1/team/:id` | Update name, email, jobTitle, permissions |
| `DELETE` | `/api/v1/team/:id` | Soft delete — sets `isDeleted: true` |
| `GET` | `/api/v1/team/chat/:memberId` | Admin: fetch conversation thread with a specific team member |
| `POST` | `/api/v1/team/chat/:memberId` | Admin: send a message to a team member — body: `{ message }` |
| `PATCH` | `/api/v1/team/chat/:memberId/read` | Admin: mark all unread messages in thread as read |
| `GET` | `/api/v1/team/chat/me` | Team member: fetch their conversation with the admin (server auto-resolves admin) |
| `POST` | `/api/v1/team/chat/me` | Team member: send a message to admin — body: `{ message }` |
| `PATCH` | `/api/v1/team/chat/me/read` | Team member: mark admin's messages as read |

**`POST /api/v1/team` behavior:**
- Creates a User with `role: 'team_member'`, `isVerified: true` (admin-created accounts skip email verification)
- Hashes the provided password
- Sends a welcome email with login credentials via Nodemailer

**New files:**
- `server/src/models/team-chat.model.js`
- `server/src/controllers/team.controller.js`
- `server/src/routes/team.route.js`

**Registered in `app.js`:**
```js
import teamRoute from './src/routes/team.route.js'
app.use('/api/v1/team', teamRoute)
```

### Socket.io events (`server/index.js`)

| Event | Direction | Payload | Action |
|-------|-----------|---------|--------|
| `team:message:send` | Client → Server | `{ toId, message }` | Save to DB, emit `team:message:received` to recipient |
| `team:message:received` | Server → Client | `{ message object }` | Rendered in chat UI |
| `team:message:read` | Client → Server | `{ threadPartnerId }` | Mark messages as read in DB |

Socket room per user: each connected user joins room `user:<userId>`. Server emits to `user:<toId>` room on message send.

---

## Client-side

### Admin side

#### New `AdminTeam.tsx` page (`client/src/pages/admin/AdminTeam.tsx`)

Two-panel layout:

**Left panel — Member list:**
- "Add Member" button → modal with fields: Name, Email, Password, Job Title, Permissions grid
- Each member card: avatar initials, name, job title, green online dot (via socket presence), unread chat badge
- Click card → selects member, loads right panel
- Pencil icon → edit modal (pre-filled, password field optional)
- Trash icon → confirmation dialog → soft delete

**Permissions modal — checkbox grid grouped by category:**
- Core: Overview, Students, Courses, Instructors
- Finance: Payments, Financial Aid, Salaries, Certificates, Referrals
- Communication: Messages, Support, Contacts, Email System, Reviews, Notifications
- Content: Blog Manager, SEO Manager, CMS Editor, Geo Access
- *(Settings intentionally excluded — admin only)*

**Right panel — split vertically:**

Top half — Profile + live permissions:
- Member name, email, job title, status badge (Active / Deleted)
- Same permission chip grid as modal — toggling a chip auto-saves via `PUT /api/v1/team/:id` with debounce

Bottom half — Chat thread:
- Scrollable message list (admin messages right-aligned, member messages left-aligned)
- Input + send button at bottom
- Real-time: socket listener for `team:message:received` while this member is selected
- On select: fetches thread via `GET /api/v1/team/chat/:memberId`, emits `team:message:read`

**Nav item added to `AdminPage.tsx`:** `NAV_CORE` gains `{ view: 'team', label: 'Team', path: 'team', Icon: UsersThree }`.

`AdminView` type updated to include `'team'`.

#### New service `client/src/services/team.service.ts`

Wraps all `/api/v1/team` calls: `listMembers`, `createMember`, `updateMember`, `deleteMember`, `fetchChat`, `sendMessage`, `markRead`.

---

### Team member side

#### New `TeamPage.tsx` (`client/src/pages/TeamPage.tsx`)

Mirrors `AdminPage.tsx` shell structure but:

- On mount, reads `user.permissions` from `AuthContext`
- Sidebar nav built dynamically from permissions array — each permission key maps to the matching page component:

| Permission key | Component rendered |
|----------------|-------------------|
| `overview` | `<AdminOverview />` |
| `students` | `<AdminStudents />` |
| `courses` | `<AdminCourses />` |
| `payments` | `<AdminPaymentsView />` |
| ... | *(same pattern for all 20 pages)* |

- Header: team member avatar, name, "Team Member" badge, logout button
- If `permissions.length === 0`: centered empty state — "No pages assigned yet. Contact your admin."
- Routes: `/team`, `/team/students`, `/team/payments`, etc.

#### Floating chat bubble

- Fixed bottom-right corner in `TeamPage.tsx`
- Click → slide-in chat panel showing conversation with admin
- Unread count badge on bubble icon
- Same socket events as admin chat (`team:message:send`, `team:message:received`, `team:message:read`)
- On open: fetches thread via `GET /api/v1/team/chat/me` (server auto-resolves admin), marks as read

---

### Auth & routing changes

#### `ProtectedRoute.tsx`

New guard for team member routes:
```tsx
// /team/* — requires role === 'team_member'
// /admin/* — requires role === 'admin' (unchanged)
// team_member hitting /admin/* → redirect to /team/dashboard
// admin hitting /team/* → redirect to /admin
```

#### `AuthContext.tsx`

After login success:
- `role === 'admin'` → navigate to `/admin`
- `role === 'team_member'` → navigate to `/team`
- Other roles unchanged

User object in context gains `permissions: string[]` field (populated from API response on login and profile fetch).

#### `App.tsx`

```tsx
// New lazy imports
const TeamPage = lazy(() => import('./pages/TeamPage'))
const AdminTeam = lazy(() => import('./pages/admin/AdminTeam'))

// New routes
<Route path="/team/*" element={<ProtectedRoute role="team_member"><TeamPage /></ProtectedRoute>} />

// Inside /admin/* routes
<Route path="team" element={<AdminTeam />} />
```

---

## Error Handling & Edge Cases

| Scenario | Handling |
|----------|---------|
| Permission revoked mid-session | Next API call returns `403` → `axiosClient` intercepts → redirect to `/team/dashboard` with toast "Your access to this section has been removed." |
| Team member account deleted | `isDeleted: true` → `authenticate` middleware rejects their JWT → auto logout |
| Permissions updated while logged in | Server checks permissions on every request — stale client nav doesn't matter, API enforces truth |
| Chat recipient offline | Message saved to DB regardless. On reconnect, thread loads via REST API on mount |
| Team member tries `/admin/*` directly | `ProtectedRoute` redirects to `/team/dashboard`. Server `authorize('admin')` also blocks at API level |
| Settings page | Remains `authorize('admin')` only — excluded from permission grid entirely |
| Admin creates member with duplicate email | `409 Conflict` returned, shown as form error in modal |
| Password for new member | Admin sets initial password. Team member can change via profile. Welcome email sent with credentials |

---

## Files Changed / Created

### New files
| File | Purpose |
|------|---------|
| `server/src/models/team-chat.model.js` | TeamChat Mongoose model |
| `server/src/controllers/team.controller.js` | Team CRUD + chat handlers |
| `server/src/routes/team.route.js` | `/api/v1/team` routes |
| `client/src/pages/admin/AdminTeam.tsx` | Admin team management page |
| `client/src/pages/TeamPage.tsx` | Team member dashboard shell |
| `client/src/services/team.service.ts` | API calls for team endpoints |

### Modified files
| File | Change |
|------|--------|
| `server/src/models/user.model.js` | Add `team_member` role, `permissions[]`, `jobTitle` |
| `server/src/middlewares/auth.js` | Attach permissions to `req.user`; add `authorizeTeamPage` |
| `server/app.js` | Register `/api/v1/team` route |
| `server/index.js` | Add socket events for team chat |
| `server/src/routes/*.js` | Replace `authorize('admin')` with `authorizeTeamPage` on applicable routes |
| `client/src/pages/AdminPage.tsx` | Add Team nav item; add `AdminTeam` route |
| `client/src/pages/App.tsx` | Add `/team/*` routes with `TeamPage` |
| `client/src/context/AuthContext.tsx` | Handle `team_member` role redirect; add permissions to user object |
| `client/src/components/auth/ProtectedRoute.tsx` | Add team member route guard |
