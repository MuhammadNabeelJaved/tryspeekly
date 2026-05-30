# Newsletter Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full newsletter management system — footer subscribe form wired to DB, admin panel for managing subscribers and sending/scheduling rich-text email campaigns via Resend.

**Architecture:** Split controller pattern: `newsletter-subscriber` and `newsletter-campaign` each get their own model, controller, and share one route file. A `newsletter-sender.js` utility handles Resend dispatch so the scheduler in `index.js` and the campaign controller both reuse the same logic without circular imports.

**Tech Stack:** Node.js/Express/Mongoose (server), React/TypeScript/TipTap (client), Resend (email), Tailwind CSS (UI)

**Spec:** `docs/superpowers/specs/2026-05-30-newsletter-management-design.md`

---

## File Map

**Create (server):**
- `server/src/models/newsletter-subscriber.model.js`
- `server/src/models/newsletter-campaign.model.js`
- `server/src/utils/newsletter-sender.js`
- `server/src/controllers/newsletter-subscriber.controller.js`
- `server/src/controllers/newsletter-campaign.controller.js`
- `server/src/routes/newsletter.route.js`

**Modify (server):**
- `server/app.js` — import + mount newsletter route
- `server/index.js` — add 60s scheduler loop

**Create (client):**
- `client/src/components/RichTextEditor.tsx`
- `client/src/services/newsletter.service.ts`
- `client/src/pages/UnsubscribePage.tsx`
- `client/src/pages/admin/AdminNewsletter.tsx`

**Modify (client):**
- `client/src/components/Footer.tsx` — wire subscribe form to API
- `client/src/App.tsx` — add `/unsubscribe` public route
- `client/src/pages/AdminPage.tsx` — add nav item, lazy import, route

**Tests:**
- `client/src/components/__tests__/Footer.test.tsx`
- `client/src/pages/__tests__/UnsubscribePage.test.tsx`

---

## Task 1: Install TipTap and create RichTextEditor component

**Files:**
- Modify: `client/package.json` (via npm install)
- Create: `client/src/components/RichTextEditor.tsx`

- [ ] **Step 1: Install TipTap packages**

```bash
cd "client"
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-link
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Create `client/src/components/RichTextEditor.tsx`**

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'
import {
  TextB, TextItalic, TextUnderline, ListBullets, ListNumbers,
  LinkSimple, ArrowCounterClockwise, ArrowClockwise,
} from '@phosphor-icons/react'

interface Props {
  value: string
  onChange: (html: string) => void
  minHeight?: string
}

export default function RichTextEditor({ value, onChange, minHeight = '300px' }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (editor && value === '') editor.commands.clearContent()
  }, [value, editor])

  if (!editor) return null

  const btn = (onClick: () => void, active: boolean, icon: React.ReactNode) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
          : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-white/5'
      }`}
    >
      {icon}
    </button>
  )

  return (
    <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
      <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/50">
        {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), <TextB size={15} weight="bold" />)}
        {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), <TextItalic size={15} />)}
        {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), <TextUnderline size={15} />)}
        <div className="w-px self-stretch bg-slate-200 dark:bg-white/10 mx-1" />
        {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), <ListBullets size={15} />)}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), <ListNumbers size={15} />)}
        <div className="w-px self-stretch bg-slate-200 dark:bg-white/10 mx-1" />
        {btn(
          () => {
            const url = window.prompt('Enter URL')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          },
          editor.isActive('link'),
          <LinkSimple size={15} />,
        )}
        <div className="w-px self-stretch bg-slate-200 dark:bg-white/10 mx-1" />
        {btn(() => editor.chain().focus().undo().run(), false, <ArrowCounterClockwise size={15} />)}
        {btn(() => editor.chain().focus().redo().run(), false, <ArrowClockwise size={15} />)}
      </div>
      <div className="p-3" style={{ minHeight }}>
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[inherit] prose prose-sm dark:prose-invert max-w-none"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "client"
npx tsc --noEmit
```

Expected: no errors on the new file.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/RichTextEditor.tsx client/package.json client/package-lock.json
git commit -m "feat: add TipTap RichTextEditor component"
```

---

## Task 2: Create newsletter-subscriber model

**Files:**
- Create: `server/src/models/newsletter-subscriber.model.js`

- [ ] **Step 1: Create the model**

```js
import mongoose from 'mongoose'

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
)

subscriberSchema.index({ email: 1 })
subscriberSchema.index({ token: 1 })
subscriberSchema.index({ status: 1 })

export default mongoose.model('NewsletterSubscriber', subscriberSchema)
```

Save to: `server/src/models/newsletter-subscriber.model.js`

- [ ] **Step 2: Commit**

```bash
git add server/src/models/newsletter-subscriber.model.js
git commit -m "feat: add NewsletterSubscriber model"
```

---

## Task 3: Create newsletter-campaign model

**Files:**
- Create: `server/src/models/newsletter-campaign.model.js`

- [ ] **Step 1: Create the model**

```js
import mongoose from 'mongoose'

const campaignSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 300,
    },
    htmlBody: {
      type: String,
      required: [true, 'Content is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
      default: 'draft',
      index: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    totalSent: {
      type: Number,
      default: 0,
    },
    totalFailed: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

campaignSchema.index({ createdAt: -1 })
campaignSchema.index({ status: 1, scheduledAt: 1 })

export default mongoose.model('NewsletterCampaign', campaignSchema)
```

