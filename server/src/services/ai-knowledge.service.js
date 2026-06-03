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
