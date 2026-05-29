# Team Account Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a permission-based team management system where admin can create team member accounts, assign page-level access to admin features, manage those members, and chat with them in real time — while team members get their own `/team/*` dashboard showing only their permitted pages.

**Architecture:** New `team_member` role added to the existing User model with a `permissions[]` array. A new `authorizeTeamPage(...pages)` middleware replaces `authorize('admin')` on all team-accessible routes. Admin manages team from `/admin/team`; team members land at `/team/*` which renders the same admin page components inside a filtered shell.

**Tech Stack:** Node.js/Express (ES Modules), Mongoose, Socket.io, React 18, TypeScript, Tailwind CSS, Vite, React Router v6, Phosphor Icons, Framer Motion

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `server/src/models/team-chat.model.js` | TeamChat Mongoose model |
| `server/src/controllers/team.controller.js` | Team CRUD + chat REST handlers |
| `server/src/routes/team.route.js` | `/api/v1/team` route definitions |
| `client/src/pages/admin/AdminTeam.tsx` | Admin team management page (list + permissions + chat) |
| `client/src/pages/TeamPage.tsx` | Team member dashboard shell |
| `client/src/services/team.service.ts` | API wrapper for all team endpoints |

### Modified files
| File | Change |
|------|--------|
| `server/src/models/user.model.js` | Add `team_member` role, `permissions[]`, `jobTitle` |
| `server/src/middlewares/auth.js` | Add `authorizeTeamPage`, attach `permissions` to `req.user` |
| `server/app.js` | Import + register `/api/v1/team` route |
| `server/index.js` | Add `team:message:send` / `team:message:received` / `team:message:read` socket events |
| `server/src/routes/stats.route.js` | `authorizeTeamPage('overview')` |
| `server/src/routes/user.route.js` | `authorizeTeamPage('students','instructors')` on admin routes |
| `server/src/routes/course.route.js` | `authorizeTeamPage('courses')` |
| `server/src/routes/payment.route.js` | `authorizeTeamPage('payments')` |
| `server/src/routes/financial-aid.route.js` | `authorizeTeamPage('financial-aid')` |
| `server/src/routes/salary.route.js` | `authorizeTeamPage('salaries')` |
| `server/src/routes/salary-request.route.js` | `authorizeTeamPage('salaries')` |
| `server/src/routes/certificate.route.js` | `authorizeTeamPage('certificates')` |
| `server/src/routes/referral.route.js` | `authorizeTeamPage('referrals')` |
| `server/src/routes/coupon.route.js` | `authorizeTeamPage('referrals')` |
| `server/src/routes/message.route.js` | `authorizeTeamPage('messages')` |
| `server/src/routes/support.route.js` | `authorizeTeamPage('support')` |
| `server/src/routes/contact.route.js` | `authorizeTeamPage('contacts')` |
| `server/src/routes/email.route.js` | `authorizeTeamPage('email')` |
| `server/src/routes/review.route.js` | `authorizeTeamPage('reviews')` |
| `server/src/routes/notification.route.js` | `authorizeTeamPage('notifications')` |
| `server/src/routes/blog.route.js` | `authorizeTeamPage('blog')` |
| `server/src/routes/seo.route.js` | `authorizeTeamPage('seo')` |
| `server/src/routes/site-settings.route.js` | `authorizeTeamPage('cms')` |
| `server/src/routes/geo.route.js` | `authorizeTeamPage('geo-access')` |
| `client/src/types/api.ts` | Add `team_member` to `User.role`, add `permissions`, `jobTitle` |
| `client/src/context/AuthContext.tsx` | Redirect `team_member` to `/team` after login |
| `client/src/components/auth/ProtectedRoute.tsx` | Add `team_member` to `allowedRoles` type; add redirect map entry |
| `client/src/App.tsx` | Add lazy `TeamPage` + `/team/*` protected route |
| `client/src/pages/AdminPage.tsx` | Add `AdminTeam` lazy import + nav item + route |

---

## Task 1: Server data layer — User model + TeamChat model

**Files:**
- Modify: `server/src/models/user.model.js`
- Create: `server/src/models/team-chat.model.js`

- [ ] **Step 1: Update user.model.js — add team_member role, permissions, jobTitle**

In `server/src/models/user.model.js`, make these changes:

Change the `role` field enum:
```js
role: {
  type: String,
  enum: {
    values: ['student', 'teacher', 'admin', 'team_member'],
    message: 'Invalid user role',
  },
  default: 'student',
},
```

Add two new fields after `bio`:
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
    'blog', 'seo', 'cms', 'geo-access',
  ],
  default: [],
},
```

- [ ] **Step 2: Create team-chat.model.js**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const teamChatSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

teamChatSchema.index({ from: 1, to: 1, createdAt: 1 })

const TeamChat = mongoose.models.TeamChat || model('TeamChat', teamChatSchema)

export default TeamChat
```

- [ ] **Step 3: Start the server and confirm no startup errors**

```bash
cd server && node index.js
```
Expected: Server starts on port 5000, no Mongoose validation errors about the new fields.

- [ ] **Step 4: Commit**

```bash
git add server/src/models/user.model.js server/src/models/team-chat.model.js
git commit -m "feat: add team_member role, permissions, jobTitle to User; add TeamChat model"
```

---

## Task 2: Auth middleware — authorizeTeamPage + permissions in req.user

**Files:**
- Modify: `server/src/middlewares/auth.js`

- [ ] **Step 1: Attach permissions to req.user in authenticate**

In `server/src/middlewares/auth.js`, update the `authenticate` handler. Find the line:
```js
req.user = { id: user._id, role: user.role }
```
Replace it with:
```js
req.user = { id: user._id, role: user.role, permissions: user.permissions || [] }
```

- [ ] **Step 2: Add authorizeTeamPage middleware**

Add this export after the existing `authorize` export in `server/src/middlewares/auth.js`:

```js
// ─── authorizeTeamPage ────────────────────────────────────────────────────────
// Passes if user is admin OR is a team_member with at least one of the given pages.
// Usage: router.get('/', authenticate, authorizeTeamPage('students', 'instructors'), handler)

export const authorizeTeamPage = (...pages) =>
  (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Access denied. Not authenticated.')
    }
    if (req.user.role === 'admin') return next()
    if (
      req.user.role === 'team_member' &&
      pages.some((p) => req.user.permissions.includes(p))
    ) {
      return next()
    }
    throw new ForbiddenError(
      `Access denied. You do not have permission to access this section.`
    )
  }
```