Save to: `server/src/models/newsletter-campaign.model.js`

- [ ] **Step 2: Commit**

```bash
git add server/src/models/newsletter-campaign.model.js
git commit -m "feat: add NewsletterCampaign model"
```

---

## Task 4: Create newsletter-sender utility

**Files:**
- Create: `server/src/utils/newsletter-sender.js`

This utility is used by both the campaign controller (immediate send) and the scheduler (scheduled send). Keeping it separate avoids circular imports.

- [ ] **Step 1: Create the utility**

```js
import { Resend } from 'resend'
import EmailLog from '../models/email-log.model.js'
import NewsletterCampaign from '../models/newsletter-campaign.model.js'
import NewsletterSubscriber from '../models/newsletter-subscriber.model.js'

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 200

let _resend = null
const getResend = () => {
  if (!_resend && process.env.RESEND_API_KEY) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const buildHtml = (htmlBody, token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/unsubscribe?token=${token}`
  return `${htmlBody}
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center">
  <p style="margin:0;font-size:12px;color:#94a3b8">
    You received this because you subscribed to EnglishPro newsletters. &nbsp;
    <a href="${url}" style="color:#7c3aed;text-decoration:underline">Unsubscribe</a>
  </p>
</div>`
}

export const dispatchCampaign = async (campaignId) => {
  const campaign = await NewsletterCampaign.findById(campaignId).lean()
  if (!campaign || campaign.status !== 'sending') return

  const subscribers = await NewsletterSubscriber.find({ status: 'active' }).lean()
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL || 'EnglishPro <onboarding@resend.dev>'

  let totalSent = 0
  let totalFailed = 0

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (sub) => {
        const html = buildHtml(campaign.htmlBody, sub.token)
        try {
          if (resend) {
            await resend.emails.send({ from, to: sub.email, subject: campaign.subject, html })
          }
          await EmailLog.create({
            type: 'newsletter_campaign',
            to: sub.email,
            toName: '',
            subject: campaign.subject,
            status: resend ? 'sent' : 'skipped',
            metadata: { campaignId: String(campaignId) },
          })
          totalSent++
        } catch (err) {
          await EmailLog.create({
            type: 'newsletter_campaign',
            to: sub.email,
            toName: '',
            subject: campaign.subject,
            status: 'failed',
            error: err.message,
            metadata: { campaignId: String(campaignId) },
          }).catch(() => {})
          totalFailed++
        }
      })
    )

    if (i + BATCH_SIZE < subscribers.length) await sleep(BATCH_DELAY_MS)
  }

  await NewsletterCampaign.findByIdAndUpdate(campaignId, {
    status: 'sent',
    sentAt: new Date(),
    totalSent,
    totalFailed,
  })
}
```

Save to: `server/src/utils/newsletter-sender.js`

- [ ] **Step 2: Commit**

```bash
git add server/src/utils/newsletter-sender.js
git commit -m "feat: add newsletter batch dispatch utility"
```

---

## Task 5: Create newsletter-subscriber controller

**Files:**
- Create: `server/src/controllers/newsletter-subscriber.controller.js`

- [ ] **Step 1: Create the controller**

```js
import Joi from 'joi'
import { randomUUID } from 'crypto'
import asyncHandler from '../utils/asyncHandler.js'
import NewsletterSubscriber from '../models/newsletter-subscriber.model.js'
import { BadRequestError, NotFoundError, ConflictError } from '../utils/apiErrors.js'

const emailSchema = Joi.object({ email: Joi.string().email().required() })

// ─── POST /api/v1/newsletter/subscribers (public) ─────────────────────────────
export const subscribe = asyncHandler(async (req, res) => {
  const { error, value } = emailSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const existing = await NewsletterSubscriber.findOne({ email: value.email })

  if (existing) {
    if (existing.status === 'active') {
      throw new ConflictError('This email is already subscribed.')
    }
    existing.status = 'active'
    existing.unsubscribedAt = null
    existing.token = randomUUID()
    await existing.save()
    return res.json({ success: true, message: 'Welcome back! You have been re-subscribed.' })
  }

  await NewsletterSubscriber.create({ email: value.email, token: randomUUID() })
  res.status(201).json({ success: true, message: 'Subscribed successfully!' })
})

