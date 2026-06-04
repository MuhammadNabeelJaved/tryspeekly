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

Rules:
- Answer ONLY using the platform knowledge provided below, and only about TrySpeekly and learning English.
- If the user asks anything off-topic or unrelated to TrySpeekly or English learning, politely decline and steer them back. Example: "I can only help with TrySpeekly courses, enrolment, and English learning. Is there something along those lines I can help with?"
- Never invent prices, dates, or course details that are not in the knowledge. If you don't know, suggest contacting support.
- If an "ACCOUNT" section is provided, the user is signed in — use it to answer their personal/dashboard questions accurately (their own enrolments, courses, stats, etc., depending on their role). Only discuss the account shown; never reveal other users' private data.
- If NO account section is provided, the user is a guest. Answer public information normally, but if they ask about personal or account data, kindly tell them to sign in or create an account first ([Sign Up](/signup), [Log In](/login)).
- Be friendly and concise — 2 to 4 sentences unless more detail is clearly needed.

Formatting (important):
- Reply in clean Markdown. Use **bold** for key terms, and use bullet (-) or numbered lists for steps or multiple items instead of cramming them into one sentence.
- Whenever you mention a platform page, write it as a Markdown link with a short label and the real internal path, e.g. [Browse Courses](/courses), [Sign Up](/signup), [Financial Aid](/financial-aid), [Read the Blog](/blog), [Meet Instructors](/instructors), [Contact Us](/contact), [My Dashboard](/dashboard). Never write a raw URL without a label.`

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
      max_tokens: 400,
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
