# AI Chatbot — DB-Aware, Cost-Efficient Design

**Date:** 2026-06-03
**Status:** Approved (design)
**Area:** `server/` (AI chat), `client/` (AIChatWidget)

## Goal

Complete the existing EnglishPro AI chat widget so it:

1. Knows the platform's real, current data — public website content **and** database
   records (courses, instructors, pricing, FAQs, blog posts, site/contact settings).
2. Reflects database changes — when an admin adds / updates / deletes data, the bot's
   answers update automatically (within a short window) without code changes.
3. Answers a signed-in user's **own** account questions (enrollments, progress,
   certificates, payment status).
4. Politely **refuses off-topic questions** (anything unrelated to EnglishPro / English
   learning).
5. Is **cost-efficient** — minimum API calls and minimum token cost.

## Current State (before this work)

- `client/src/components/AIChatWidget.tsx` — working floating chat UI.
- `server/src/controllers/ai-chat.controller.js` — calls Anthropic **Claude Haiku 4.5**
  with a **hard-coded, static** system prompt. No DB knowledge, no personalization, no
  cost optimization beyond last-10-message trimming.
- `server/src/routes/ai-chat.route.js` — `POST /api/v1/ai-chat`, unauthenticated.
- **Blocker:** `server/.env` has **no `ANTHROPIC_API_KEY`** (and contains stray pasted
  text on lines 24–32 that should be removed). The bot cannot call the API until a valid
  key is added. The owner must supply the key; it is not created in this work.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Knowledge freshness | **~5-minute in-memory cache** (rebuild on demand when stale) |
