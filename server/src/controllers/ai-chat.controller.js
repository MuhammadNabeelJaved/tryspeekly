import Anthropic from '@anthropic-ai/sdk'

import asyncHandler from '../utils/asyncHandler.js'
import ChatSession from '../models/chat-session.model.js'
import { getKnowledgeSnapshot } from '../services/ai-knowledge.service.js'
import { getInstantAnswer } from '../services/ai-instant-answers.js'
import { buildPersonalContext } from '../services/ai-personal-context.service.js'

const MAX_STORED_MESSAGES = 50

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey }) : null

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'hello@tryspeekly.com'

const FALLBACK_REPLY =
  `I'm having a little trouble right now. Please try again in a moment, or contact us at ${CONTACT_EMAIL}.`

const SYSTEM_INSTRUCTIONS = `You are the AI assistant for TrySpeekly, an online English learning platform.

## Core rules
- Answer ONLY using the platform knowledge and account data provided below.
- Stay on topic: TrySpeekly courses, enrolment, English learning, and the user's own dashboard. If someone asks off-topic questions, politely decline and redirect.
- Never invent prices, dates, or course details not in the provided data. If unknown, suggest [Contact Us](/contact).
- Only discuss the signed-in user's own data — never reveal other users' private information.

## Role-specific behaviour
When an "ACCOUNT" section is present, the user is signed in. Tailor your reply to their role:

**admin**: You have full platform data (student counts, revenue, pending approvals, courses, instructors). Answer any admin question directly from the ACCOUNT figures — no need to hedge.

**teacher**: You have the teacher's own course and student data. Answer questions about their courses, enrolled student counts, certificates, and dashboard. Do not answer questions about other teachers' data.

**student**: You have the student's own enrolment list, session progress, certificates, and payment history. Answer questions about their personal learning journey directly.

**team_member**: Answer within the team member's permitted sections. Use platform-level counts where relevant.

**guest (no ACCOUNT)**: Only answer public platform information. For personal/dashboard questions, ask them to [Sign Up](/signup) or [Log In](/login) first.

## Response style
- Friendly, concise, and helpful — 2–5 sentences unless a list or breakdown is clearly needed.
- Use **bold** for key terms and bullet lists for multiple items or steps.
- Always link to relevant internal pages using Markdown: [Browse Courses](/courses), [Sign Up](/signup), [Log In](/login), [My Dashboard](/dashboard), [Financial Aid](/financial-aid), [Instructors](/instructors), [Blog](/blog), [Contact Us](/contact).
- Never write raw URLs — always use a labelled link.`

// ─── reply generation ──────────────────────────────────────────────────────────

const generateReply = async (recent, latestUser, user) => {
  // 1) Zero-API instant layer (greetings/thanks only).
  const instant = getInstantAnswer(latestUser)
  if (instant) return instant

  // 2) No API key configured → graceful fallback (never crash).
  if (!client) {
    console.warn('[ai-chat] ANTHROPIC_API_KEY not set — returning fallback reply')
    return FALLBACK_REPLY
  }

  const { text: knowledge } = await getKnowledgeSnapshot()

  // 3) Role-aware personal context — included for signed-in users so the bot can
  //    answer their dashboard questions; guests get none (public answers only).
  let personalBlock = null
  if (user) {
    try {
      personalBlock = await buildPersonalContext(user)
    } catch (err) {
      console.warn('[ai-chat] personal context failed:', err.message)
    }
  }

  // 4) LLM call. Stable knowledge goes in a cached system block; personal block stays
  //    uncached so the cached prefix doesn't change per user.
  const system = [
    {
      type: 'text',
      text: `${SYSTEM_INSTRUCTIONS}\n\n--- PLATFORM KNOWLEDGE ---\n${knowledge}`,
      cache_control: { type: 'ephemeral' },
    },
  ]
  if (personalBlock) {
    system.push({ type: 'text', text: `--- ACCOUNT ---\n${personalBlock}` })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system,
      messages: recent,
    })
    return response.content[0]?.text ?? FALLBACK_REPLY
  } catch (err) {
    console.error('[ai-chat] Anthropic error:', err.message)
    return FALLBACK_REPLY
  }
}

// Persist the full conversation for signed-in users (guests are stored client-side).
const persistSession = async (userId, messages, reply) => {
  const full = [
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content).slice(0, 2000),
    })),
    { role: 'assistant', content: reply },
  ].slice(-MAX_STORED_MESSAGES)

  await ChatSession.findOneAndUpdate(
    { user: userId },
    { $set: { messages: full } },
    { upsert: true }
  )
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

  const reply = await generateReply(recent, latestUser, req.user)

  if (req.user) {
    try {
      await persistSession(req.user.id, messages, reply)
    } catch (err) {
      console.warn('[ai-chat] session persist failed:', err.message)
    }
  }

  res.json({ success: true, reply })
})

// ─── session history (authenticated users) ──────────────────────────────────────

// GET /api/v1/ai-chat/session — return the signed-in user's saved conversation.
export const getSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({ user: req.user.id }).lean()
  res.json({ success: true, data: { messages: session?.messages ?? [] } })
})

// DELETE /api/v1/ai-chat/session — clear the signed-in user's saved conversation.
export const deleteSession = asyncHandler(async (req, res) => {
  await ChatSession.deleteOne({ user: req.user.id })
  res.json({ success: true, message: 'Chat history cleared' })
})