// ─── GET /api/v1/newsletter/subscribers (admin) ───────────────────────────────
export const getSubscribers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 20)
  const search = req.query.search?.trim()

  const filter = search ? { email: { $regex: search, $options: 'i' } } : {}
  const total = await NewsletterSubscriber.countDocuments(filter)
  const subscribers = await NewsletterSubscriber.find(filter)
    .sort({ subscribedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  res.json({
    success: true,
    data: {
      subscribers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  })
})

// ─── DELETE /api/v1/newsletter/subscribers/:id (admin) ────────────────────────
export const deleteSubscriber = asyncHandler(async (req, res) => {
  const sub = await NewsletterSubscriber.findByIdAndDelete(req.params.id)
  if (!sub) throw new NotFoundError('Subscriber not found')
  res.status(204).send()
})

// ─── PATCH /api/v1/newsletter/subscribers/:id/unsubscribe (admin) ─────────────
export const adminUnsubscribe = asyncHandler(async (req, res) => {
  const sub = await NewsletterSubscriber.findByIdAndUpdate(
    req.params.id,
    { status: 'unsubscribed', unsubscribedAt: new Date() },
    { new: true }
  )
  if (!sub) throw new NotFoundError('Subscriber not found')
  res.json({ success: true, message: 'Subscriber unsubscribed', data: sub })
})

// ─── GET /api/v1/newsletter/unsubscribe?token=xx (public) ─────────────────────
export const unsubscribeByToken = asyncHandler(async (req, res) => {
  const { token } = req.query
  if (!token) throw new BadRequestError('Token is required')

  await NewsletterSubscriber.findOneAndUpdate(
    { token },
    { status: 'unsubscribed', unsubscribedAt: new Date() }
  )
  res.json({ success: true, message: 'You have been unsubscribed successfully.' })
})
```

Save to: `server/src/controllers/newsletter-subscriber.controller.js`

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/newsletter-subscriber.controller.js
git commit -m "feat: add newsletter subscriber controller"
```

---

## Task 6: Create newsletter-campaign controller

**Files:**
- Create: `server/src/controllers/newsletter-campaign.controller.js`

- [ ] **Step 1: Create the controller**

```js
import Joi from 'joi'
import asyncHandler from '../utils/asyncHandler.js'
import NewsletterCampaign from '../models/newsletter-campaign.model.js'
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/apiErrors.js'
import { dispatchCampaign } from '../utils/newsletter-sender.js'

const EDITABLE = ['draft', 'scheduled']

const createSchema = Joi.object({
  subject: Joi.string().min(1).max(300).required(),
  htmlBody: Joi.string().min(1).required(),
  status: Joi.string().valid('draft', 'scheduled').required(),
  scheduledAt: Joi.when('status', {
    is: 'scheduled',
    then: Joi.date().greater('now').required(),
    otherwise: Joi.date().optional().allow(null),
  }),
})

const updateSchema = Joi.object({
  subject: Joi.string().min(1).max(300),
  htmlBody: Joi.string().min(1),
  status: Joi.string().valid('draft', 'scheduled'),
  scheduledAt: Joi.date().allow(null),
})

// ─── GET /api/v1/newsletter/campaigns ─────────────────────────────────────────
export const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await NewsletterCampaign.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .lean()
  res.json({ success: true, data: campaigns })
})

// ─── POST /api/v1/newsletter/campaigns ────────────────────────────────────────
export const createCampaign = asyncHandler(async (req, res) => {
  const { error, value } = createSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const campaign = await NewsletterCampaign.create({ ...value, createdBy: req.user.id })
  res.status(201).json({ success: true, message: 'Campaign created', data: campaign })
})

// ─── GET /api/v1/newsletter/campaigns/:id ─────────────────────────────────────
export const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await NewsletterCampaign.findById(req.params.id)
    .populate('createdBy', 'name email')
    .lean()
  if (!campaign) throw new NotFoundError('Campaign not found')
  res.json({ success: true, data: campaign })
})

// ─── PUT /api/v1/newsletter/campaigns/:id ─────────────────────────────────────
export const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await NewsletterCampaign.findById(req.params.id)
  if (!campaign) throw new NotFoundError('Campaign not found')
  if (!EDITABLE.includes(campaign.status)) {
    throw new ForbiddenError('Only draft and scheduled campaigns can be edited')
  }

  const { error, value } = updateSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  Object.assign(campaign, value)
  await campaign.save()
  res.json({ success: true, message: 'Campaign updated', data: campaign })
})

// ─── DELETE /api/v1/newsletter/campaigns/:id ──────────────────────────────────
export const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await NewsletterCampaign.findById(req.params.id)
  if (!campaign) throw new NotFoundError('Campaign not found')
  if (!EDITABLE.includes(campaign.status)) {
    throw new ForbiddenError('Only draft and scheduled campaigns can be deleted')
  }

  await campaign.deleteOne()
  res.status(204).send()
})

// ─── POST /api/v1/newsletter/campaigns/:id/send ───────────────────────────────
export const sendCampaign = asyncHandler(async (req, res) => {
  const campaign = await NewsletterCampaign.findById(req.params.id)
  if (!campaign) throw new NotFoundError('Campaign not found')
  if (!EDITABLE.includes(campaign.status)) {
    throw new ForbiddenError('Campaign has already been sent or is currently sending')
  }

  campaign.status = 'sending'
  await campaign.save()

  dispatchCampaign(campaign._id).catch(async (err) => {
    console.error('[Newsletter] dispatch error:', err.message)
    await NewsletterCampaign.findByIdAndUpdate(campaign._id, { status: 'failed' })
  })

  res.json({ success: true, message: 'Campaign is being sent', data: { id: campaign._id } })
})
```

Save to: `server/src/controllers/newsletter-campaign.controller.js`

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/newsletter-campaign.controller.js
git commit -m "feat: add newsletter campaign controller"
```

---

## Task 7: Create newsletter route file and register it

**Files:**
- Create: `server/src/routes/newsletter.route.js`
- Modify: `server/app.js`

- [ ] **Step 1: Create `server/src/routes/newsletter.route.js`**

```js
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  subscribe,
  getSubscribers,
  deleteSubscriber,
  adminUnsubscribe,
  unsubscribeByToken,
} from '../controllers/newsletter-subscriber.controller.js'
import {
  getCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
} from '../controllers/newsletter-campaign.controller.js'

