# AI Chatbot (DB-Aware, Cost-Efficient) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing EnglishPro chat widget answer from live database knowledge (courses, instructors, FAQs, blog, settings) plus a signed-in user's own account data, politely refuse off-topic questions, and minimize API calls and token cost.

**Architecture:** A 5-minute in-memory knowledge snapshot built from MongoDB feeds a cached Claude Haiku 4.5 system prompt. A zero-API "instant answer" layer handles greetings and FAQ hits for free. Personal data is fetched only when a signed-in user asks about their own account.

**Tech Stack:** Node.js + Express (ESM), Mongoose, `@anthropic-ai/sdk` (Claude Haiku 4.5), React + TypeScript client.

**Spec:** `docs/superpowers/specs/2026-06-03-ai-chatbot-design.md`

> **Note on testing:** the server has **no Jest harness** (per `.claude/rules/testing.md`), and YAGNI says don't add one for this. Verification uses (a) `npm run check` — which imports the full `app.js` graph and catches syntax/import errors in every new file — (b) Node one-liners for pure functions, and (c) `curl` against the running server. All commands below are run from the `server/` directory unless noted.

---

### Task 1: Knowledge snapshot service

Builds one compact text block from the database, cached for 5 minutes. Also returns the active FAQ list (reused by the instant-answer layer).

**Files:**
- Create: `server/src/services/ai-knowledge.service.js`

- [ ] **Step 1: Create the service file**

```js
import SiteSettings from '../models/site-settings.model.js'
import Course from '../models/course.model.js'
import User from '../models/user.model.js'
import FAQ from '../models/faq.model.js'
import Blog from '../models/blog.model.js'

// ─── Knowledge snapshot cache ───────────────────────────────────────────────────
// Rebuilt at most once per 5 minutes, regardless of chat volume.

const CACHE_TTL_MS = 5 * 60 * 1000

let cache = { text: null, faqs: [], builtAt: 0 }

const STATIC_BASE = `## How to enrol
1. Create a free account at /signup
2. Browse courses at /courses
3. Enrol in a course and submit your payment proof
4. An admin approves your enrolment, then you get full access

