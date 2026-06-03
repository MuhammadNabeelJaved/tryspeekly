import Anthropic from '@anthropic-ai/sdk'

import asyncHandler from '../utils/asyncHandler.js'
import { getKnowledgeSnapshot } from '../services/ai-knowledge.service.js'
import { getInstantAnswer } from '../services/ai-instant-answers.js'
import { buildPersonalContext } from '../services/ai-personal-context.service.js'

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey }) : null

const FALLBACK_REPLY =
  "I'm having a little trouble right now. Please try again in a moment, or contact us at hello@englishlms.com."

const SYSTEM_INSTRUCTIONS = `You are the AI assistant for EnglishPro, an online English learning platform.

Rules:
- Answer ONLY using the platform knowledge provided below, and only about EnglishPro and learning English.
- If the user asks anything off-topic or unrelated to EnglishPro or English learning, politely decline and steer them back. Example: "I can only help with EnglishPro courses, enrolment, and English learning. Is there something along those lines I can help with?"
- Never invent prices, dates, or course details that are not in the knowledge. If you don't know, suggest contacting support.
- If an "ACCOUNT" section is provided, the user is signed in — use it to answer their personal/dashboard questions accurately (their own enrolments, courses, stats, etc., depending on their role). Only discuss the account shown; never reveal other users' private data.
- If NO account section is provided, the user is a guest. Answer public information normally, but if they ask about personal or account data, kindly tell them to sign in or create an account first ([Sign Up](/signup), [Log In](/login)).
- Be friendly and concise — 2 to 4 sentences unless more detail is clearly needed.

Formatting (important):
- Reply in clean Markdown. Use **bold** for key terms, and use bullet (-) or numbered lists for steps or multiple items instead of cramming them into one sentence.
- Whenever you mention a platform page, write it as a Markdown link with a short label and the real internal path, e.g. [Browse Courses](/courses), [Sign Up](/signup), [Financial Aid](/financial-aid), [Read the Blog](/blog), [Meet Instructors](/instructors), [Contact Us](/contact), [My Dashboard](/dashboard). Never write a raw URL without a label.`

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

  // 3) Role-aware personal context — always included for signed-in users so the bot can
  //    answer their dashboard questions; guests get none (public answers only).
  let personalBlock = null
  if (req.user) {
    try {
      personalBlock = await buildPersonalContext(req.user)
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
    system.push({ type: 'text', text: `--- ACCOUNT ---\n${personalBlock}` })
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