const router = Router()

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many subscribe attempts. Please try again later.' },
})

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/subscribers', subscribeLimiter, subscribe)
router.get('/unsubscribe', unsubscribeByToken)

// ─── Admin ────────────────────────────────────────────────────────────────────
router.use(authenticate, authorize('admin'))

router.route('/subscribers').get(getSubscribers)
router.route('/subscribers/:id').delete(deleteSubscriber)
router.patch('/subscribers/:id/unsubscribe', adminUnsubscribe)

router.route('/campaigns').get(getCampaigns).post(createCampaign)
router.route('/campaigns/:id').get(getCampaign).put(updateCampaign).delete(deleteCampaign)
router.post('/campaigns/:id/send', sendCampaign)

export default router
```

- [ ] **Step 2: Register route in `server/app.js`**

Add this import after the existing route imports (around line 82, after `teamRoutes`):

```js
import newsletterRoutes from './src/routes/newsletter.route.js'
```

Add this mount after `app.use('/api/v1/team', teamRoutes)` (around line 113):

```js
app.use('/api/v1/newsletter', newsletterRoutes)
```

- [ ] **Step 3: Verify server starts without errors**

```bash
cd "server"
node --input-type=module --eval "import './app.js'" 2>&1 | head -5
```

Expected: no import errors (the command will fail to connect DB which is fine — we're just checking syntax).

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/newsletter.route.js server/app.js
git commit -m "feat: add newsletter route file and register in app"
```

---

## Task 8: Add scheduler to index.js

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Add imports at the top of `server/index.js`**

After the existing imports (after line 12), add:

```js
import NewsletterCampaign from './src/models/newsletter-campaign.model.js'
import { dispatchCampaign } from './src/utils/newsletter-sender.js'
```

- [ ] **Step 2: Add the scheduler after `connectDB().then(...)` block**

After the `connectDB().then(() => { ... }).catch(...)` block (after line 136), add:

```js
// ─── Newsletter scheduler — checks for due campaigns every 60 s ───────────────
setInterval(async () => {
  try {
    const due = await NewsletterCampaign.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() },
    }).lean()

    for (const campaign of due) {
      await NewsletterCampaign.findByIdAndUpdate(campaign._id, { status: 'sending' })
      dispatchCampaign(campaign._id).catch(async (err) => {
        console.error('[Newsletter scheduler] dispatch error:', err.message)
        await NewsletterCampaign.findByIdAndUpdate(campaign._id, { status: 'failed' })
      })
    }
  } catch (err) {
    console.warn('[Newsletter scheduler] error:', err.message)
  }
}, 60_000)
```

- [ ] **Step 3: Commit**

```bash
git add server/index.js
git commit -m "feat: add newsletter scheduled campaign dispatch loop"
```

---

## Task 9: Create newsletter.service.ts

**Files:**
- Create: `client/src/services/newsletter.service.ts`

- [ ] **Step 1: Create the service file**

```ts
import { axiosClient } from '../lib/axiosClient'

export interface NewsletterSubscriber {
  _id: string
  email: string
  status: 'active' | 'unsubscribed'
  subscribedAt: string
  unsubscribedAt: string | null
}

export interface NewsletterCampaign {
  _id: string
  subject: string
  htmlBody: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduledAt: string | null
  sentAt: string | null
  totalSent: number
  totalFailed: number
  createdBy: string | { name: string; email: string }
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface SubscriberListResponse {
  success: boolean
  data: { subscribers: NewsletterSubscriber[]; pagination: Pagination }
}

interface CampaignListResponse {
  success: boolean
  data: NewsletterCampaign[]
}

interface CampaignResponse {
  success: boolean
  message: string
  data: NewsletterCampaign
}

interface CreateCampaignDto {
  subject: string
  htmlBody: string
  status: 'draft' | 'scheduled'
  scheduledAt?: string
}

export const newsletterService = {
  subscribe: async (email: string) => {
    const res = await axiosClient.post<{ success: boolean; message: string }>('/newsletter/subscribers', { email })
    return res.data
  },

  getSubscribers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await axiosClient.get<SubscriberListResponse>('/newsletter/subscribers', { params })
    return res.data
  },

  unsubscribeSubscriber: async (id: string) => {
    const res = await axiosClient.patch<{ success: boolean }>(`/newsletter/subscribers/${id}/unsubscribe`)
    return res.data
  },

  deleteSubscriber: async (id: string) => {
    await axiosClient.delete(`/newsletter/subscribers/${id}`)
  },

  unsubscribeByToken: async (token: string) => {
    const res = await axiosClient.get<{ success: boolean; message: string }>('/newsletter/unsubscribe', { params: { token } })
    return res.data
  },

  getCampaigns: async () => {
    const res = await axiosClient.get<CampaignListResponse>('/newsletter/campaigns')
    return res.data
  },

  getCampaign: async (id: string) => {
    const res = await axiosClient.get<CampaignResponse>(`/newsletter/campaigns/${id}`)
    return res.data
  },

  createCampaign: async (data: CreateCampaignDto) => {
    const res = await axiosClient.post<CampaignResponse>('/newsletter/campaigns', data)
    return res.data
  },

  updateCampaign: async (id: string, data: Partial<CreateCampaignDto>) => {
    const res = await axiosClient.put<CampaignResponse>(`/newsletter/campaigns/${id}`, data)
    return res.data
  },

  deleteCampaign: async (id: string) => {
    await axiosClient.delete(`/newsletter/campaigns/${id}`)
  },

  sendCampaign: async (id: string) => {
    const res = await axiosClient.post<{ success: boolean; message: string }>(`/newsletter/campaigns/${id}/send`)
    return res.data
  },
}
```