## Good to know
- Financial aid is available — apply at /financial-aid if you cannot afford the fee.
- Certificates are issued automatically on course completion.
- Track your progress anytime from your dashboard.`

const trim = (str, n) => {
  if (!str) return ''
  const s = String(str).trim()
  return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s
}

const build = async () => {
  const [settings, courses, teachers, faqs, blogs] = await Promise.all([
    SiteSettings.findOne().lean(),
    Course.find({ status: 'published' })
      .select('title description price priceUSD currency pricingType type level focus totalSessions sessionDuration')
      .lean(),
    User.find({ role: 'teacher', isDeleted: { $ne: true } }).select('name jobTitle bio').lean(),
    FAQ.find({ isActive: true }).sort({ order: 1 }).select('question answer').lean(),
    Blog.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(10).select('title excerpt slug').lean(),
  ])

  const name = settings?.site?.name || 'EnglishPro'
  const lines = [`# ${name} — Platform Knowledge`]
  if (settings?.site?.tagline) lines.push(`Tagline: ${settings.site.tagline}`)

  const c = settings?.contact
  if (c) {
    const parts = []
    if (c.email) parts.push(`email ${c.email}`)
    if (c.phone) parts.push(`phone ${c.phone}`)
    if (c.whatsapp) parts.push(`whatsapp ${c.whatsapp}`)
    if (c.workingHours) parts.push(`hours ${c.workingHours}`)
    if (parts.length) lines.push(`Contact: ${parts.join(' | ')}`)
  }

  if (courses.length) {
    lines.push('\n## Courses (published)')
    for (const co of courses) {
      const price = co.currency === 'USD' ? `$${co.priceUSD ?? co.price ?? 0}` : `PKR ${co.price ?? 0}`
      lines.push(
        `- ${co.title} [${co.level}, ${co.focus}, ${co.type}] — ${price} (${co.pricingType}), ` +
        `${co.totalSessions} sessions x ${co.sessionDuration}min. ${trim(co.description, 160)}`
      )
    }
  } else {
    lines.push('\n## Courses\nNo courses are currently published.')
  }

  if (teachers.length) {
    lines.push('\n## Instructors')
    for (const t of teachers) {
      lines.push(`- ${t.name}${t.jobTitle ? `, ${t.jobTitle}` : ''}${t.bio ? ` — ${trim(t.bio, 140)}` : ''}`)
    }
  }

  if (faqs.length) {
    lines.push('\n## FAQs')
    for (const f of faqs) lines.push(`Q: ${f.question}\nA: ${trim(f.answer, 300)}`)
  }

  if (blogs.length) {
    lines.push('\n## Recent blog posts')
    for (const b of blogs) {
      lines.push(`- ${b.title}${b.excerpt ? `: ${trim(b.excerpt, 120)}` : ''} (/blog/${b.slug})`)
    }
  }

  lines.push(`\n${STATIC_BASE}`)

  return {
    text: lines.join('\n'),
    faqs: faqs.map((f) => ({ question: f.question, answer: f.answer })),
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────────

export const getKnowledgeSnapshot = async () => {
  if (cache.text && Date.now() - cache.builtAt < CACHE_TTL_MS) {
    return { text: cache.text, faqs: cache.faqs }
  }
  try {
    const built = await build()
    cache = { ...built, builtAt: Date.now() }
    return built
  } catch (err) {
    console.warn('[ai-knowledge] build failed, using static base:', err.message)
    return { text: STATIC_BASE, faqs: cache.faqs || [] }
  }
}

export const invalidateKnowledge = () => {
  cache = { text: null, faqs: [], builtAt: 0 }
}
```

- [ ] **Step 2: Verify the file compiles in the app graph**

Run: `npm run check`
Expected: command exits with no error output (app imports succeed). If you see a `SyntaxError` or `Cannot find module`, fix the offending line.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/ai-knowledge.service.js
git commit -m "feat(ai-chat): add DB-backed knowledge snapshot service (5-min cache)"
```

---

### Task 2: Instant-answer service (zero-API layer)

Answers greetings/thanks and clear FAQ matches without any API call. Pure functions — directly testable with Node, no DB needed.

**Files:**
- Create: `server/src/services/ai-instant-answers.js`

- [ ] **Step 1: Create the service file**

```js
// ─── Zero-API instant answers ───────────────────────────────────────────────────
// Returns a canned/FAQ reply for trivially-handleable messages, else null.

const GREETING_RE = /^(hi+|hey+|hello|hlo|yo|salam|asalam|aoa|assalam|good (morning|afternoon|evening)|ok|okay)\b/i
const THANKS_RE = /\b(thanks|thank you|thankyou|shukria|shukriya)\b/i

const GREETING_REPLY =
  "Hi! 👋 I'm the EnglishPro assistant. Ask me about our courses, pricing, enrolment, financial aid, or learning English."
const THANKS_REPLY =
  "You're welcome! 😊 Is there anything else about EnglishPro I can help with?"

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'you', 'to', 'of', 'for', 'and', 'or',
  'my', 'me', 'can', 'how', 'what', 'when', 'where', 'which', 'about', 'with', 'on', 'in',
  'your', 'it', 'this', 'that', 'have', 'get',
])

const tokenize = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))

export const getInstantAnswer = (userMessage, faqs = []) => {
  const msg = String(userMessage || '').trim()
  if (!msg) return null

  // Greetings/thanks: only for short messages, so "thanks, but how do I enrol?" still reaches the LLM.
  if (msg.split(/\s+/).length <= 4) {
    if (THANKS_RE.test(msg)) return THANKS_REPLY
    if (GREETING_RE.test(msg)) return GREETING_REPLY
  }

  // FAQ keyword-overlap match — conservative: needs >=2 shared significant words and >=60% of the FAQ's words.
  const msgTokens = new Set(tokenize(msg))
  if (msgTokens.size === 0) return null

  let best = null
  let bestScore = 0
  for (const f of faqs) {
    const qTokens = tokenize(f.question)
    if (!qTokens.length) continue
    const overlap = qTokens.filter((t) => msgTokens.has(t)).length
    const score = overlap / qTokens.length
    if (overlap >= 2 && score > bestScore) {
      bestScore = score
      best = f
    }
  }
  return best && bestScore >= 0.6 ? best.answer : null
}
```

- [ ] **Step 2: Verify pure-function behavior with Node**

Run:
```bash
node --input-type=module -e "import('./src/services/ai-instant-answers.js').then(m=>{const f=[{question:'How much do courses cost?',answer:'Prices vary per course.'}];console.log('greet:',m.getInstantAnswer('hello',[]));console.log('offtopic:',m.getInstantAnswer('what is the weather in Paris today',[]));console.log('faq:',m.getInstantAnswer('how much does a course cost',f));})"
```
Expected output:
```
greet: Hi! 👋 I'm the EnglishPro assistant. Ask me about our courses, pricing, enrolment, financial aid, or learning English.
offtopic: null
faq: Prices vary per course.
```

- [ ] **Step 3: Commit**

```bash
git add server/src/services/ai-instant-answers.js
git commit -m "feat(ai-chat): add zero-API instant-answer layer (greetings + FAQ hits)"
```

---

### Task 3: Rewrite the chat controller

Wires the instant layer, cached knowledge prompt, optional personal context, and graceful fallbacks. Preserves the `{ success, reply }` response shape the client already consumes.

**Files:**
- Modify (full rewrite): `server/src/controllers/ai-chat.controller.js`

- [ ] **Step 1: Replace the file contents**

```js
import Anthropic from '@anthropic-ai/sdk'

import asyncHandler from '../utils/asyncHandler.js'
import Enrollment from '../models/enrollment.model.js'
import Certificate from '../models/certificate.model.js'
import { getKnowledgeSnapshot } from '../services/ai-knowledge.service.js'
import { getInstantAnswer } from '../services/ai-instant-answers.js'

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey }) : null

const FALLBACK_REPLY =
  "I'm having a little trouble right now. Please try again in a moment, or contact us at hello@englishlms.com."

// Only fetch a user's private data when they actually ask about their own account.
const PERSONAL_RE = /\b(my|mine|enrol|enroll|enrolled|enrolment|enrollment|progress|certificate|certificates|refund|dashboard)\b/i

const SYSTEM_INSTRUCTIONS = `You are the AI assistant for EnglishPro, an online English learning platform.

Rules:
- Answer ONLY using the platform knowledge provided below, and only about EnglishPro and learning English.
- If the user asks anything off-topic or unrelated to EnglishPro or English learning, politely decline and steer them back. Example: "I can only help with EnglishPro courses, enrolment, and English learning. Is there something along those lines I can help with?"
- Never invent prices, dates, or course details that are not in the knowledge. If you don't know, suggest contacting support.
- If an account summary is provided, use it to answer the user's personal questions.
- Be friendly and concise — 2 to 4 sentences unless more detail is clearly needed.`

// ─── Personal context ────────────────────────────────────────────────────────────

const buildPersonalContext = async (userId) => {
  const [enrollments, certs] = await Promise.all([
    Enrollment.find({ student: userId }).populate('course', 'title').select('progress isActive course').lean(),
    Certificate.find({ student: userId }).populate('course', 'title').select('certificateId status course').lean(),
  ])

  if (!enrollments.length && !certs.length) {
    return 'Account summary: this signed-in user has no enrolments or certificates yet.'
  }

  const lines = ['Account summary for the signed-in user:']
  for (const e of enrollments) {
    const title = e.course?.title || 'a removed course'
    const p = e.progress || {}
    lines.push(
      `- Enrolled in "${title}" — ${p.sessionsAttended ?? 0}/${p.totalSessions ?? '?'} sessions attended, ` +
      `status: ${e.isActive ? 'active' : 'pending/inactive'}.`
    )
  }
  for (const cert of certs) {
    lines.push(`- Certificate ${cert.certificateId} for "${cert.course?.title || 'a course'}" — ${cert.status}.`)
  }
  return lines.join('\n')
}

// ─── chat ─────────────────────────────────────────────────────────────────────────

export const chat = asyncHandler(async (req, res) => {
  const { messages } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'Messages array is required' })
  }

  const recent = messages.slice(-8).map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content).slice(0, 1000),
  }))
  const latestUser = [...recent].reverse().find((m) => m.role === 'user')?.content || ''

  const { text: knowledge, faqs } = await getKnowledgeSnapshot()

  // 1) Zero-API instant layer.
  const instant = getInstantAnswer(latestUser, faqs)
  if (instant) {
    return res.json({ success: true, reply: instant })
  }

  // 2) No API key configured → graceful fallback (never crash).
  if (!client) {
    console.warn('[ai-chat] ANTHROPIC_API_KEY not set — returning fallback reply')
    return res.json({ success: true, reply: FALLBACK_REPLY })
  }

  // 3) Optional personal context (signed-in users asking about their own account).
  let personalBlock = null
  if (req.user && PERSONAL_RE.test(latestUser)) {
    try {
      personalBlock = await buildPersonalContext(req.user.id)
    } catch (err) {
      console.warn('[ai-chat] personal context failed:', err.message)
    }
  }

  // 4) LLM call. Stable knowledge goes in a cached system block; personal block stays uncached
  //    so the cached prefix doesn't change per user.
  const system = [
    {
      type: 'text',
      text: `${SYSTEM_INSTRUCTIONS}\n\n--- PLATFORM KNOWLEDGE ---\n${knowledge}`,
      cache_control: { type: 'ephemeral' },
    },
  ]
  if (personalBlock) {
    system.push({ type: 'text', text: `--- USER ACCOUNT ---\n${personalBlock}` })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      system,
      messages: recent,
    })
    const reply = response.content[0]?.text ?? FALLBACK_REPLY
    res.json({ success: true, reply })
  } catch (err) {
    console.error('[ai-chat] Anthropic error:', err.message)
    res.json({ success: true, reply: FALLBACK_REPLY })
  }
})
```

- [ ] **Step 2: Verify the file compiles in the app graph**

Run: `npm run check`
Expected: no error output. Fix any `SyntaxError` / `Cannot find module` before continuing.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/ai-chat.controller.js
git commit -m "feat(ai-chat): DB-aware controller with instant layer, prompt caching, personal context"
```

---

### Task 4: Add optional auth to the route

Populates `req.user` when a token is present so personal answers work, while staying public for anonymous visitors.

**Files:**
- Modify: `server/src/routes/ai-chat.route.js`

- [ ] **Step 1: Replace the file contents**

```js
import express from 'express'

import { chat } from '../controllers/ai-chat.controller.js'
import { optionalAuthenticate } from '../middlewares/auth.js'

const router = express.Router()

router.post('/', optionalAuthenticate, chat)

export default router
```

- [ ] **Step 2: Verify compile**

Run: `npm run check`
Expected: no error output.

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/ai-chat.route.js
git commit -m "feat(ai-chat): optional auth so signed-in users get personal answers"
```

---

### Task 5: Configure the Anthropic API key

The bot returns a graceful fallback until a real key is present. This step makes it actually call Claude.

**Files:**
- Modify: `server/.env` (gitignored — not committed)

- [ ] **Step 1: Add the key to `server/.env`**

Add this line under the existing config (replace the placeholder with a real key from the owner's Anthropic console — https://console.anthropic.com/):

```
# ── AI Chatbot (Anthropic) ────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-REPLACE_WITH_REAL_KEY
```

> While here, also remove the stray pasted text on `.env` lines 24–32 (the admin table and prompt paragraph). Those are not valid environment variables and should not live in `.env`.

- [ ] **Step 2: Restart the dev server so it picks up the new env var**

Run: `npm run dev`
Expected: server boots and logs the MongoDB connection + `listening on port 5000` (or the project's usual startup log). No commit — `.env` is gitignored.

---

### Task 6: Client starter-question chips (optional UX)

Shows tappable starter questions on the welcome screen to guide first-time users. No API/contract change.

**Files:**
- Modify: `client/src/components/AIChatWidget.tsx`

- [ ] **Step 1: Add a starter list near the top of the component (after the `WELCOME` constant, before `export default function`)**

```tsx
const STARTERS = [
  'What courses do you offer?',
  'How do I enrol?',
  'Do you offer financial aid?',
]
```

- [ ] **Step 2: Render the chips below the messages list, only when the conversation is just the welcome message**

In the messages container, immediately **after** the `messages.map(...)` block and **before** the `{/* Typing indicator */}` comment, insert:

```tsx
{messages.length === 1 && !loading && (
  <div className="flex flex-wrap gap-2 pt-1">
    {STARTERS.map((q) => (
      <button
        key={q}
        onClick={() => { setInput(q); setTimeout(send, 0) }}
        className="text-xs px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
      >
        {q}
      </button>
    ))}
  </div>
)}
```

> `send` reads the latest `input` via state; `setInput(q)` then `setTimeout(send, 0)` ensures the input is set before sending. (`send` and `setInput` are already defined in this component.)

- [ ] **Step 3: Verify the client builds**

Run (from `client/`): `npm run build`
Expected: build completes with no TypeScript errors. (If the project uses `tsc -b`, ensure no new type errors.)

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AIChatWidget.tsx
git commit -m "feat(ai-chat): add starter-question chips to chat welcome screen"
```

---

### Task 7: End-to-end verification

Confirm the full path behaves per spec with the server running (`npm run dev`) and a real `ANTHROPIC_API_KEY` set.

- [ ] **Step 1: Greeting → instant reply, no API call**

Run:
```bash
curl -s -X POST http://localhost:5000/api/v1/ai-chat -H "Content-Type: application/json" -d "{\"messages\":[{\"role\":\"user\",\"content\":\"hello\"}]}"
```
Expected: JSON containing the greeting reply (`Hi! 👋 I'm the EnglishPro assistant...`). Confirm the server log shows **no** Anthropic request for this message.

- [ ] **Step 2: Real platform question → reflects live DB courses**

Run:
```bash
curl -s -X POST http://localhost:5000/api/v1/ai-chat -H "Content-Type: application/json" -d "{\"messages\":[{\"role\":\"user\",\"content\":\"What courses do you offer and what do they cost?\"}]}"
```
Expected: reply lists the actual **published** courses/prices from MongoDB (not invented ones).

- [ ] **Step 3: Off-topic → polite refusal**

Run:
```bash
curl -s -X POST http://localhost:5000/api/v1/ai-chat -H "Content-Type: application/json" -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Who won the football world cup in 2018?\"}]}"
```
Expected: a polite refusal steering back to EnglishPro topics (no factual sports answer).

- [ ] **Step 4: DB freshness (≤5 min)**

In the admin UI, publish a new course (or edit a price). Wait up to 5 minutes (or restart the server / call `invalidateKnowledge()` for an immediate refresh), then repeat Step 2.
Expected: the new/updated course appears in the reply.

- [ ] **Step 5: Personal answer for signed-in user**

Sign in on the website as a student with at least one enrolment, open the chat widget, and ask: `What's my progress?`
Expected: reply summarizes that user's enrolment(s)/progress. Asking the same anonymously (no token) should give a generic answer or invite them to sign in — never another user's data.

- [ ] **Step 6: Final commit (if any verification tweaks were needed)**

```bash
git add -A
git commit -m "chore(ai-chat): verification pass for DB-aware chatbot"
```

---

## Self-Review Notes

- **Spec coverage:** live DB knowledge (Task 1), reflects add/update/delete via 5-min cache (Task 1 + Step 7.4), personal data (Task 3), off-topic refusal (Task 3 prompt + Step 7.3), cost efficiency via instant layer + prompt caching + Haiku (Tasks 2–3), route auth (Task 4), API key/.env cleanup (Task 5), optional client chips (Task 6). All covered.
- **Interface consistency:** `getKnowledgeSnapshot()` returns `{ text, faqs }` and is consumed exactly that way in the controller; `getInstantAnswer(message, faqs)` signature matches its call site; `invalidateKnowledge()` exported for future refresh hooks.
- **Caching caveat:** Anthropic prompt caching only activates above a minimum prefix length; if the knowledge block is small it simply won't cache (no error). As platform data grows, caching savings increase. This is acceptable and requires no code change.