- [ ] **Step 3: Test middleware manually**

Start the server. Using a REST client (Postman/curl), send:
```
GET /api/v1/stats/admin
Authorization: Bearer <admin-token>
```
Expected: 200 OK (admin still works).

- [ ] **Step 4: Commit**

```bash
git add server/src/middlewares/auth.js
git commit -m "feat: add authorizeTeamPage middleware, attach permissions to req.user"
```

---

## Task 3: Team CRUD controller + route

**Files:**
- Create: `server/src/controllers/team.controller.js`
- Create: `server/src/routes/team.route.js`

- [ ] **Step 1: Create team.controller.js with CRUD handlers**

```js
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/user.model.js'
import { BadRequestError, NotFoundError, ConflictError } from '../utils/apiErrors.js'
import { sendEmail } from '../utils/email.js'

// ─── List team members ────────────────────────────────────────────────────────

export const listTeamMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ role: 'team_member', isDeleted: false })
    .select('name email jobTitle permissions profileImage createdAt')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, data: members })
})

// ─── Get single team member ───────────────────────────────────────────────────

export const getTeamMember = asyncHandler(async (req, res) => {
  const member = await User.findOne({
    _id: req.params.id,
    role: 'team_member',
    isDeleted: false,
  }).select('name email jobTitle permissions profileImage createdAt')

  if (!member) throw new NotFoundError('Team member not found.')
  res.json({ success: true, data: member })
})

// ─── Create team member ───────────────────────────────────────────────────────

export const createTeamMember = asyncHandler(async (req, res) => {
  const { name, email, password, jobTitle, permissions = [] } = req.body

  if (!name || !email || !password) {
    throw new BadRequestError('Name, email, and password are required.')
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) throw new ConflictError('A user with this email already exists.')

  const member = await User.create({
    name,
    email,
    password,
    jobTitle,
    permissions,
    role: 'team_member',
    isVerified: true,
  })

  sendEmail({
    type: 'team_member_welcome',
    to: email,
    toName: name,
    variables: { name, email, password, jobTitle: jobTitle || 'Team Member' },
    metadata: { memberId: member._id },
  }).catch(() => {})

  const safe = await User.findById(member._id)
    .select('name email jobTitle permissions profileImage createdAt')
    .lean()

  res.status(201).json({ success: true, message: 'Team member created.', data: safe })
})

// ─── Update team member ───────────────────────────────────────────────────────

export const updateTeamMember = asyncHandler(async (req, res) => {
  const { name, email, jobTitle, permissions } = req.body

  const member = await User.findOne({
    _id: req.params.id,
    role: 'team_member',
    isDeleted: false,
  })
  if (!member) throw new NotFoundError('Team member not found.')

  if (email && email !== member.email) {
    const conflict = await User.findOne({ email: email.toLowerCase().trim() })
    if (conflict) throw new ConflictError('This email is already in use.')
    member.email = email
  }

  if (name !== undefined) member.name = name
  if (jobTitle !== undefined) member.jobTitle = jobTitle
  if (permissions !== undefined) member.permissions = permissions

  await member.save()

  const safe = await User.findById(member._id)
    .select('name email jobTitle permissions profileImage createdAt')
    .lean()

  res.json({ success: true, message: 'Team member updated.', data: safe })
})

// ─── Delete team member ───────────────────────────────────────────────────────

export const deleteTeamMember = asyncHandler(async (req, res) => {
  const member = await User.findOne({
    _id: req.params.id,
    role: 'team_member',
    isDeleted: false,
  })
  if (!member) throw new NotFoundError('Team member not found.')

  member.isDeleted = true
  await member.save()

  res.json({ success: true, message: 'Team member removed.' })
})
```

- [ ] **Step 2: Create team.route.js (CRUD only — chat endpoints added in Task 4)**

```js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  listTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../controllers/team.controller.js'

const router = express.Router()

// All team management routes are admin-only
router.use(authenticate, authorize('admin'))

router.route('/').get(listTeamMembers).post(createTeamMember)
router.route('/:id').get(getTeamMember).put(updateTeamMember).delete(deleteTeamMember)

export default router
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/team.controller.js server/src/routes/team.route.js
git commit -m "feat: team CRUD controller and route (admin-only)"
```

---

## Task 4: Team chat controller handlers + chat routes

**Files:**
- Modify: `server/src/controllers/team.controller.js` (append handlers)
- Modify: `server/src/routes/team.route.js` (append routes)

- [ ] **Step 1: Add chat handlers to team.controller.js**

Append these exports to the bottom of `server/src/controllers/team.controller.js`.

Note: REST controllers emit socket events directly so both sides get real-time updates regardless of whether the sender used socket or REST. The `emitToUser` utility already exists in `server/src/utils/socket.js`.