Save to: `client/src/services/newsletter.service.ts`

- [ ] **Step 2: Verify TypeScript**

```bash
cd "client"
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/services/newsletter.service.ts
git commit -m "feat: add newsletter service with subscriber and campaign API calls"
```

---

## Task 10: Wire Footer.tsx to backend

**Files:**
- Modify: `client/src/components/Footer.tsx`
- Create: `client/src/components/__tests__/Footer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/components/__tests__/Footer.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Footer from '../Footer'

vi.mock('@/services/newsletter.service', () => ({
  newsletterService: {
    subscribe: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

const renderFooter = () => render(<BrowserRouter><Footer /></BrowserRouter>)

describe('Footer newsletter subscription', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls newsletterService.subscribe with entered email on submit', async () => {
    const { newsletterService } = await import('@/services/newsletter.service')
    vi.mocked(newsletterService.subscribe).mockResolvedValue({ success: true, message: 'Subscribed!' })

    renderFooter()

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /subscribe now/i }))

    await waitFor(() => {
      expect(newsletterService.subscribe).toHaveBeenCalledWith('user@example.com')
    })
  })

  it('shows error toast when subscribe returns a conflict', async () => {
    const toast = await import('react-hot-toast')
    const { newsletterService } = await import('@/services/newsletter.service')
    vi.mocked(newsletterService.subscribe).mockRejectedValue({
      response: { data: { message: 'This email is already subscribed.' } },
    })

    renderFooter()

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'dup@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /subscribe now/i }))

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('This email is already subscribed.')
    })
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd "client"
npx vitest run src/components/__tests__/Footer.test.tsx
```

Expected: FAIL — `newsletterService.subscribe` not being called (Footer uses fake onSubmit).

- [ ] **Step 3: Update `client/src/components/Footer.tsx`**

Replace the `onSubmit` handler and add the import. The file currently imports at the top — add `newsletterService` import after existing imports:

```tsx
import { newsletterService } from '@/services/newsletter.service'
```

Replace the `onSubmit` function (currently lines 45-48):

```tsx
const onSubmit = async (data: { email: string }) => {
  try {
    const res = await newsletterService.subscribe(data.email)
    toast.success(res.message || 'Subscribed! You will receive our updates.')
    reset()
  } catch (err: any) {
    const msg = err?.response?.data?.message || 'Failed to subscribe. Please try again.'
    toast.error(msg)
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd "client"
npx vitest run src/components/__tests__/Footer.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Footer.tsx client/src/components/__tests__/Footer.test.tsx
git commit -m "feat: wire footer newsletter subscribe form to API"
```

---

## Task 11: Create UnsubscribePage and wire to App.tsx

**Files:**
- Create: `client/src/pages/UnsubscribePage.tsx`
- Create: `client/src/pages/__tests__/UnsubscribePage.test.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Write the failing test**

Create `client/src/pages/__tests__/UnsubscribePage.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import UnsubscribePage from '../UnsubscribePage'

vi.mock('@/services/newsletter.service', () => ({
  newsletterService: {
    unsubscribeByToken: vi.fn(),
  },
}))

const renderPage = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/unsubscribe${search}`]}>
      <Routes>
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
      </Routes>
    </MemoryRouter>
  )

describe('UnsubscribePage', () => {
  it('calls unsubscribeByToken with token from URL and shows success', async () => {
    const { newsletterService } = await import('@/services/newsletter.service')
    vi.mocked(newsletterService.unsubscribeByToken).mockResolvedValue({ success: true, message: 'Done' })

    renderPage('?token=abc-123')

    await waitFor(() => {
      expect(newsletterService.unsubscribeByToken).toHaveBeenCalledWith('abc-123')
      expect(screen.getByText(/unsubscribed/i)).toBeInTheDocument()
    })
  })

  it('shows error when no token is in URL', async () => {
    renderPage('')

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd "client"
npx vitest run src/pages/__tests__/UnsubscribePage.test.tsx
```

Expected: FAIL — component does not exist yet.