| Data scope | **Public + personal** (signed-in user's own records) |
| Cost layer | **Zero-API instant answers** (greetings + FAQ hits) + **prompt caching** |
| Model | **`claude-haiku-4-5`** (unchanged) |
| Off-topic handling | **Prompt-based** polite refusal (no keyword hard-blocking) |

## Architecture

Three backend units, each with one clear responsibility, plus a small route change and an
optional client enhancement.

### 1. Knowledge snapshot service — NEW

**File:** `server/src/services/ai-knowledge.service.js`

**Responsibility:** Produce one compact, token-economical text block describing the
platform's current public knowledge, and cache it.

**Contents of the snapshot:**
- **Site/contact settings** (from `SiteSettings`): name, tagline, contact email/phone/
  whatsapp, working hours, social links.
- **Published courses** (`Course` where `status: 'published'`, `isDeleted: false`):
  title, level, focus, type, price + currency, pricingType, totalSessions,
  sessionDuration, trimmed description (~160 chars).
- **Instructors** (`User` where `role: 'teacher'`, not deleted): name, jobTitle, trimmed
  bio.
- **Active FAQs** (`FAQ` where `isActive: true`, ordered): question → answer.
- **Published blog posts** (`Blog` where `status: 'published'`, `isDeleted: false`):
  title, excerpt, slug. Capped (e.g. latest 10) to bound tokens.
- **Static facts:** how-to-enroll steps, financial-aid availability, certificate-on-
  completion note.

**Caching:**
- Module-level `{ text, builtAt }`. `getKnowledgeSnapshot()` rebuilds only when
  `Date.now() - builtAt > 5 * 60 * 1000`; otherwise returns the cached string.
- Result: DB is queried **at most once per 5 minutes** regardless of chat volume. Admin
  data changes appear in answers within ≤5 minutes.
- Export `invalidateKnowledge()` so a future admin "refresh AI knowledge" button (or
  controller hooks) can force an immediate rebuild. Not wired to controllers in this work.
- On any DB error during build, fall back to a small **static base-knowledge** string so
  the bot still answers general platform questions.

**Interface:**
```js
export async function getKnowledgeSnapshot(): Promise<string>
export function invalidateKnowledge(): void
```

### 2. Instant-answer service — NEW

**File:** `server/src/services/ai-instant-answers.js`

**Responsibility:** Answer trivially-handleable messages **without any API call**.

- **Greetings / thanks / salam** (normalized match against a small phrase set) → a fixed
  friendly reply.
- **FAQ hit:** compare the latest user message against active FAQ questions using simple
  normalized keyword-overlap scoring; if confidence is high enough (clear overlap on
  significant words), return that FAQ's stored answer verbatim.
- Otherwise return `null` → caller proceeds to the LLM.

**Interface:**
```js
// faqs: [{ question, answer }] from the snapshot source or a light query
export function getInstantAnswer(userMessage: string, faqs): string | null
```

This layer is intentionally conservative: it only short-circuits on clear matches, so it
never produces a wrong answer in place of the model.

### 3. Chat controller — REWRITE

**File:** `server/src/controllers/ai-chat.controller.js`

**Flow:**
1. Validate `messages` (array, non-empty) — return 400 on failure (unchanged contract).
2. Take the latest user message; normalize messages (last ~8, content trimmed to
   ~1000 chars each, mapped to `user` / `assistant`).
3. **Instant layer:** `getInstantAnswer(latest, activeFaqs)`. If non-null →
   `res.json({ success: true, reply })` and return. **No API call.**
4. **Personal context (only if `req.user` AND** message mentions personal terms — e.g.
   my / enroll / progress / certificate / payment / course): run ONE light query set for
   that user — active enrollments (course title, sessionsAttended/totalSessions,
   isActive, expiresAt), certificates (course, certificateId, status), latest payment
   status. Build a short "Your account" block. Otherwise skip (saves tokens + DB).
5. **LLM call:** `claude-haiku-4-5`, `max_tokens` ~400. System prompt = instructions +
   knowledge snapshot, sent as a **cached** system block
   (`cache_control: { type: 'ephemeral' }`). Personal block (when present) appended as a
   second, **non-cached** system segment so the cached prefix stays stable.
6. Return `{ success: true, reply }`.

**System prompt rules:**
- Persona: EnglishPro assistant.
- Answer **only** from the provided knowledge, about EnglishPro and English learning.
- If asked anything off-topic / unrelated → **politely decline** and steer back to
  courses, enrollment, or English learning. Provide a sample refusal line.
- Never invent prices or course details not present in the knowledge block; if unknown,
  suggest contacting support.
- Use the "Your account" block when present to answer the user's personal questions.
- Keep replies concise (2–4 sentences unless more is needed).

**Resilience:**
- Missing `ANTHROPIC_API_KEY` → log a warning, return a friendly fallback reply
  (e.g. "I'm temporarily unavailable — please contact hello@…"). Never crash.
- Anthropic API error → caught, friendly fallback reply.

### 4. Route — EDIT

**File:** `server/src/routes/ai-chat.route.js`
Add `optionalAuthenticate` before `chat` so `req.user` is populated when a token is
present, and remains anonymous otherwise.

```js
router.post('/', optionalAuthenticate, chat)
```

### 5. Client widget — OPTIONAL ENHANCEMENT

**File:** `client/src/components/AIChatWidget.tsx`
Core behavior already works. Optional: add 3–4 starter-question chips (e.g. "What courses
do you offer?", "How do I enrol?", "Do you offer financial aid?") shown only on the
welcome screen to guide users. No contract change. Token already auto-attached by
`axiosClient`, so personal answers work for signed-in users with no client change.

## Data Flow

```
Client widget
  → POST /api/v1/ai-chat  (Bearer token auto-attached if logged in)
    → optionalAuthenticate  (sets req.user or null)
      → controller
          1. validate
          2. getInstantAnswer() ──hit──▶ reply ($0)  ─────────────────┐
          3. (miss) getKnowledgeSnapshot()  [cached ≤5 min]           │
          4. if logged-in & personal terms → light per-user query     │
          5. Claude Haiku call (cached system prompt)                 │
          6. reply ───────────────────────────────────────────────────┘
  ← { success, reply }
```

## Cost Profile

| Message type | API calls | Notes |
|---|---|---|
| Greeting / thanks / FAQ hit | **0** | Answered locally |
| Real question | 1 (Haiku) | Cached knowledge block → cheap input; ~400 output tokens |
| DB reads | ≤1 per 5 min | Snapshot cache; personal query only when relevant |

## Error Handling Summary

- Invalid request body → `400` (existing contract).
- Missing API key → friendly fallback, warning log, no crash.
- Anthropic error → friendly fallback.
- DB error building snapshot → static base knowledge fallback.
- Never expose stack traces (per project rules).

## Testing / Verification

- Server has **no test harness** (per `.claude/rules/testing.md`); verification is manual:
  - Off-topic question → polite refusal.
  - "What courses do you offer?" → reflects real published courses.
  - Add/edit a course in admin → appears in answers within ≤5 min.
  - Greeting / FAQ → instant reply (verify no Anthropic call via logs).
  - Signed-in user asks "what's my progress?" → personal answer; anonymous user gets a
    prompt to sign in.
- `getInstantAnswer` and the snapshot formatter are pure/near-pure functions, unit-test-
  ready if Jest is added later.

## Out of Scope

- Vector search / embeddings RAG (unnecessary at this data size; higher cost/infra).
- Tool-use / function-calling round-trips (extra API calls; against cost goal).
- Instant cache invalidation hooks across every controller (TTL chosen instead).
- Cleaning the stray text in `.env` (owner action) and provisioning the API key.
- Admin "refresh AI knowledge" button (interface left available via `invalidateKnowledge`).
