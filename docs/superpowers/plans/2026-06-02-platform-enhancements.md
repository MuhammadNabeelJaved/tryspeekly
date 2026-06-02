# Platform Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add team-member activity tracking, newsletter analytics, SEO meta injection + sitemap, and minor search/tour updates to the English Learning Platform.

**Architecture:** Four independent subsystems. Activity tracking adds a server-side `ActivityLog` model + `logActivity` middleware wired into existing routes, plus a new AdminTeam "Activity" tab. Newsletter gets stats endpoints + a recharts growth chart + CSV export. SEO gets `react-helmet-async` meta injection on all public pages plus `/sitemap.xml` and `/robots.txt` Express endpoints. Search/tour changes are purely additive tweaks to existing arrays.

**Tech Stack:** Node.js/Express/Mongoose (server), React/TypeScript/Tailwind (client), recharts (charts), react-helmet-async (meta tags)

**Execution order:** Each subsystem is independent. Recommended order: A → B → C → D.

---

## Subsystem A — Team Activity Tracking

### Task A1: ActivityLog Mongoose model

**Files:**
- Create: `server/src/models/activity-log.model.js`

- [ ] Create the file:

```js
import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    teamMember:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:       { type: String, enum: ['create','update','delete','approve','reject','send','other'], required: true },
    resource:     { type: String, required: true },
    resourceId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    resourceName: { type: String, default: '' },
    details:      { type: String, default: '' },
    ip:           { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
)

activityLogSchema.index({ teamMember: 1, createdAt: -1 })
activityLogSchema.index({ resource: 1, createdAt: -1 })
activityLogSchema.index({ createdAt: -1 })

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema)
```

- [ ] Commit:
```bash
git add server/src/models/activity-log.model.js
git commit -m "feat(server): add ActivityLog model for team member action tracking"
```

---

### Task A2: logActivity middleware

**Files:**
- Create: `server/src/middlewares/activityLogger.js`

- [ ] Create the file:

```js
import ActivityLog from '../models/activity-log.model.js'

/**
 * HOF that returns Express middleware logging a team member action.
 * Only logs when req.user.role === 'team_member' and response is 2xx.
 *
 * @param {string} action   - one of: create|update|delete|approve|reject|send|other
 * @param {string} resource - e.g. 'blog', 'review', 'payment'
 * @param {function} [getInfo] - optional (req, resBody) => { resourceId, resourceName, details }
 */
export const logActivity = (action, resource, getInfo) => (req, res, next) => {
  if (req.user?.role !== 'team_member') return next()

  const originalJson = res.json.bind(res)
  res.json = function (body) {
    res.json = originalJson
    const result = originalJson(body)

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const info = getInfo ? getInfo(req, body) : {}
      ActivityLog.create({
        teamMember:   req.user._id,
        action,
        resource,
        resourceId:   info.resourceId   ?? null,
        resourceName: info.resourceName ?? '',
        details:      info.details      ?? '',
        ip:           req.ip ?? '',
      }).catch(err => console.error('[ActivityLog]', err.message))
    }

    return result
  }

  next()
}
```

- [ ] Commit:
```bash
git add server/src/middlewares/activityLogger.js
git commit -m "feat(server): add logActivity middleware for team member action logging"
```

---

### Task A3: ActivityLog controller + route

**Files:**
- Create: `server/src/controllers/activity-log.controller.js`
- Create: `server/src/routes/activity-log.route.js`
- Modify: `server/src/app.js` (add route mount)

- [ ] Create controller `server/src/controllers/activity-log.controller.js`:

```js
import asyncHandler from '../utils/asyncHandler.js'
import ActivityLog from '../models/activity-log.model.js'
import User from '../models/user.model.js'

// GET /api/v1/activity-logs  — admin only, paginated
export const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, teamMember, resource, startDate, endDate } = req.query
  const filter = {}
  if (teamMember)           filter.teamMember = teamMember
  if (resource)             filter.resource   = resource
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate)   filter.createdAt.$lte = new Date(endDate)
  }
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await ActivityLog.countDocuments(filter)
  const logs  = await ActivityLog.find(filter)
    .populate('teamMember', 'name profileImage jobTitle')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()
  res.json({ success: true, data: logs, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } })
})

// GET /api/v1/activity-logs/summary  — admin only, per-member counts last 30 days
export const getActivitySummary = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const rows = await ActivityLog.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$teamMember', count: { $sum: 1 }, lastAction: { $max: '$createdAt' } } },
    { $sort: { count: -1 } },
  ])
  const memberIds = rows.map(r => r._id)
  const members = await User.find({ _id: { $in: memberIds } }).select('name profileImage jobTitle').lean()
  const memberMap = {}
  members.forEach(m => { memberMap[m._id.toString()] = m })
  const data = rows.map(r => ({ ...r, member: memberMap[r._id?.toString()] ?? null }))
  res.json({ success: true, data })
})
```

- [ ] Create route `server/src/routes/activity-log.route.js`:

```js
import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { getActivityLogs, getActivitySummary } from '../controllers/activity-log.controller.js'

const router = Router()
router.use(authenticate, authorize('admin'))
router.get('/',        getActivityLogs)
router.get('/summary', getActivitySummary)
export default router
```

- [ ] Mount route in `server/src/app.js` — find where other routes are mounted (e.g. after the seo route line) and add:

```js
import activityLogRouter from './src/routes/activity-log.route.js'
// add alongside other app.use('/api/v1/...') lines:
app.use('/api/v1/activity-logs', activityLogRouter)
```

- [ ] Commit:
```bash
git add server/src/controllers/activity-log.controller.js server/src/routes/activity-log.route.js server/src/app.js
git commit -m "feat(server): add ActivityLog controller, route, and app mount"
```

---

### Task A4: Wire logActivity into resource routes

**Files:**
- Modify: `server/src/routes/blog.route.js`
- Modify: `server/src/routes/review.route.js`
- Modify: `server/src/routes/payment.route.js`
- Modify: `server/src/routes/certificate.route.js`
- Modify: `server/src/routes/financial-aid.route.js`
- Modify: `server/src/routes/support.route.js`
- Modify: `server/src/routes/contact.route.js`
- Modify: `server/src/routes/newsletter.route.js`
- Modify: `server/src/routes/seo.route.js`

For each route file, add `import { logActivity } from '../middlewares/activityLogger.js'` then inject `logActivity(action, resource, getInfo?)` as middleware on the relevant mutation handlers.

- [ ] **blog.route.js** — add import + inject on create/update/delete blog post routes. Find the router.post/put/patch/delete for admin blog and add the middleware:

```js
import { logActivity } from '../middlewares/activityLogger.js'

// Example: on the create-post route handler:
router.post('/', authenticate, canManageBlog,
  logActivity('create', 'blog', (req, body) => ({
    resourceId:   body.data?._id,
    resourceName: body.data?.title ?? req.body.title ?? '',
    details:      `Created blog post`,
  })),
  createBlogPost
)

// on update:
router.put('/:id', authenticate, canManageBlog,
  logActivity('update', 'blog', (req, body) => ({
    resourceId:   req.params.id,
    resourceName: body.data?.title ?? '',
    details:      `Updated blog post`,
  })),
  updateBlogPost
)

// on delete:
router.delete('/:id', authenticate, canManageBlog,
  logActivity('delete', 'blog', (req) => ({
    resourceId: req.params.id,
    details:    `Deleted blog post`,
  })),
  deleteBlogPost
)
```

- [ ] **review.route.js** — inject on `updateReviewStatus` and `adminDeleteReview`:

```js
import { logActivity } from '../middlewares/activityLogger.js'

router.patch('/admin/:id/status', authenticate, authorizeTeamPage('reviews'),
  logActivity('update', 'review', (req) => ({
    resourceId: req.params.id,
    details:    `Status → ${req.body.status ?? ''}`,
  })),
  updateReviewStatus
)

router.delete('/admin/:id', authenticate, authorizeTeamPage('reviews'),
  logActivity('delete', 'review', (req) => ({
    resourceId: req.params.id,
    details:    'Deleted review',
  })),
  adminDeleteReview
)
```

- [ ] **payment.route.js** — inject on approve and reject:

```js
import { logActivity } from '../middlewares/activityLogger.js'

router.route('/:id/approve').patch(authenticate, authorizeTeamPage('payments'),
  logActivity('approve', 'payment', (req) => ({ resourceId: req.params.id, details: 'Payment approved' })),
  approvePayment
)

router.route('/:id/reject').patch(authenticate, authorizeTeamPage('payments'),
  logActivity('reject', 'payment', (req) => ({ resourceId: req.params.id, details: `Rejected: ${req.body.rejectionReason ?? ''}` })),
  rejectPayment
)
```

- [ ] **certificate.route.js** — inject on revoke and delete:

```js
import { logActivity } from '../middlewares/activityLogger.js'

router.route('/:id/revoke').patch(authenticate, authorizeTeamPage('certificates'),
  logActivity('update', 'certificate', (req) => ({ resourceId: req.params.id, details: 'Certificate revoked' })),
  revokeCertificate
)

router.route('/:id').delete(authenticate, authorizeTeamPage('certificates'),
  logActivity('delete', 'certificate', (req) => ({ resourceId: req.params.id, details: 'Certificate deleted' })),
  deleteCertificate
)
```

- [ ] **financial-aid.route.js** — inject on status update:

```js
import { logActivity } from '../middlewares/activityLogger.js'

router.route('/:id/status').patch(authenticate, authorizeTeamPage('financial-aid'),
  logActivity('update', 'financial-aid', (req) => ({
    resourceId: req.params.id,
    details:    `Status → ${req.body.status ?? ''}`,
  })),
  updateApplicationStatus
)
```

- [ ] **support.route.js** — inject on status update and delete:

```js
import { logActivity } from '../middlewares/activityLogger.js'

router.route('/:id/status').patch(authenticate, authorizeTeamPage('support'),
  logActivity('update', 'support', (req) => ({ resourceId: req.params.id, details: `Status → ${req.body.status ?? ''}` })),
  updateTicketStatus
)

router.route('/:id').delete(authenticate, authorizeTeamPage('support'),
  logActivity('delete', 'support', (req) => ({ resourceId: req.params.id, details: 'Ticket deleted' })),
  deleteTicket
)
```

- [ ] **contact.route.js** — inject on update and delete:

```js
import { logActivity } from '../middlewares/activityLogger.js'

router.route('/:id').patch(authenticate, authorizeTeamPage('contacts'),
  logActivity('update', 'contact', (req) => ({ resourceId: req.params.id, details: `Status → ${req.body.status ?? ''}` })),
  updateContact
)

router.route('/:id').delete(authenticate, authorizeTeamPage('contacts'),
  logActivity('delete', 'contact', (req) => ({ resourceId: req.params.id, details: 'Contact deleted' })),
  deleteContact
)
```

- [ ] **newsletter.route.js** — inject on campaign send and subscriber delete:

```js
import { logActivity } from '../middlewares/activityLogger.js'

router.post('/campaigns/:id/send', authenticate, authorizeTeamPage('newsletter'),
  logActivity('send', 'newsletter-campaign', (req) => ({ resourceId: req.params.id, details: 'Campaign sent' })),
  sendCampaign
)

router.route('/subscribers/:id').delete(authenticate, authorizeTeamPage('newsletter'),
  logActivity('delete', 'newsletter-subscriber', (req) => ({ resourceId: req.params.id, details: 'Subscriber deleted' })),
  deleteSubscriber
)
```

- [ ] **seo.route.js** — inject on upsertPage:

```js
import { logActivity } from '../middlewares/activityLogger.js'

router.route('/:slug').put(
  logActivity('update', 'seo', (req) => ({ resourceName: req.params.slug, details: `Updated SEO for /${req.params.slug}` })),
  upsertPage
)
```

- [ ] Commit:
```bash
git add server/src/routes/
git commit -m "feat(server): wire logActivity middleware into team-accessible resource routes"
```

---

### Task A5: ActivityLog client service

**Files:**
- Create: `client/src/services/activity-log.service.ts`

- [ ] Create the file:

```ts
import { axiosClient } from '../lib/axiosClient'

export interface ActivityLogEntry {
  _id: string
  teamMember: { _id: string; name: string; profileImage?: string; jobTitle?: string } | null
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'send' | 'other'
  resource: string
  resourceId: string | null
  resourceName: string
  details: string
  ip: string
  createdAt: string
}

export interface ActivitySummaryEntry {
  _id: string
  count: number
  lastAction: string
  member: { _id: string; name: string; profileImage?: string; jobTitle?: string } | null
}

export const activityLogService = {
  async getLogs(params?: {
    page?: number; limit?: number; teamMember?: string; resource?: string;
    startDate?: string; endDate?: string
  }) {
    const res = await axiosClient.get<{
      success: boolean
      data: ActivityLogEntry[]
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>('/activity-logs', { params })
    return res.data
  },

  async getSummary() {
    const res = await axiosClient.get<{ success: boolean; data: ActivitySummaryEntry[] }>('/activity-logs/summary')
    return res.data
  },
}
```

- [ ] Commit:
```bash
git add client/src/services/activity-log.service.ts
git commit -m "feat(client): add activityLogService for team member activity API"
```

---

### Task A6: AdminTeam Activity tab

**Files:**
- Modify: `client/src/pages/admin/AdminTeam.tsx`

The file currently shows a two-panel layout (member list + detail/chat). Add a top-level tab switcher between "Members" and "Activity".

- [ ] Add imports at the top of `AdminTeam.tsx`:

```tsx
import { activityLogService, type ActivityLogEntry, type ActivitySummaryEntry } from '@/services/activity-log.service'
import { Activity, ArrowCounterClockwise } from '@phosphor-icons/react'
```

- [ ] Add `type AdminTeamTab = 'members' | 'activity'` near the top of the component and add state:

```tsx
const [teamTab, setTeamTab] = useState<'members' | 'activity'>('members')
```

- [ ] Add the `ActivityTab` sub-component just before the `export default` statement:

```tsx
function ActivityTab() {
  const [logs, setLogs]       = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterMember, setFilterMember] = useState('')
  const [filterResource, setFilterResource] = useState('')
  const [summary, setSummary] = useState<ActivitySummaryEntry[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, limit: 25 }
      if (filterMember)   params.teamMember = filterMember
      if (filterResource) params.resource   = filterResource
      const [logsRes, summaryRes] = await Promise.all([
        activityLogService.getLogs(params as Parameters<typeof activityLogService.getLogs>[0]),
        activityLogService.getSummary(),
      ])
      setLogs(logsRes.data)
      setTotalPages(logsRes.pagination.totalPages)
      setSummary(summaryRes.data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [page, filterMember, filterResource])

  useEffect(() => { load() }, [load])

  const ACTION_COLORS: Record<string, string> = {
    create:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    update:  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    delete:  'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    approve: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    reject:  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    send:    'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    other:   'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400',
  }

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="p-5 overflow-y-auto flex-1">
      {/* Summary pills */}
      {summary.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {summary.slice(0, 6).map(s => (
            <button
              key={s._id}
              onClick={() => { setFilterMember(filterMember === s._id ? '' : s._id); setPage(1) }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                filterMember === s._id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                  : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:border-violet-300'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-[9px] font-black text-violet-600 dark:text-violet-400">
                {s.member?.name?.charAt(0) ?? '?'}
              </span>
              {s.member?.name ?? 'Unknown'}
              <span className="bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{s.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterResource}
          onChange={e => { setFilterResource(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500"
        >
          <option value="">All Resources</option>
          {['blog','review','payment','certificate','financial-aid','support','contact','newsletter-campaign','newsletter-subscriber','seo'].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={() => { setFilterMember(''); setFilterResource(''); setPage(1) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-violet-600 transition-colors"
        >
          <ArrowCounterClockwise size={13} /> Reset
        </button>
      </div>

      {/* Log table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-neutral-600">
          <Activity size={32} className="mb-2" />
          <p className="text-sm font-medium">No activity yet</p>
          <p className="text-xs mt-1">Team member actions will appear here</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map(log => (
            <div key={log._id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-100 dark:border-neutral-800 hover:border-violet-200 dark:hover:border-violet-800/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-[10px] font-black text-violet-600 dark:text-violet-400 flex-shrink-0">
                {log.teamMember?.name?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{log.teamMember?.name ?? 'Unknown'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${ACTION_COLORS[log.action]}`}>{log.action}</span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">{log.resource}</span>
                  {log.resourceName && <span className="text-xs text-slate-400 dark:text-neutral-500 truncate max-w-[120px]">· {log.resourceName}</span>}
                </div>
                {log.details && <p className="text-[11px] text-slate-400 dark:text-neutral-500">{log.details}</p>}
              </div>
              <span className="text-[10px] text-slate-300 dark:text-neutral-600 flex-shrink-0 whitespace-nowrap">{relativeTime(log.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">Prev</button>
          <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">Next</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] Wrap the existing AdminTeam return with a tab switcher. Find the top-level `<div className="flex flex-col h-full...` return and add the tab bar before the existing content, then conditionally render `<ActivityTab />` or the existing members panel:

```tsx
// In AdminTeam return, wrap the whole content:
return (
  <div className="flex flex-col h-full">
    {/* Tab bar */}
    <div className="flex gap-1 p-4 pb-0 flex-shrink-0">
      <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl">
        {([['members', 'Members', Users], ['activity', 'Activity Log', Activity]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTeamTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              teamTab === key
                ? 'bg-white dark:bg-neutral-900 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}>
            <Icon size={14} weight={teamTab === key ? 'fill' : 'regular'} />
            {label}
          </button>
        ))}
      </div>
    </div>

    {teamTab === 'activity' ? (
      <ActivityTab />
    ) : (
      // ...existing members panel JSX...
    )}
  </div>
)
```

- [ ] Commit:
```bash
git add client/src/pages/admin/AdminTeam.tsx client/src/services/activity-log.service.ts
git commit -m "feat(admin): add Activity Log tab to AdminTeam page"
```

---

### Task A7: Update admin tour with Activity Log step

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

- [ ] Find `ADMIN_TOUR_STEPS` array in `AdminPage.tsx`. Find the entry with `target: 'admin-nav-team'` and update its content, then add a step after it for activity:

```tsx
{
  target: 'admin-nav-team',
  title: 'Team',
  content: 'Manage your internal team members. Add members, assign job titles, grant page permissions, chat with members, and monitor what each team member has done via the Activity Log tab.',
},
```

- [ ] Commit:
```bash
git add client/src/pages/AdminPage.tsx
git commit -m "feat(admin): update tour to mention team activity log"
```

---

## Subsystem B — Search Updates

### Task B1: Add missing Payments Setup to admin search

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

- [ ] Find `ADMIN_SEARCH_ITEMS` in `AdminPage.tsx`. After the Payments entry, add:

```tsx
{ label: 'Payments Setup',  description: 'Configure payment methods, account details, WhatsApp link and receipt email for student payments', path: '/admin/payments-setup', Icon: CreditCard as SearchItem['Icon'] },
```

- [ ] Commit:
```bash
git add client/src/pages/AdminPage.tsx
git commit -m "feat(admin): add Payments Setup to admin search palette"
```

---

## Subsystem C — Newsletter Advanced Features

### Task C1: Install recharts

**Files:**
- Modify: `client/package.json` (via npm)

- [ ] Install:
```bash
cd client && npm install recharts
```

Expected output: `added N packages`

- [ ] Commit:
```bash
cd .. && git add client/package.json client/package-lock.json
git commit -m "chore(client): install recharts for newsletter growth chart"
```

---

### Task C2: Newsletter stats + growth endpoints (server)

**Files:**
- Modify: `server/src/controllers/newsletter-subscriber.controller.js`
- Modify: `server/src/routes/newsletter.route.js`

- [ ] Append to `server/src/controllers/newsletter-subscriber.controller.js`:

```js
// ─── GET /api/v1/newsletter/stats (admin) ─────────────────────────────────────
export const getNewsletterStats = asyncHandler(async (req, res) => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [total, active, unsubscribed, thisMonth] = await Promise.all([
    NewsletterSubscriber.countDocuments({}),
    NewsletterSubscriber.countDocuments({ status: 'active' }),
    NewsletterSubscriber.countDocuments({ status: 'unsubscribed' }),
    NewsletterSubscriber.countDocuments({ subscribedAt: { $gte: startOfMonth } }),
  ])
  res.json({ success: true, data: { total, active, unsubscribed, thisMonth } })
})

// ─── GET /api/v1/newsletter/growth (admin) ────────────────────────────────────
export const getNewsletterGrowth = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const rows = await NewsletterSubscriber.aggregate([
    { $match: { subscribedAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$subscribedAt' }, month: { $month: '$subscribedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  const data = rows.map(r => ({
    month: new Date(r._id.year, r._id.month - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' }),
    subscribers: r.count,
  }))

  res.json({ success: true, data })
})
```

- [ ] Add to `server/src/routes/newsletter.route.js` (inside the `router.use(authenticate, authorizeTeamPage('newsletter'))` block):

```js
import { getNewsletterStats, getNewsletterGrowth } from '../controllers/newsletter-subscriber.controller.js'

// add these two lines before the existing subscriber routes:
router.get('/stats',  getNewsletterStats)
router.get('/growth', getNewsletterGrowth)
```

- [ ] Commit:
```bash
git add server/src/controllers/newsletter-subscriber.controller.js server/src/routes/newsletter.route.js
git commit -m "feat(server): add newsletter stats and growth aggregation endpoints"
```

---

### Task C3: Update newsletter service (client)

**Files:**
- Modify: `client/src/services/newsletter.service.ts`

- [ ] Add these two methods to the `newsletterService` object:

```ts
  getStats: async (): Promise<{ success: boolean; data: { total: number; active: number; unsubscribed: number; thisMonth: number } }> => {
    const res = await axiosClient.get('/newsletter/stats')
    return res.data
  },

  getGrowth: async (): Promise<{ success: boolean; data: Array<{ month: string; subscribers: number }> }> => {
    const res = await axiosClient.get('/newsletter/growth')
    return res.data
  },
```

- [ ] Commit:
```bash
git add client/src/services/newsletter.service.ts
git commit -m "feat(client): add getStats and getGrowth to newsletterService"
```

---

### Task C4: Newsletter UI — stats cards + growth chart + CSV export

**Files:**
- Modify: `client/src/pages/admin/AdminNewsletter.tsx`

- [ ] Add recharts import at top of `AdminNewsletter.tsx`:

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
```

- [ ] Add state variables inside `AdminNewsletter` component (alongside existing state):

```tsx
const [stats, setStats]   = useState<{ total: number; active: number; unsubscribed: number; thisMonth: number } | null>(null)
const [growth, setGrowth] = useState<Array<{ month: string; subscribers: number }>>([])
```

- [ ] Add a `useEffect` to load stats when on subscribers tab:

```tsx
useEffect(() => {
  if (activeTab !== 'subscribers') return
  Promise.all([newsletterService.getStats(), newsletterService.getGrowth()])
    .then(([s, g]) => {
      if (s.success) setStats(s.data)
      if (g.success) setGrowth(g.data)
    })
    .catch(() => {})
}, [activeTab])
```

- [ ] Add stats cards and growth chart in the subscribers tab, just above the existing subscriber search/table section (find `{activeTab === 'subscribers' && (` and add before the table div):

```tsx
{/* Stats cards */}
{stats && (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
    {[
      { label: 'Total Subscribers', value: stats.total,        color: 'text-violet-600' },
      { label: 'Active',            value: stats.active,       color: 'text-emerald-600' },
      { label: 'Unsubscribed',      value: stats.unsubscribed, color: 'text-slate-500' },
      { label: 'New This Month',    value: stats.thisMonth,    color: 'text-blue-600' },
    ].map(({ label, value, color }) => (
      <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <p className={`text-2xl font-black leading-none mb-1 ${color}`}>{value.toLocaleString()}</p>
        <p className="text-xs text-slate-500 dark:text-neutral-500 font-medium">{label}</p>
      </div>
    ))}
  </div>
)}

{/* Growth chart */}
{growth.length > 0 && (
  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 mb-5">
    <p className="text-sm font-bold text-slate-900 dark:text-white mb-4">Subscriber Growth (Last 6 Months)</p>
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={growth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          cursor={{ fill: 'rgba(124,58,237,0.06)' }}
        />
        <Bar dataKey="subscribers" radius={[6, 6, 0, 0]}>
          {growth.map((_, i) => (
            <Cell key={i} fill={i === growth.length - 1 ? '#7c3aed' : '#c4b5fd'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
)}
```

- [ ] Add CSV export button. Find the subscriber tab header area (the div with "All Subscribers" text and search input) and add the export button:

```tsx
<button
  onClick={() => {
    // Fetch all subscribers for export (no pagination)
    newsletterService.getSubscribers({ limit: 9999 }).then(res => {
      const rows = [
        ['email', 'status', 'subscribedAt'],
        ...res.data.subscribers.map(s => [s.email, s.status, new Date(s.subscribedAt).toISOString()]),
      ]
      const csv = rows.map(r => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `subscribers-${new Date().toISOString().slice(0,10)}.csv`
      a.click(); URL.revokeObjectURL(url)
    }).catch(() => toast.error('Export failed'))
  }}
  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:border-violet-300 hover:text-violet-600 transition-colors"
>
  <DownloadSimple size={14} /> Export CSV
</button>
```

- [ ] Add `DownloadSimple` to the phosphor-icons import at the top of the file.

- [ ] Commit:
```bash
git add client/src/pages/admin/AdminNewsletter.tsx client/src/services/newsletter.service.ts
git commit -m "feat(admin): add subscriber stats, growth chart, and CSV export to Newsletter page"
```

---

## Subsystem D — SEO Meta Injection + Sitemap + Robots.txt

### Task D1: Install react-helmet-async

- [ ] Install:
```bash
cd client && npm install react-helmet-async
```

Expected: `added N packages`

- [ ] Commit:
```bash
cd .. && git add client/package.json client/package-lock.json
git commit -m "chore(client): install react-helmet-async for dynamic meta tag injection"
```

---

### Task D2: Wrap app with HelmetProvider

**Files:**
- Modify: `client/src/main.tsx`

- [ ] Find `client/src/main.tsx`. Add import and wrap:

```tsx
import { HelmetProvider } from 'react-helmet-async'

// wrap the existing <App /> (or <RouterProvider /> or <BrowserRouter>) with HelmetProvider:
root.render(
  <React.StrictMode>
    <HelmetProvider>
      {/* existing app tree */}
    </HelmetProvider>
  </React.StrictMode>
)
```

- [ ] Commit:
```bash
git add client/src/main.tsx
git commit -m "feat(client): wrap app with HelmetProvider for react-helmet-async"
```

---

### Task D3: useSEO hook

**Files:**
- Create: `client/src/hooks/useSEO.ts`

- [ ] Create the file:

```ts
import { useEffect, useState } from 'react'
import { axiosClient } from '../lib/axiosClient'

interface SeoData {
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  canonicalUrl?: string
  robots?: { index?: boolean; follow?: boolean; noArchive?: boolean; noSnippet?: boolean }
  og?: { title?: string; description?: string; image?: string; imageAlt?: string; type?: string; url?: string; siteName?: string }
  twitter?: { card?: string; title?: string; description?: string; image?: string; site?: string }
  schemaMarkup?: string
  global?: { titleSuffix?: string; defaultOgImage?: string; googleSiteVerification?: string }
}

let globalCache: SeoData | null = null

async function fetchSeo(slug: string): Promise<SeoData | null> {
  try {
    const res = await axiosClient.get<{ success: boolean; data: SeoData }>(`/seo/public/${slug}`)
    return res.data.success ? res.data.data : null
  } catch {
    return null
  }
}

async function fetchGlobal(): Promise<SeoData | null> {
  if (globalCache) return globalCache
  const g = await fetchSeo('__global__')
  globalCache = g
  return g
}

export function useSEO(slug: string) {
  const [seo, setSeo] = useState<SeoData | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchSeo(slug), fetchGlobal()]).then(([page, global]) => {
      if (!cancelled) setSeo({ ...global, ...page, global: global?.global })
    })
    return () => { cancelled = true }
  }, [slug])

  return seo
}
```

- [ ] Commit:
```bash
git add client/src/hooks/useSEO.ts
git commit -m "feat(client): add useSEO hook for dynamic meta tag injection per page"
```

---

### Task D4: Create SEOMeta component

**Files:**
- Create: `client/src/components/SEOMeta.tsx`

- [ ] Create the file:

```tsx
import { Helmet } from 'react-helmet-async'
import { useSEO } from '../hooks/useSEO'

interface Props {
  slug: string
  fallbackTitle?: string
  fallbackDescription?: string
}

export default function SEOMeta({ slug, fallbackTitle = 'EnglishPro Academy', fallbackDescription = '' }: Props) {
  const seo = useSEO(slug)
  if (!seo) return null

  const title       = (seo.metaTitle || fallbackTitle) + (seo.global?.titleSuffix ?? '')
  const description = seo.metaDescription || fallbackDescription
  const keywords    = seo.metaKeywords?.join(', ') ?? ''
  const canonical   = seo.canonicalUrl ?? ''
  const ogImage     = seo.og?.image || seo.global?.defaultOgImage ?? ''

  const robotsContent = [
    seo.robots?.index  === false ? 'noindex'   : 'index',
    seo.robots?.follow === false ? 'nofollow'  : 'follow',
    seo.robots?.noArchive        ? 'noarchive' : '',
    seo.robots?.noSnippet        ? 'nosnippet' : '',
  ].filter(Boolean).join(', ')

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords    && <meta name="keywords"    content={keywords} />}
      {canonical   && <link rel="canonical"    href={canonical} />}
      <meta name="robots" content={robotsContent} />

      {/* Open Graph */}
      <meta property="og:title"       content={seo.og?.title       || title} />
      <meta property="og:description" content={seo.og?.description || description} />
      <meta property="og:type"        content={seo.og?.type        || 'website'} />
      {seo.og?.url      && <meta property="og:url"       content={seo.og.url} />}
      {seo.og?.siteName && <meta property="og:site_name" content={seo.og.siteName} />}
      {ogImage          && <meta property="og:image"     content={ogImage} />}
      {seo.og?.imageAlt && <meta property="og:image:alt" content={seo.og.imageAlt} />}

      {/* Twitter Card */}
      <meta name="twitter:card"        content={seo.twitter?.card        || 'summary_large_image'} />
      <meta name="twitter:title"       content={seo.twitter?.title       || title} />
      <meta name="twitter:description" content={seo.twitter?.description || description} />
      {seo.twitter?.image   && <meta name="twitter:image"   content={seo.twitter.image} />}
      {seo.twitter?.site    && <meta name="twitter:site"    content={seo.twitter.site} />}
      {seo.twitter?.creator && <meta name="twitter:creator" content={seo.twitter.creator} />}

      {/* Google Site Verification */}
      {seo.global?.googleSiteVerification && (
        <meta name="google-site-verification" content={seo.global.googleSiteVerification} />
      )}

      {/* JSON-LD Structured Data */}
      {seo.schemaMarkup && (
        <script type="application/ld+json">{seo.schemaMarkup}</script>
      )}
    </Helmet>
  )
}
```

- [ ] Commit:
```bash
git add client/src/components/SEOMeta.tsx
git commit -m "feat(client): add SEOMeta component using react-helmet-async"
```

---

### Task D5: Apply SEOMeta to all public pages

**Files:**
- Modify: `client/src/pages/HomePage.tsx` (or equivalent home component)
- Modify: `client/src/pages/CoursesPage.tsx`
- Modify: `client/src/pages/CourseDetailsPage.tsx`
- Modify: `client/src/pages/BlogPage.tsx`
- Modify: `client/src/pages/BlogPostPage.tsx`
- Modify: `client/src/pages/AboutPage.tsx`
- Modify: `client/src/pages/ContactPage.tsx`

For each public page, add `import SEOMeta from '@/components/SEOMeta'` then render `<SEOMeta slug="..." />` as the first element in the return:

| Page | slug |
|---|---|
| HomePage | `home` |
| CoursesPage | `courses` |
| CourseDetailsPage | `course-detail` |
| BlogPage | `blog` |
| BlogPostPage | `blog-post` |
| AboutPage | `about` |
| ContactPage | `contact` |

- [ ] For each page, add the import and component. Example for `BlogPage.tsx`:

```tsx
import SEOMeta from '@/components/SEOMeta'

// Inside the return, as first child:
return (
  <>
    <SEOMeta slug="blog" fallbackTitle="Blog — EnglishPro Academy" fallbackDescription="Study tips, grammar guides, and course announcements." />
    {/* ...rest of existing JSX... */}
  </>
)
```

- [ ] Commit:
```bash
git add client/src/pages/
git commit -m "feat(client): inject dynamic SEO meta tags on all public pages via SEOMeta component"
```

---

### Task D6: /sitemap.xml and /robots.txt Express endpoints

**Files:**
- Modify: `server/src/controllers/seo.controller.js`
- Modify: `server/src/routes/seo.route.js`

- [ ] Append to `server/src/controllers/seo.controller.js`:

```js
import Blog from '../models/blog.model.js'
import Course from '../models/course.model.js'

const CLIENT_URL = process.env.CLIENT_URL || 'https://yourdomain.com'

// GET /sitemap.xml  — public
export const getSitemap = asyncHandler(async (req, res) => {
  const [seoPages, blogs, courses] = await Promise.all([
    Seo.find({ 'sitemap.include': true }).select('pageUrl sitemap lastModified').lean(),
    Blog.find({ status: 'published' }).select('slug updatedAt').lean(),
    Course.find({ status: 'published' }).select('_id updatedAt').lean(),
  ])

  const urls = []

  for (const p of seoPages) {
    if (!p.pageUrl) continue
    urls.push(`
  <url>
    <loc>${CLIENT_URL}${p.pageUrl}</loc>
    <lastmod>${(p.lastModified || new Date()).toISOString().slice(0,10)}</lastmod>
    <changefreq>${p.sitemap?.changeFreq || 'weekly'}</changefreq>
    <priority>${p.sitemap?.priority ?? 0.5}</priority>
  </url>`)
  }

  for (const b of blogs) {
    urls.push(`
  <url>
    <loc>${CLIENT_URL}/blog/${b.slug}</loc>
    <lastmod>${new Date(b.updatedAt).toISOString().slice(0,10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
  }

  for (const c of courses) {
    urls.push(`
  <url>
    <loc>${CLIENT_URL}/courses/${c._id}</loc>
    <lastmod>${new Date(c.updatedAt).toISOString().slice(0,10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`

  res.set('Content-Type', 'application/xml')
  res.send(xml)
})

// GET /robots.txt  — public
export const getRobotsTxt = asyncHandler(async (req, res) => {
  const global = await Seo.findOne({ pageSlug: '__global__' }).select('global.robotsTxt').lean()
  const content = global?.global?.robotsTxt ||
    'User-agent: *\nAllow: /\n\nDisallow: /dashboard/\nDisallow: /admin/\nDisallow: /instructor/\n'
  res.set('Content-Type', 'text/plain')
  res.send(content)
})
```

- [ ] Add to `server/src/routes/seo.route.js` **before** the `router.use(authenticate, ...)` line so these are public:

```js
import { getSitemap, getRobotsTxt } from '../controllers/seo.controller.js'

router.get('/sitemap.xml', getSitemap)
router.get('/robots.txt',  getRobotsTxt)
```

- [ ] Also mount these at root level in `server/src/app.js` so `/sitemap.xml` and `/robots.txt` work without the `/api/v1/seo` prefix. Find where routes are mounted and add:

```js
// Serve sitemap and robots at root level for search engines
app.get('/sitemap.xml', (req, res) => res.redirect('/api/v1/seo/sitemap.xml'))
app.get('/robots.txt',  (req, res) => res.redirect('/api/v1/seo/robots.txt'))
```

- [ ] Commit:
```bash
git add server/src/controllers/seo.controller.js server/src/routes/seo.route.js server/src/app.js
git commit -m "feat(server): add /sitemap.xml and /robots.txt endpoints for Google crawling"
```

---

### Task D7: Structured data templates in AdminSEO Schema tab

**Files:**
- Modify: `client/src/pages/admin/AdminSEO.tsx`

Find the "Schema" tab section in `AdminSEO.tsx` (where `schemaMarkup` textarea is rendered) and add template buttons above the textarea:

- [ ] Add a `SchemaTemplates` helper component just above where it's used:

```tsx
const SCHEMA_TEMPLATES = {
  FAQ: (pageUrl: string) => JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "What courses do you offer?", "acceptedAnswer": { "@type": "Answer", "text": "We offer IELTS preparation, Business English, and General English courses." } },
      { "@type": "Question", "name": "How do I enroll?", "acceptedAnswer": { "@type": "Answer", "text": "Click 'Enroll Now' on any course page and complete the payment process." } }
    ]
  }, null, 2),

  Course: (pageUrl: string) => JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Course Name Here",
    "description": "Course description here.",
    "provider": { "@type": "Organization", "name": "EnglishPro Academy", "sameAs": pageUrl }
  }, null, 2),

  Organization: () => JSON.stringify({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "EnglishPro Academy",
    "url": "https://yoursite.com",
    "logo": "https://yoursite.com/logo.png",
    "contactPoint": { "@type": "ContactPoint", "telephone": "+923086925545", "contactType": "customer service" }
  }, null, 2),
}
```

- [ ] In the Schema tab UI, just above the schemaMarkup textarea, add:

```tsx
<div className="mb-3">
  <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Quick Templates</p>
  <div className="flex flex-wrap gap-2">
    {(Object.entries(SCHEMA_TEMPLATES) as [string, Function][]).map(([name, gen]) => (
      <button
        key={name}
        type="button"
        onClick={() => setDraft(d => ({ ...d, schemaMarkup: gen(d.pageUrl || '') }))}
        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:border-violet-400 hover:text-violet-600 transition-colors"
      >
        {name} Schema
      </button>
    ))}
    <button
      type="button"
      onClick={() => setDraft(d => ({ ...d, schemaMarkup: '' }))}
      className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
    >
      Clear
    </button>
  </div>
</div>
```

- [ ] Commit:
```bash
git add client/src/pages/admin/AdminSEO.tsx
git commit -m "feat(admin): add FAQ/Course/Organization structured data templates to SEO Schema tab"
```

---

### Task D8: Final push

- [ ] Push all commits:
```bash
git push origin main
```

Expected: all commits pushed successfully.

---

## Self-Review Checklist

- [x] ActivityLog model has correct indexes
- [x] `logActivity` only fires for team_member role — admins not tracked
- [x] `logActivity` is fire-and-forget (no await) — does not slow responses
- [x] `/sitemap.xml` and `/robots.txt` are public (before auth middleware)
- [x] `HelmetProvider` wraps entire app tree
- [x] `useSEO` caches the `__global__` entry to avoid duplicate requests
- [x] CSV export uses client-side Blob — no server change needed
- [x] `recharts` and `react-helmet-async` are installed before code that imports them
- [x] All route injections use existing `authorizeTeamPage(...)` — no `authorize('admin')` regressions
- [x] Schema templates are client-only UI helpers — no server change needed