- [ ] **Step 3: Create `client/src/pages/UnsubscribePage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Warning } from '@phosphor-icons/react'
import { newsletterService } from '@/services/newsletter.service'

type State = 'loading' | 'success' | 'error' | 'no-token'

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<State>(token ? 'loading' : 'no-token')

  useEffect(() => {
    if (!token) return
    newsletterService
      .unsubscribeByToken(token)
      .then(() => setState('success'))
      .catch(() => setState('error'))
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-white/10 p-10 text-center shadow-sm">
        {state === 'loading' && (
          <p className="text-slate-500 dark:text-neutral-400 text-sm">Processing your request...</p>
        )}

        {state === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You've been unsubscribed</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">
              You will no longer receive newsletter emails from EnglishPro.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Back to Home
            </Link>
          </>
        )}

        {(state === 'error' || state === 'no-token') && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
              <Warning size={28} weight="fill" className="text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invalid unsubscribe link</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">
              This link is invalid or has already been used.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd "client"
npx vitest run src/pages/__tests__/UnsubscribePage.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Add `/unsubscribe` route to `client/src/App.tsx`**

Inside the `PublicLayout` component's `<Routes>` block, add after the `/financial-aid` route (around line 118):

```tsx
<Route path="/unsubscribe" element={<UnsubscribePage />} />
```

Also add the lazy import near the top of `App.tsx` (after the existing lazy imports, around line 37):

```tsx
const UnsubscribePage = lazy(() => import('@/pages/UnsubscribePage'))
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd "client"
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/UnsubscribePage.tsx client/src/pages/__tests__/UnsubscribePage.test.tsx client/src/App.tsx
git commit -m "feat: add UnsubscribePage and public /unsubscribe route"
```

---

## Task 12: Create AdminNewsletter page and register in AdminPage

**Files:**
- Create: `client/src/pages/admin/AdminNewsletter.tsx`
- Modify: `client/src/pages/AdminPage.tsx`

- [ ] **Step 1: Create `client/src/pages/admin/AdminNewsletter.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  MagnifyingGlass, Trash, UserMinus, PaperPlaneTilt,
  PencilSimple, Plus, CalendarBlank, X, Clock,
} from '@phosphor-icons/react'
import { newsletterService } from '@/services/newsletter.service'
import type { NewsletterSubscriber, NewsletterCampaign } from '@/services/newsletter.service'
import RichTextEditor from '@/components/RichTextEditor'

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-neutral-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  sent:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const EDITABLE = ['draft', 'scheduled']

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

