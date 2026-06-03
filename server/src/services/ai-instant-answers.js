// ─── Zero-API instant answers ───────────────────────────────────────────────────
// Returns a canned reply for greetings/thanks (no API call), else null.
// FAQ-type questions are intentionally NOT short-circuited — they go to the model,
// which has the FAQs and live course data in its knowledge and answers them far more
// richly than a single stored FAQ answer.

const GREETING_RE = /^(hi+|hey+|hello|hlo|yo|salam|asalam|aoa|assalam|good (morning|afternoon|evening)|ok|okay)\b/i
const THANKS_RE = /\b(thanks|thank you|thankyou|shukria|shukriya)\b/i

const GREETING_REPLY =
  "Hi! 👋 I'm the EnglishPro assistant. Ask me about our courses, pricing, enrolment, financial aid, or learning English."
const THANKS_REPLY =
  "You're welcome! 😊 Is there anything else about EnglishPro I can help with?"

export const getInstantAnswer = (userMessage) => {
  const msg = String(userMessage || '').trim()
  if (!msg) return null

  // Only short, clear greetings/thanks are answered for free; everything else
  // reaches the model so it can use the full platform knowledge.
  if (msg.split(/\s+/).length <= 4) {
    if (THANKS_RE.test(msg)) return THANKS_REPLY
    if (GREETING_RE.test(msg)) return GREETING_REPLY
  }
  return null
}
