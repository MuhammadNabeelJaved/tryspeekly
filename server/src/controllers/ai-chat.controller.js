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