export default function AdminNewsletter() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns'>('subscribers')

  // ─── Subscribers ──────────────────────────────────────────────────────────────
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [subLoading, setSubLoading] = useState(false)
  const [subSearch, setSubSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subPage, setSubPage] = useState(1)
  const [subTotalPages, setSubTotalPages] = useState(1)
  const [subTotal, setSubTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(subSearch), 400)
    return () => clearTimeout(t)
  }, [subSearch])

  const fetchSubscribers = useCallback(async (page: number, search: string) => {
    setSubLoading(true)
    try {
      const res = await newsletterService.getSubscribers({ page, limit: 20, search })
      setSubscribers(res.data.subscribers)
      setSubTotalPages(res.data.pagination.totalPages)
      setSubTotal(res.data.pagination.total)
    } catch {
      toast.error('Failed to load subscribers')
    } finally {
      setSubLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'subscribers') fetchSubscribers(subPage, debouncedSearch)
  }, [activeTab, subPage, debouncedSearch, fetchSubscribers])

  const handleUnsubscribeSub = async (id: string) => {
    try {
      await newsletterService.unsubscribeSubscriber(id)
      toast.success('Subscriber unsubscribed')
      fetchSubscribers(subPage, debouncedSearch)
    } catch {
      toast.error('Failed to unsubscribe')
    }
  }

  const handleDeleteSub = async (id: string) => {
    try {
      await newsletterService.deleteSubscriber(id)
      toast.success('Subscriber deleted')
      fetchSubscribers(subPage, debouncedSearch)
    } catch {
      toast.error('Failed to delete subscriber')
    }
  }

  // ─── Campaigns ────────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([])
  const [campLoading, setCampLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formSubject, setFormSubject] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formSendType, setFormSendType] = useState<'now' | 'scheduled'>('now')
  const [formScheduledAt, setFormScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    setCampLoading(true)
    try {
      const res = await newsletterService.getCampaigns()
      setCampaigns(res.data)
    } catch {
      toast.error('Failed to load campaigns')
    } finally {
      setCampLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaigns()
  }, [activeTab, fetchCampaigns])

  const resetForm = () => {
    setFormSubject('')
    setFormBody('')
    setFormSendType('now')
    setFormScheduledAt('')
    setEditingId(null)
  }

  const openEditForm = (c: NewsletterCampaign) => {
    setFormSubject(c.subject)
    setFormBody(c.htmlBody)
    setFormSendType(c.scheduledAt ? 'scheduled' : 'now')
    setFormScheduledAt(c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : '')
    setEditingId(c._id)
    setShowForm(true)
  }

  const saveCampaign = async (status: 'draft' | 'scheduled', sendNow = false) => {
    if (!formSubject.trim()) return toast.error('Subject is required')
    if (!formBody.trim() || formBody === '<p></p>') return toast.error('Content is required')
    if (status === 'scheduled' && !formScheduledAt) return toast.error('Scheduled time is required')

    setSubmitting(true)
    try {
      if (sendNow) {
        let id = editingId
        if (!id) {
          const res = await newsletterService.createCampaign({ subject: formSubject, htmlBody: formBody, status: 'draft' })
          id = res.data._id
        } else {
          await newsletterService.updateCampaign(id, { subject: formSubject, htmlBody: formBody })
        }
        await newsletterService.sendCampaign(id!)
        toast.success('Campaign is being sent to all subscribers!')
      } else if (editingId) {
        await newsletterService.updateCampaign(editingId, {
          subject: formSubject,
          htmlBody: formBody,
          status,
          ...(status === 'scheduled' ? { scheduledAt: formScheduledAt } : {}),
        })
        toast.success(status === 'draft' ? 'Draft saved' : 'Campaign scheduled!')
      } else {
        await newsletterService.createCampaign({
          subject: formSubject,
          htmlBody: formBody,
          status,
          ...(status === 'scheduled' ? { scheduledAt: formScheduledAt } : {}),
        })
        toast.success(status === 'draft' ? 'Draft saved' : 'Campaign scheduled!')
      }
      setShowForm(false)
      resetForm()
      fetchCampaigns()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save campaign')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDirectSend = async (id: string) => {
    try {
      await newsletterService.sendCampaign(id)
      toast.success('Campaign is being sent!')
      fetchCampaigns()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send')
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    try {
      await newsletterService.deleteCampaign(id)
      toast.success('Campaign deleted')
      fetchCampaigns()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Newsletter</h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
          Manage subscribers and send email campaigns
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-fit">
        {(['subscribers', 'campaigns'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── SUBSCRIBERS ── */}
      {activeTab === 'subscribers' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-white/10">
          <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-neutral-300">All Subscribers</span>
              <span className="px-2.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold rounded-full">
                {subTotal} total
              </span>
            </div>
            <div className="relative w-full sm:w-72">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={subSearch}
                onChange={(e) => { setSubSearch(e.target.value); setSubPage(1) }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-900 dark:text-neutral-300 placeholder-slate-400 dark:placeholder-neutral-600 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  {['Email', 'Status', 'Subscribed', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subLoading ? (
                  <tr><td colSpan={4} className="text-center py-12 text-slate-400 dark:text-neutral-600">Loading...</td></tr>
                ) : subscribers.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-slate-400 dark:text-neutral-600">No subscribers found</td></tr>
                ) : subscribers.map((sub) => (
                  <tr key={sub._id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-neutral-200">{sub.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        sub.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-neutral-500'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-neutral-500">{fmt(sub.subscribedAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleUnsubscribeSub(sub._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            title="Unsubscribe"
                          >
                            <UserMinus size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSub(sub._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subTotalPages > 1 && (
            <div className="p-4 flex justify-center gap-2 border-t border-slate-100 dark:border-white/5">
              <button
                disabled={subPage === 1}
                onClick={() => setSubPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-neutral-400"
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-500 dark:text-neutral-400">
                {subPage} / {subTotalPages}
              </span>
              <button
                disabled={subPage === subTotalPages}
                onClick={() => setSubPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-neutral-400"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
            >
              <Plus size={16} weight="bold" />
              New Campaign
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {campLoading ? (
              <div className="text-center py-12 text-slate-400 dark:text-neutral-600">Loading...</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-neutral-600">
                <p className="text-base font-medium mb-1">No campaigns yet</p>
                <p className="text-sm">Create your first newsletter campaign above.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide">Subject</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide hidden md:table-cell">Sent</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c._id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-neutral-200">
                        <span className="block max-w-xs truncate">{c.subject}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[c.status] ?? ''}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-neutral-500 hidden md:table-cell">
                        {c.sentAt ? fmt(c.sentAt) : c.scheduledAt ? fmt(c.scheduledAt) : fmt(c.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-neutral-500 hidden md:table-cell">
                        {c.status === 'sent' ? `${c.totalSent}` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {EDITABLE.includes(c.status) && (
                            <>
                              <button
                                onClick={() => openEditForm(c)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                                title="Edit"
                              >
                                <PencilSimple size={15} />
                              </button>
                              <button
                                onClick={() => handleDirectSend(c._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                title="Send now"
                              >
                                <PaperPlaneTilt size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(c._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete"
                              >
                                <Trash size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── CAMPAIGN FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto pt-8 pb-8 px-4">
          <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Campaign' : 'New Campaign'}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Your newsletter subject..."
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-900 dark:text-neutral-300 placeholder-slate-400 dark:placeholder-neutral-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Content *
                </label>
                <RichTextEditor value={formBody} onChange={setFormBody} minHeight="250px" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-2">
                  Send Options
                </label>
                <div className="flex gap-3">
                  {(['now', 'scheduled'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormSendType(type)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        formSendType === type
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400 hover:border-violet-400'
                      }`}
                    >
                      {type === 'now' ? <PaperPlaneTilt size={15} /> : <Clock size={15} />}
                      {type === 'now' ? 'Send now' : 'Schedule for later'}
                    </button>
                  ))}
                </div>
              </div>

              {formSendType === 'scheduled' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    <CalendarBlank size={14} className="inline mr-1" />
                    Schedule Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formScheduledAt}
                    min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                    className="px-4 py-2.5 text-sm bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-900 dark:text-neutral-300 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => saveCampaign('draft')}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 rounded-xl transition-all disabled:opacity-50"
              >
                Save Draft
              </button>
              {formSendType === 'scheduled' ? (
                <button
                  onClick={() => saveCampaign('scheduled')}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  <Clock size={15} />
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </button>
              ) : (
                <button
                  onClick={() => saveCampaign('draft', true)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  <PaperPlaneTilt size={15} />
                  {submitting ? 'Sending...' : 'Send Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `client/src/pages/AdminPage.tsx`**

**2a.** Add `'newsletter'` to the `AdminView` type (line 53). Change:

```ts
export type AdminView = 'overview' | 'students' | 'instructors' | 'courses' | 'certificates' | 'payments' | 'payments-setup' | 'financial-aid' | 'salaries' | 'cms' | 'blog' | 'settings' | 'support' | 'notifications' | 'messages' | 'seo' | 'reviews' | 'geo-access' | 'contacts' | 'referrals' | 'email' | 'team' | 'users'
```

To:

```ts
export type AdminView = 'overview' | 'students' | 'instructors' | 'courses' | 'certificates' | 'payments' | 'payments-setup' | 'financial-aid' | 'salaries' | 'cms' | 'blog' | 'settings' | 'support' | 'notifications' | 'messages' | 'seo' | 'reviews' | 'geo-access' | 'contacts' | 'referrals' | 'email' | 'team' | 'users' | 'newsletter'
```

**2b.** Add `Newspaper` to the phosphor-icons import at the top of AdminPage.tsx. Find the existing import line:

```ts
import {
  ChartBar, Users, Chalkboard, BookOpen, CreditCard, PencilSimple,
  List, X, SignOut, Bell, Sun, Moon, GearSix,
  Lock, Eye, EyeSlash, Handshake, Certificate, ChatCircleDots, CheckCircle, Chats, Globe, Star, Sparkle, Money, EnvelopeSimple, Gift, UsersThree, UserSwitch
} from '@phosphor-icons/react'
```

Add `Newspaper` to this import:

```ts
import {
  ChartBar, Users, Chalkboard, BookOpen, CreditCard, PencilSimple,
  List, X, SignOut, Bell, Sun, Moon, GearSix,
  Lock, Eye, EyeSlash, Handshake, Certificate, ChatCircleDots, CheckCircle, Chats, Globe, Star, Sparkle, Money, EnvelopeSimple, Gift, UsersThree, UserSwitch, Newspaper
} from '@phosphor-icons/react'
```

**2c.** Add newsletter to `NAV_COMMUNICATION` array. Change:

```ts
const NAV_COMMUNICATION: NavItem[] = [
  { view: 'messages',      label: 'Messages',      path: 'messages',      Icon: Chats as NavItem['Icon'] },
  { view: 'support',       label: 'Support',       path: 'support',       Icon: ChatCircleDots as NavItem['Icon'] },
  { view: 'contacts',      label: 'Contacts',      path: 'contacts',      Icon: EnvelopeSimple as NavItem['Icon'] },
  { view: 'email',         label: 'Email System',  path: 'email',         Icon: EnvelopeSimple as NavItem['Icon'] },
  { view: 'reviews',       label: 'Reviews',       path: 'reviews',       Icon: Star as NavItem['Icon'] },
  { view: 'notifications', label: 'Notifications', path: 'notifications', Icon: Bell as NavItem['Icon'] },
]
```

To:

```ts
const NAV_COMMUNICATION: NavItem[] = [
  { view: 'messages',      label: 'Messages',      path: 'messages',      Icon: Chats as NavItem['Icon'] },
  { view: 'support',       label: 'Support',       path: 'support',       Icon: ChatCircleDots as NavItem['Icon'] },
  { view: 'contacts',      label: 'Contacts',      path: 'contacts',      Icon: EnvelopeSimple as NavItem['Icon'] },
  { view: 'email',         label: 'Email System',  path: 'email',         Icon: EnvelopeSimple as NavItem['Icon'] },
  { view: 'newsletter',    label: 'Newsletter',    path: 'newsletter',    Icon: Newspaper as NavItem['Icon'] },
  { view: 'reviews',       label: 'Reviews',       path: 'reviews',       Icon: Star as NavItem['Icon'] },
  { view: 'notifications', label: 'Notifications', path: 'notifications', Icon: Bell as NavItem['Icon'] },
]
```

**2d.** Add lazy import after `const AdminEmail = lazy(...)` line:

```ts
const AdminNewsletter = lazy(() => import('./admin/AdminNewsletter'))
```

**2e.** Add the route inside the admin `<Routes>` block. Find the `<Route path="email" .../>` line and add after it:

```tsx
<Route path="newsletter" element={<AdminNewsletter />} />
```

**2f.** Add to `ADMIN_SEARCH_ITEMS` array (add after the email entry):

```ts
{ label: 'Newsletter',     description: 'Manage newsletter subscribers and send email campaigns',  path: '/admin/newsletter',    Icon: Newspaper as SearchItem['Icon'] },
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd "client"
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/admin/AdminNewsletter.tsx client/src/pages/AdminPage.tsx
git commit -m "feat: add AdminNewsletter page with subscriber management and campaign editor"
```

---

## Final verification

- [ ] **Start the server and client, manually verify the golden path:**

1. Open the homepage footer → enter an email → click Subscribe Now → see success toast
2. Enter same email again → see "already subscribed" error toast
3. Go to `/admin/newsletter` → Subscribers tab shows the email
4. Switch to Campaigns tab → click New Campaign → fill subject + content → Send Now → see sending toast
5. Campaign appears in list with status "sending" → refreshing shows "sent" with count
6. Check subscriber email inbox (or dev logs if no RESEND_API_KEY) for the newsletter email
7. Click the unsubscribe link in the email → `/unsubscribe?token=...` → shows success page
8. Back in admin → subscriber status now shows "unsubscribed"
9. Create another campaign → Schedule for later → pick a time 2 min from now → Schedule → campaign shows "scheduled" → waits and auto-sends

- [ ] **Run all frontend tests**

```bash
cd "client"
npx vitest run
```

Expected: all tests pass including Footer and UnsubscribePage tests.
