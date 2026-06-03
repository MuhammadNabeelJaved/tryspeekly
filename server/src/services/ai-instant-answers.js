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