```js
import TeamChat from '../models/team-chat.model.js'
import { emitToUser } from '../utils/socket.js'

// ─── Shared: build thread query (messages between two users) ─────────────────

const threadQuery = (userA, userB) => ({
  $or: [
    { from: userA, to: userB },
    { from: userB, to: userA },
  ],
})

// ─── Admin: fetch chat thread with a specific team member ────────────────────

export const getAdminThread = asyncHandler(async (req, res) => {
  const adminId = req.user.id
  const { memberId } = req.params

  const member = await User.findOne({ _id: memberId, role: 'team_member', isDeleted: false })
  if (!member) throw new NotFoundError('Team member not found.')

  const messages = await TeamChat.find(threadQuery(adminId, memberId))
    .sort({ createdAt: 1 })
    .populate('from', 'name profileImage role')
    .lean()

  res.json({ success: true, data: messages })
})

// ─── Admin: send message to team member ──────────────────────────────────────

export const sendAdminMessage = asyncHandler(async (req, res) => {
  const { message } = req.body
  const { memberId } = req.params

  if (!message?.trim()) throw new BadRequestError('Message is required.')

  const member = await User.findOne({ _id: memberId, role: 'team_member', isDeleted: false })
  if (!member) throw new NotFoundError('Team member not found.')

  const msg = await TeamChat.create({ from: req.user.id, to: memberId, message: message.trim() })
  const populated = await TeamChat.findById(msg._id)
    .populate('from', 'name profileImage role')
    .lean()

  // Notify both parties via socket so both see it in real time
  emitToUser(memberId, 'team:message:received', populated)
  emitToUser(req.user.id, 'team:message:received', populated)

  res.status(201).json({ success: true, data: populated })
})

// ─── Admin: mark thread as read ───────────────────────────────────────────────

export const markAdminThreadRead = asyncHandler(async (req, res) => {
  const { memberId } = req.params
  await TeamChat.updateMany(
    { from: memberId, to: req.user.id, read: false },
    { read: true }
  )
  res.json({ success: true, message: 'Thread marked as read.' })
})

// ─── Team member: fetch their thread with admin ───────────────────────────────

export const getMemberThread = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ role: 'admin', isDeleted: false }).select('_id').lean()
  if (!admin) throw new NotFoundError('No admin account found.')

  const messages = await TeamChat.find(threadQuery(req.user.id, admin._id))
    .sort({ createdAt: 1 })
    .populate('from', 'name profileImage role')
    .lean()

  res.json({ success: true, data: messages })
})

// ─── Team member: send message to admin ──────────────────────────────────────

export const sendMemberMessage = asyncHandler(async (req, res) => {
  const { message } = req.body
  if (!message?.trim()) throw new BadRequestError('Message is required.')

  const admin = await User.findOne({ role: 'admin', isDeleted: false }).select('_id').lean()
  if (!admin) throw new NotFoundError('No admin account found.')

  const msg = await TeamChat.create({
    from: req.user.id,
    to: admin._id,
    message: message.trim(),
  })
  const populated = await TeamChat.findById(msg._id)
    .populate('from', 'name profileImage role')
    .lean()

  // Notify admin and echo back to team member via socket
  emitToUser(admin._id, 'team:message:received', populated)
  emitToUser(req.user.id, 'team:message:received', populated)

  res.status(201).json({ success: true, data: populated })
})

// ─── Team member: mark admin messages as read ────────────────────────────────

export const markMemberThreadRead = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ role: 'admin', isDeleted: false }).select('_id').lean()
  if (!admin) return res.json({ success: true })

  await TeamChat.updateMany(
    { from: admin._id, to: req.user.id, read: false },
    { read: true }
  )
  res.json({ success: true, message: 'Thread marked as read.' })
})
```

- [ ] **Step 2: Update the import block at the top of team.controller.js**

The `TeamChat` and `emitToUser` imports that appear inside the appended code in Step 1 must be moved to the top of the file. Replace the existing import block at the top of `team.controller.js` with:

```js
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/user.model.js'
import TeamChat from '../models/team-chat.model.js'
import { emitToUser } from '../utils/socket.js'
import { BadRequestError, NotFoundError, ConflictError } from '../utils/apiErrors.js'
import { sendEmail } from '../utils/email.js'
```

Remove the duplicate `import TeamChat` and `import { emitToUser }` lines that were at the top of the Step 1 appended code block.

- [ ] **Step 3: Append chat routes to team.route.js**

Replace the content of `server/src/routes/team.route.js` with:

```js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  listTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getAdminThread,
  sendAdminMessage,
  markAdminThreadRead,
  getMemberThread,
  sendMemberMessage,
  markMemberThreadRead,
} from '../controllers/team.controller.js'

const router = express.Router()

// ─── Admin: team member CRUD ──────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), listTeamMembers)
router.route('/').post(authenticate, authorize('admin'), createTeamMember)
router.route('/:id').get(authenticate, authorize('admin'), getTeamMember)
router.route('/:id').put(authenticate, authorize('admin'), updateTeamMember)
router.route('/:id').delete(authenticate, authorize('admin'), deleteTeamMember)

// ─── Admin: chat with a specific team member ──────────────────────────────────
router.route('/chat/:memberId').get(authenticate, authorize('admin'), getAdminThread)
router.route('/chat/:memberId').post(authenticate, authorize('admin'), sendAdminMessage)
router.route('/chat/:memberId/read').patch(authenticate, authorize('admin'), markAdminThreadRead)

// ─── Team member: chat with admin ────────────────────────────────────────────
router.route('/chat/me').get(authenticate, authorize('team_member'), getMemberThread)
router.route('/chat/me').post(authenticate, authorize('team_member'), sendMemberMessage)
router.route('/chat/me/read').patch(authenticate, authorize('team_member'), markMemberThreadRead)

export default router
```

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/team.controller.js server/src/routes/team.route.js
git commit -m "feat: add team chat controller handlers and routes"
```

---

## Task 5: Register team route in app.js + Socket.io chat events

**Files:**
- Modify: `server/app.js`
- Modify: `server/index.js`

- [ ] **Step 1: Register route in app.js**

In `server/app.js`, add the import after the last existing import:
```js
import teamRoutes from './src/routes/team.route.js'
```

Add the route registration after the last `app.use(...)` line, before the error handler:
```js
app.use('/api/v1/team', teamRoutes)
```

- [ ] **Step 2: Add Socket.io team chat events to index.js**

In `server/index.js`, add these imports at the top alongside the existing ones:
```js
import TeamChat from './src/models/team-chat.model.js'
import User from './src/models/user.model.js'
```

Inside the `io.on('connection', async (socket) => {` block, add these event handlers after the existing `socket.on('mark_read', ...)` handler:

```js
  // ─── Team chat ───────────────────────────────────────────────────────────────
  socket.on('team:message:send', async ({ toId, message }) => {
    if (!userId || !toId || !message?.trim()) return
    try {
      const msg = await TeamChat.create({
        from: userId,
        to: toId,
        message: message.trim(),
      })
      const populated = await TeamChat.findById(msg._id)
        .populate('from', 'name profileImage role')
        .lean()

      emitToUser(toId, 'team:message:received', populated)
      emitToUser(userId, 'team:message:received', populated)
    } catch (err) {
      console.warn('[Socket] team:message:send error:', err.message)
    }
  })

  socket.on('team:message:read', async ({ threadPartnerId }) => {
    if (!userId || !threadPartnerId) return
    try {
      await TeamChat.updateMany(
        { from: threadPartnerId, to: userId, read: false },
        { read: true }
      )
      emitToUser(threadPartnerId, 'team:messages:read', { by: userId })
    } catch (err) {
      console.warn('[Socket] team:message:read error:', err.message)
    }
  })
```

- [ ] **Step 3: Test the team route is accessible**

Start the server. Run:
```
GET /api/v1/team
Authorization: Bearer <admin-token>
```
Expected: `{ "success": true, "data": [] }` (empty array, no team members yet).

- [ ] **Step 4: Commit**

```bash
git add server/app.js server/index.js
git commit -m "feat: register team route, add Socket.io team chat events"
```

---

## Task 6: Update existing route files with authorizeTeamPage

**Files:** 20 existing route files in `server/src/routes/`

The pattern for each file is the same:
1. Add `authorizeTeamPage` to the import from `../middlewares/auth.js`
2. Replace `authorize('admin')` with `authorizeTeamPage('<page-key>')` on all admin-protected GET/POST/PUT/PATCH/DELETE handlers in that file

> **Note:** Only replace on routes that team members might access. Routes like internal admin config or sensitive operations that should stay admin-only should keep `authorize('admin')`.

- [ ] **Step 1: Update stats.route.js**

```js
import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { getAdminStats } from '../controllers/stats.controller.js'

const router = express.Router()

router.route('/admin').get(authenticate, authorizeTeamPage('overview'), getAdminStats)

export default router
```

- [ ] **Step 2: Update user.route.js — admin routes only**

In `server/src/routes/user.route.js`, add `authorizeTeamPage` to the import:
```js
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
```

Replace `authorize('admin')` with `authorizeTeamPage('students', 'instructors')` on all admin-facing routes (listing users, getting user details by admin, etc.). Keep `authorize('admin')` only on routes that modify admin credentials or perform destructive admin-only operations.

- [ ] **Step 3: Update course.route.js**

Add `authorizeTeamPage` to import, replace `authorize('admin')` with `authorizeTeamPage('courses')` on all course admin routes.

- [ ] **Step 4: Update payment.route.js**

Add `authorizeTeamPage` to import, replace `authorize('admin')` with `authorizeTeamPage('payments')` on all payment admin routes.

- [ ] **Step 5: Update financial-aid.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('financial-aid')`.

- [ ] **Step 6: Update salary.route.js and salary-request.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('salaries')` in both files.

- [ ] **Step 7: Update certificate.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('certificates')`.

- [ ] **Step 8: Update referral.route.js and coupon.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('referrals')` in both files.

- [ ] **Step 9: Update message.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('messages')` on admin routes. Keep existing student/instructor-facing routes unchanged.

- [ ] **Step 10: Update support.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('support')`.

- [ ] **Step 11: Update contact.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('contacts')`.

- [ ] **Step 12: Update email.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('email')`.

- [ ] **Step 13: Update review.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('reviews')`.

- [ ] **Step 14: Update notification.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('notifications')`. Keep student notification routes unchanged.

- [ ] **Step 15: Update blog.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('blog')` on admin blog management routes.

- [ ] **Step 16: Update seo.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('seo')`.

- [ ] **Step 17: Update site-settings.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('cms')`. This allows team members with 'cms' permission to edit site content.

- [ ] **Step 18: Update geo.route.js**

Replace `authorize('admin')` with `authorizeTeamPage('geo-access')`.

- [ ] **Step 19: Verify admin still works after route changes**

Start the server. Test a few routes with an admin token — stats, courses, payments. All should return 200.

- [ ] **Step 20: Commit**

```bash
git add server/src/routes/
git commit -m "feat: update all admin routes to use authorizeTeamPage for team member access"
```

---

## Task 7: Client types + team.service.ts

**Files:**
- Modify: `client/src/types/api.ts`
- Create: `client/src/services/team.service.ts`

- [ ] **Step 1: Update User type in api.ts**

In `client/src/types/api.ts`, update the `User` interface:

```ts
export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'team_member';
  phone?: string;
  country?: string;
  city?: string;
  timezone?: string;
  profileImage?: string;
  photo?: string;
  bio?: string;
  jobTitle?: string;
  permissions?: string[];
  isVerified?: boolean;
  isOnboardingDone?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Also add a `TeamMember` interface and `TeamChatMessage` interface:

```ts
export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  jobTitle?: string;
  permissions: string[];
  profileImage?: string;
  createdAt: string;
}

export interface TeamChatMessage {
  _id: string;
  from: { _id: string; name: string; profileImage?: string; role: string };
  to: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CreateTeamMemberDto {
  name: string;
  email: string;
  password: string;
  jobTitle?: string;
  permissions: string[];
}

export interface UpdateTeamMemberDto {
  name?: string;
  email?: string;
  jobTitle?: string;
  permissions?: string[];
}
```

- [ ] **Step 2: Create team.service.ts**

```ts
import { axiosClient } from '@/lib/axiosClient'
import type { TeamMember, TeamChatMessage, CreateTeamMemberDto, UpdateTeamMemberDto } from '@/types/api'

export const teamService = {
  listMembers: async (): Promise<{ success: boolean; data: TeamMember[] }> => {
    const res = await axiosClient.get('/team')
    return res.data
  },

  getMember: async (id: string): Promise<{ success: boolean; data: TeamMember }> => {
    const res = await axiosClient.get(`/team/${id}`)
    return res.data
  },

  createMember: async (dto: CreateTeamMemberDto): Promise<{ success: boolean; data: TeamMember }> => {
    const res = await axiosClient.post('/team', dto)
    return res.data
  },

  updateMember: async (id: string, dto: UpdateTeamMemberDto): Promise<{ success: boolean; data: TeamMember }> => {
    const res = await axiosClient.put(`/team/${id}`, dto)
    return res.data
  },

  deleteMember: async (id: string): Promise<{ success: boolean }> => {
    const res = await axiosClient.delete(`/team/${id}`)
    return res.data
  },

  // Admin chat
  getAdminThread: async (memberId: string): Promise<{ success: boolean; data: TeamChatMessage[] }> => {
    const res = await axiosClient.get(`/team/chat/${memberId}`)
    return res.data
  },

  sendAdminMessage: async (memberId: string, message: string): Promise<{ success: boolean; data: TeamChatMessage }> => {
    const res = await axiosClient.post(`/team/chat/${memberId}`, { message })
    return res.data
  },

  markAdminThreadRead: async (memberId: string): Promise<void> => {
    await axiosClient.patch(`/team/chat/${memberId}/read`)
  },

  // Team member chat
  getMemberThread: async (): Promise<{ success: boolean; data: TeamChatMessage[] }> => {
    const res = await axiosClient.get('/team/chat/me')
    return res.data
  },

  sendMemberMessage: async (message: string): Promise<{ success: boolean; data: TeamChatMessage }> => {
    const res = await axiosClient.post('/team/chat/me', { message })
    return res.data
  },

  markMemberThreadRead: async (): Promise<void> => {
    await axiosClient.patch('/team/chat/me/read')
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts client/src/services/team.service.ts
git commit -m "feat: add team_member types and team service"
```

---

## Task 8: AuthContext + ProtectedRoute + App.tsx

**Files:**
- Modify: `client/src/context/AuthContext.tsx`
- Modify: `client/src/components/auth/ProtectedRoute.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Update AuthContext — redirect team_member to /team after login**

In `client/src/context/AuthContext.tsx`, find the `login` function. After `persistAuth(data, remember)` and `setUser(data.user)`, the caller receives the `AuthResponse`. The redirect is handled by the caller (LoginPage), not here. So we only need to ensure the `User` type update flows through. The `AuthContext` itself doesn't need code changes unless it hardcodes role-based redirects.

Check `LoginPage.tsx` for the redirect logic after login. In `client/src/pages/LoginPage.tsx`, find where the navigation after login happens. It likely looks like:

```ts
const response = await login(data)
if (response.user.role === 'admin') navigate('/admin')
else if (response.user.role === 'teacher') navigate('/instructor')
else navigate('/dashboard')
```

Add `team_member` to that block:
```ts
if (response.user.role === 'admin') navigate('/admin')
else if (response.user.role === 'teacher') navigate('/instructor')
else if (response.user.role === 'team_member') navigate('/team')
else navigate('/dashboard')
```

Also update the redirect in `AuthContext.tsx` hydration — if a stored user with `role === 'team_member'` is detected on mount and the current path is `/login`, redirect to `/team`.

- [ ] **Step 2: Update ProtectedRoute.tsx**

In `client/src/components/auth/ProtectedRoute.tsx`:

Update the `allowedRoles` type:
```ts
interface ProtectedRouteProps {
  allowedRoles?: ('student' | 'teacher' | 'admin' | 'team_member')[];
  children: React.ReactNode;
}
```

Update the `redirectMap` inside the component to include `team_member`:
```ts
const redirectMap: Record<string, string> = {
  student: '/dashboard',
  teacher: '/instructor',
  admin: '/admin',
  team_member: '/team',
};
```

- [ ] **Step 3: Add TeamPage to App.tsx**

In `client/src/App.tsx`, add the lazy import:
```tsx
const TeamPage = lazy(() => import('@/pages/TeamPage'))
```

Add the `/team/*` route inside the `<Routes>` block, alongside the existing `/admin/*` route:
```tsx
<Route
  path="/team/*"
  element={
    <ProtectedRoute allowedRoles={['team_member']}>
      <TeamPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/LoginPage.tsx client/src/context/AuthContext.tsx client/src/components/auth/ProtectedRoute.tsx client/src/App.tsx
git commit -m "feat: route team_member to /team, add ProtectedRoute support, register TeamPage route"
```

---

## Task 9: AdminTeam.tsx — member management + permissions + chat

**Files:**
- Create: `client/src/pages/admin/AdminTeam.tsx`

This is the admin-side team management page. It has three zones: left panel (member list), right panel top (profile + permissions), right panel bottom (real-time chat).

- [ ] **Step 1: Create AdminTeam.tsx**

```tsx
import { useState, useEffect, useRef } from 'react'
import { Users, Plus, PencilSimple, Trash, ChatCircleDots, X, Check } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { teamService } from '@/services/team.service'
import { useSocket } from '@/context/SocketContext'
import { useAuth } from '@/context/AuthContext'
import type { TeamMember, TeamChatMessage } from '@/types/api'

// ─── Permission Groups ────────────────────────────────────────────────────────

const PERMISSION_GROUPS = [
  {
    label: 'Core',
    items: [
      { key: 'overview', label: 'Overview' },
      { key: 'students', label: 'Students' },
      { key: 'courses', label: 'Courses' },
      { key: 'instructors', label: 'Instructors' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { key: 'payments', label: 'Payments' },
      { key: 'financial-aid', label: 'Financial Aid' },
      { key: 'salaries', label: 'Salaries' },
      { key: 'certificates', label: 'Certificates' },
      { key: 'referrals', label: 'Referrals' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { key: 'messages', label: 'Messages' },
      { key: 'support', label: 'Support' },
      { key: 'contacts', label: 'Contacts' },
      { key: 'email', label: 'Email System' },
      { key: 'reviews', label: 'Reviews' },
      { key: 'notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Content',
    items: [
      { key: 'blog', label: 'Blog Manager' },
      { key: 'seo', label: 'SEO Manager' },
      { key: 'cms', label: 'CMS Editor' },
      { key: 'geo-access', label: 'Geo Access' },
    ],
  },
]

// ─── Member Modal ─────────────────────────────────────────────────────────────

interface MemberModalProps {
  member: TeamMember | null
  onClose: () => void
  onSave: (member: TeamMember) => void
}

function MemberModal({ member, onClose, onSave }: MemberModalProps) {
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [password, setPassword] = useState('')
  const [jobTitle, setJobTitle] = useState(member?.jobTitle ?? '')
  const [permissions, setPermissions] = useState<string[]>(member?.permissions ?? [])
  const [saving, setSaving] = useState(false)

  const togglePermission = (key: string) => {
    setPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required.')
      return
    }
    if (!member && !password.trim()) {
      toast.error('Password is required for new members.')
      return
    }
    setSaving(true)
    try {
      let result: TeamMember
      if (member) {
        const res = await teamService.updateMember(member._id, {
          name, email, jobTitle, permissions,
        })
        result = res.data
        toast.success('Team member updated.')
      } else {
        const res = await teamService.createMember({
          name, email, password, jobTitle, permissions,
        })
        result = res.data
        toast.success('Team member created. Welcome email sent.')
      }
      onSave(result)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to save team member.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500"
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Job Title</label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500"
                placeholder="e.g. Content Manager"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500"
              placeholder="email@example.com"
              required
            />
          </div>

          {!member && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Initial Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500"
                placeholder="Min. 8 characters"
                minLength={8}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-3">Page Access</label>
            <div className="space-y-4">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => togglePermission(item.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          permissions.includes(item.key)
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700 hover:border-violet-400'
                        }`}
                      >
                        {permissions.includes(item.key) && <Check size={10} weight="bold" className="inline mr-1" />}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : member ? 'Save Changes' : 'Create Member'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminTeam() {
  const { user } = useAuth()
  const { socket } = useSocket()

  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TeamMember | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null)

  // Chat state
  const [messages, setMessages] = useState<TeamChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Permissions saving debounce
  const permSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    teamService.listMembers()
      .then(res => setMembers(res.data))
      .catch(() => toast.error('Failed to load team members.'))
      .finally(() => setLoading(false))
  }, [])

  // Fetch chat thread when selection changes
  useEffect(() => {
    if (!selected) return
    setMessages([])
    teamService.getAdminThread(selected._id)
      .then(res => setMessages(res.data))
      .catch(() => {})
    teamService.markAdminThreadRead(selected._id).catch(() => {})
  }, [selected?._id])

  // Socket listener for incoming team messages
  useEffect(() => {
    if (!socket) return
    const handler = (msg: TeamChatMessage) => {
      if (
        selected &&
        (msg.from._id === selected._id || (msg.from._id === user?._id))
      ) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    }
    socket.on('team:message:received', handler)
    return () => { socket.off('team:message:received', handler) }
  }, [socket, selected, user])

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleModalSave = (savedMember: TeamMember) => {
    if (editTarget) {
      setMembers(prev => prev.map(m => m._id === savedMember._id ? savedMember : m))
      if (selected?._id === savedMember._id) setSelected(savedMember)
    } else {
      setMembers(prev => [savedMember, ...prev])
    }
    setModalOpen(false)
    setEditTarget(null)
  }

  const handleDelete = async (member: TeamMember) => {
    try {
      await teamService.deleteMember(member._id)
      setMembers(prev => prev.filter(m => m._id !== member._id))
      if (selected?._id === member._id) setSelected(null)
      toast.success('Team member removed.')
    } catch {
      toast.error('Failed to remove team member.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handlePermissionToggle = (key: string) => {
    if (!selected) return
    const updated = selected.permissions.includes(key)
      ? selected.permissions.filter(p => p !== key)
      : [...selected.permissions, key]

    const updatedMember = { ...selected, permissions: updated }
    setSelected(updatedMember)
    setMembers(prev => prev.map(m => m._id === selected._id ? updatedMember : m))

    if (permSaveTimer.current) clearTimeout(permSaveTimer.current)
    permSaveTimer.current = setTimeout(() => {
      teamService.updateMember(selected._id, { permissions: updated })
        .catch(() => toast.error('Failed to save permissions.'))
    }, 600)
  }

  const handleSendMessage = async () => {
    if (!selected || !chatInput.trim() || sendingMessage) return
    setSendingMessage(true)
    try {
      socket?.emit('team:message:send', { toId: selected._id, message: chatInput.trim() })
      setChatInput('')
    } finally {
      setSendingMessage(false)
    }
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* ── LEFT: Member list ── */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 dark:border-neutral-800 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Team Members</h2>
            <p className="text-[11px] text-slate-400 dark:text-neutral-600">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors"
          >
            <Plus size={13} weight="bold" />
            Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && members.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-neutral-600">
              <Users size={28} className="mb-2" />
              <p className="text-xs font-medium">No team members yet</p>
            </div>
          )}
          {members.map(member => (
            <button
              key={member._id}
              onClick={() => setSelected(member)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                selected?._id === member._id
                  ? 'bg-violet-50 dark:bg-violet-950/30 border-r-2 border-violet-600'
                  : 'hover:bg-slate-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 text-sm font-black flex-shrink-0">
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{member.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-600 truncate">{member.jobTitle || 'Team Member'}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); setEditTarget(member); setModalOpen(true) }}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-colors"
                >
                  <PencilSimple size={13} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteTarget(member) }}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                >
                  <Trash size={13} />
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      {!selected ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-neutral-600">
          <Users size={40} className="mb-3" />
          <p className="text-sm font-medium">Select a team member to view details and chat</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Profile + Permissions */}
          <div className="flex-shrink-0 border-b border-slate-100 dark:border-neutral-800 p-5 overflow-y-auto max-h-[55%]">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 text-lg font-black">
                {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{selected.name}</h3>
                <p className="text-sm text-slate-500 dark:text-neutral-400">{selected.jobTitle || 'Team Member'} · {selected.email}</p>
              </div>
            </div>

            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-3">Page Access</p>
            <div className="space-y-4">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold text-slate-300 dark:text-neutral-700 uppercase tracking-widest mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <button
                        key={item.key}
                        onClick={() => handlePermissionToggle(item.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selected.permissions.includes(item.key)
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-slate-50 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500 border-slate-200 dark:border-neutral-700 hover:border-violet-400'
                        }`}
                      >
                        {selected.permissions.includes(item.key) && <Check size={10} weight="bold" className="inline mr-1" />}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
              <ChatCircleDots size={16} className="text-violet-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">Chat with {selected.name}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-xs text-slate-400 dark:text-neutral-600 py-8">No messages yet. Say hello!</p>
              )}
              {messages.map(msg => {
                const isMe = msg.from._id === user?._id
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white rounded-bl-sm'
                    }`}>
                      {msg.message}
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-violet-200' : 'text-slate-400 dark:text-neutral-600'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2 px-5 py-3 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || sendingMessage}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {modalOpen && (
          <MemberModal
            member={editTarget}
            onClose={() => { setModalOpen(false); setEditTarget(null) }}
            onSave={handleModalSave}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-2xl"
            >
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">Remove Team Member?</h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">
                <strong>{deleteTarget.name}</strong> will lose access to the dashboard immediately.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/admin/AdminTeam.tsx
git commit -m "feat: AdminTeam page — member list, permissions panel, real-time chat"
```

---

## Task 10: Add Team nav item to AdminPage + register route

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

- [ ] **Step 1: Add AdminTeam lazy import**

At the top of `AdminPage.tsx`, add to the lazy imports block:
```tsx
const AdminTeam = lazy(() => import('./admin/AdminTeam'))
```

- [ ] **Step 2: Add 'team' to AdminView type**

Find:
```ts
export type AdminView = 'overview' | 'students' | ...
```
Add `'team'` to the union:
```ts
export type AdminView = 'overview' | 'students' | 'instructors' | 'courses' | 'certificates' | 'payments' | 'payments-setup' | 'financial-aid' | 'salaries' | 'cms' | 'blog' | 'settings' | 'support' | 'notifications' | 'messages' | 'seo' | 'reviews' | 'geo-access' | 'contacts' | 'referrals' | 'email' | 'team'
```

- [ ] **Step 3: Add Team to NAV_CORE**

In `AdminPage.tsx`, add `UsersThree` to the phosphor import:
```tsx
import {
  ChartBar, Users, UsersThree, Chalkboard, BookOpen, ...
} from '@phosphor-icons/react'
```

In `NAV_CORE`, add:
```tsx
{ view: 'team', label: 'Team', path: 'team', Icon: UsersThree as NavItem['Icon'] },
```

- [ ] **Step 4: Add Team route**

Inside the `<Routes>` block in the main return, add:
```tsx
<Route path="/team" element={<AdminTeam />} />
```

- [ ] **Step 5: Verify admin dashboard loads and Team nav item appears**

Start the dev server (`npm run dev` in `client/`). Navigate to `/admin`. Confirm "Team" appears in the Core nav section. Click it — AdminTeam page should render.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/AdminPage.tsx
git commit -m "feat: add Team nav item and route to AdminPage"
```

---

## Task 11: TeamPage.tsx — team member dashboard shell + floating chat

**Files:**
- Create: `client/src/pages/TeamPage.tsx`

- [ ] **Step 1: Create TeamPage.tsx**

```tsx
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  ChartBar, Users, BookOpen, Chalkboard, CreditCard, Handshake,
  Money, Certificate, Gift, Chats, ChatCircleDots, EnvelopeSimple,
  Star, Bell, PencilSimple, Globe, GearSix, SignOut, List, X, ChatTeardropText
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { teamService } from '@/services/team.service'
import Loader from '@/components/Loader'
import UserAvatar from '@/components/UserAvatar'
import type { TeamChatMessage } from '@/types/api'
import type { Student, Instructor, Course, CMSPage } from './admin/adminData'
import { INITIAL_STUDENTS, INITIAL_INSTRUCTORS, INITIAL_COURSES, INITIAL_CMS_PAGES } from './admin/adminData'
import type { AdminStore } from './AdminPage'
import toast from 'react-hot-toast'

// ─── Lazy-load the same admin page components ─────────────────────────────────
const AdminOverview     = lazy(() => import('./admin/AdminOverview'))
const AdminStudents     = lazy(() => import('./admin/AdminStudents'))
const AdminInstructors  = lazy(() => import('./admin/AdminInstructors'))
const AdminCourses      = lazy(() => import('./admin/AdminCourses'))
const AdminCertificates = lazy(() => import('./admin/AdminCertificates'))
const AdminPaymentsView = lazy(() => import('./admin/AdminPaymentsView'))
const AdminFinancialAid = lazy(() => import('./admin/AdminFinancialAid'))
const AdminCMS          = lazy(() => import('./admin/AdminCMS'))
const AdminBlog         = lazy(() => import('./admin/AdminBlog'))
const AdminSupport      = lazy(() => import('./admin/AdminSupport'))
const AdminNotifications= lazy(() => import('./admin/AdminNotifications'))
const AdminMessages     = lazy(() => import('./admin/AdminMessages'))
const AdminSEO          = lazy(() => import('./admin/AdminSEO'))
const AdminReviews      = lazy(() => import('./admin/AdminReviews'))
const AdminGeoAccess    = lazy(() => import('./admin/AdminGeoAccess'))
const AdminSalaries     = lazy(() => import('./admin/AdminSalaries'))
const AdminContacts     = lazy(() => import('./admin/AdminContacts'))
const AdminReferrals    = lazy(() => import('./admin/AdminReferrals'))
const AdminEmail        = lazy(() => import('./admin/AdminEmail'))

// ─── Permission → nav item mapping ───────────────────────────────────────────

const ALL_NAV = [
  { key: 'overview',       label: 'Overview',      path: '',              Icon: ChartBar },
  { key: 'students',       label: 'Students',       path: 'students',      Icon: Users },
  { key: 'courses',        label: 'Courses',        path: 'courses',       Icon: BookOpen },
  { key: 'instructors',    label: 'Instructors',    path: 'instructors',   Icon: Chalkboard },
  { key: 'payments',       label: 'Payments',       path: 'payments',      Icon: CreditCard },
  { key: 'financial-aid',  label: 'Financial Aid',  path: 'financial-aid', Icon: Handshake },
  { key: 'salaries',       label: 'Salaries',       path: 'salaries',      Icon: Money },
  { key: 'certificates',   label: 'Certificates',   path: 'certificates',  Icon: Certificate },
  { key: 'referrals',      label: 'Referrals',      path: 'referrals',     Icon: Gift },
  { key: 'messages',       label: 'Messages',       path: 'messages',      Icon: Chats },
  { key: 'support',        label: 'Support',        path: 'support',       Icon: ChatCircleDots },
  { key: 'contacts',       label: 'Contacts',       path: 'contacts',      Icon: EnvelopeSimple },
  { key: 'email',          label: 'Email System',   path: 'email',         Icon: EnvelopeSimple },
  { key: 'reviews',        label: 'Reviews',        path: 'reviews',       Icon: Star },
  { key: 'notifications',  label: 'Notifications',  path: 'notifications', Icon: Bell },
  { key: 'blog',           label: 'Blog Manager',   path: 'blog',          Icon: PencilSimple },
  { key: 'seo',            label: 'SEO Manager',    path: 'seo',           Icon: Globe },
  { key: 'cms',            label: 'CMS Editor',     path: 'cms',           Icon: PencilSimple },
  { key: 'geo-access',     label: 'Geo Access',     path: 'geo-access',    Icon: Globe },
]

// ─── Floating chat bubble ─────────────────────────────────────────────────────

function TeamChatBubble() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<TeamChatMessage[]>([])
  const [input, setInput] = useState('')
  const [unread, setUnread] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    teamService.getMemberThread()
      .then(res => setMessages(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!socket) return
    const handler = (msg: TeamChatMessage) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
      if (!open && msg.from._id !== user?._id) {
        setUnread(u => u + 1)
      }
    }
    socket.on('team:message:received', handler)
    return () => { socket.off('team:message:received', handler) }
  }, [socket, open, user])

  useEffect(() => {
    if (open) {
      setUnread(0)
      teamService.markMemberThreadRead().catch(() => {})
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [open, messages.length])

  const handleSend = () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    // Team member sends via REST — server emits socket events to both parties
    teamService.sendMemberMessage(text)
      .catch(() => toast.error('Failed to send message.'))
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-50 w-80 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '420px' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-violet-600">
              <div className="flex items-center gap-2">
                <ChatTeardropText size={16} className="text-white" />
                <span className="text-sm font-bold text-white">Chat with Admin</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-violet-200 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-xs text-slate-400 dark:text-neutral-600 py-8">No messages yet.</p>
              )}
              {messages.map(msg => {
                const isMe = msg.from._id === user?._id
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      isMe
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white rounded-bl-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>

            <div className="flex gap-2 px-3 py-3 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Message admin..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 text-xs"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-lg flex items-center justify-center transition-colors"
      >
        <ChatTeardropText size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  )
}

// ─── Main TeamPage shell ──────────────────────────────────────────────────────

export default function TeamPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const permissions: string[] = user?.permissions ?? []
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = ALL_NAV.filter(n => permissions.includes(n.key))
  const currentPath = location.pathname.replace('/team', '').replace(/^\//, '')
  const activeKey = navItems.find(n => n.path === currentPath)?.key ?? navItems[0]?.key ?? ''
  const activeLabel = navItems.find(n => n.key === activeKey)?.label ?? 'Dashboard'

  // Store (needed by AdminStudents, AdminInstructors, AdminCourses, AdminCMS)
  const [students, setStudents] = useState<Student[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_students') || 'null') ?? INITIAL_STUDENTS }
    catch { return INITIAL_STUDENTS }
  })
  const [instructors, setInstructors] = useState<Instructor[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_instructors') || 'null') ?? INITIAL_INSTRUCTORS }
    catch { return INITIAL_INSTRUCTORS }
  })
  const [courses, setCourses] = useState<Course[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_courses') || 'null') ?? INITIAL_COURSES }
    catch { return INITIAL_COURSES }
  })
  const [cmsPages, setCmsPages] = useState<CMSPage[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_cms') || 'null') ?? INITIAL_CMS_PAGES }
    catch { return INITIAL_CMS_PAGES }
  })

  const store: AdminStore = { students, instructors, courses, cmsPages, setStudents, setInstructors, setCourses, setCmsPages }

  function handleLogout() {
    logout()
    navigate('/')
  }

  if (permissions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 px-4">
        <div className="text-center">
          <GearSix size={48} className="mx-auto mb-4 text-slate-300 dark:text-neutral-700" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Pages Assigned</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">
            You don't have access to any pages yet. Contact your admin.
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-neutral-950 overflow-hidden">

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <motion.aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/20 dark:to-neutral-900 border-r border-slate-100 dark:border-neutral-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-5 h-[64px] border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.35)]">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 6l6-3 6 3-6 3-6-3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M3 12l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M3 9l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">EnglishPro</p>
            <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">Team Dashboard</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map(({ key, label, path, Icon }) => {
            const active = activeKey === key
            return (
              <button
                key={key}
                onClick={() => { navigate(`/team${path ? `/${path}` : ''}`); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 mb-1 ${
                  active
                    ? 'bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} weight={active ? 'fill' : 'regular'} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <UserAvatar user={user} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">Team Member</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 dark:text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <SignOut size={16} />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[64px] bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white">
            <List size={22} />
          </button>
          <h1 className="text-base font-black text-slate-900 dark:text-white truncate">{activeLabel}</h1>
          <div className="ml-auto">
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-1 rounded-lg">
              Team Member
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={
                permissions.includes('overview')
                  ? <AdminOverview onNavigate={() => {}} />
                  : <Navigate to={`/team/${navItems[0]?.path ?? ''}`} replace />
              } />
              {permissions.includes('students')    && <Route path="/students"     element={<AdminStudents store={store} />} />}
              {permissions.includes('instructors') && <Route path="/instructors"  element={<AdminInstructors store={store} />} />}
              {permissions.includes('courses')     && <Route path="/courses"      element={<AdminCourses store={store} />} />}
              {permissions.includes('certificates')&& <Route path="/certificates" element={<AdminCertificates />} />}
              {permissions.includes('payments')    && <Route path="/payments"     element={<AdminPaymentsView />} />}
              {permissions.includes('financial-aid')&&<Route path="/financial-aid"element={<AdminFinancialAid />} />}
              {permissions.includes('cms')         && <Route path="/cms/*"        element={<AdminCMS store={store} />} />}
              {permissions.includes('blog')        && <Route path="/blog"         element={<AdminBlog />} />}
              {permissions.includes('support')     && <Route path="/support"      element={<AdminSupport />} />}
              {permissions.includes('notifications')&&<Route path="/notifications"element={<AdminNotifications />} />}
              {permissions.includes('messages')    && <Route path="/messages"     element={<AdminMessages />} />}
              {permissions.includes('seo')         && <Route path="/seo"          element={<AdminSEO />} />}
              {permissions.includes('reviews')     && <Route path="/reviews"      element={<AdminReviews />} />}
              {permissions.includes('geo-access')  && <Route path="/geo-access"   element={<AdminGeoAccess />} />}
              {permissions.includes('salaries')    && <Route path="/salaries"     element={<AdminSalaries />} />}
              {permissions.includes('contacts')    && <Route path="/contacts"     element={<AdminContacts />} />}
              {permissions.includes('referrals')   && <Route path="/referrals"    element={<AdminReferrals />} />}
              {permissions.includes('email')       && <Route path="/email"        element={<AdminEmail />} />}
              <Route path="*" element={<Navigate to="/team" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Floating chat bubble */}
      <TeamChatBubble />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/TeamPage.tsx
git commit -m "feat: TeamPage shell — filtered nav, admin page components, floating chat bubble"
```

---

## Task 12: End-to-end verification

- [ ] **Step 1: Create a test team member via the admin dashboard**

1. Start both server and client (`npm run dev` in `client/`, `node index.js` in `server/`)
2. Log in as admin → navigate to `/admin/team`
3. Click "Add" → fill in name, email, password, job title
4. Toggle on 2–3 permissions (e.g. Students, Payments, Blog)
5. Click "Create Member" — confirm success toast

- [ ] **Step 2: Log in as the team member**

1. Log out of admin
2. Log in with the team member credentials
3. Confirm redirect to `/team`
4. Confirm sidebar shows only the 2–3 permitted pages
5. Navigate to each permitted page — confirm the page loads and data fetches correctly (no 403 errors)
6. Attempt to navigate to `/admin` — confirm redirect back to `/team`

- [ ] **Step 3: Test real-time chat**

1. Open two browser tabs: admin in Tab 1 (`/admin/team`), team member in Tab 2 (`/team`)
2. In Tab 1, select the team member → type a message → send
3. Confirm message appears in Tab 2's floating chat bubble with unread badge
4. Open the bubble → confirm message is visible → type a reply → send
5. Confirm reply appears in Tab 1's chat panel without page refresh

- [ ] **Step 4: Test permission revocation**

1. In admin tab, uncheck a permission the team member currently has
2. In team member tab, try to navigate to that page
3. Confirm the nav item disappears on next page load (or immediately if sidebar re-fetches)
4. Confirm the API returns 403 if team member tries to access that route directly

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete team management system — CRUD, permissions, real-time chat, team dashboard"
```
