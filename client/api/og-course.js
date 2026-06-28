// Vercel serverless function — injects per-course Open Graph / Twitter tags into
// the SPA's index.html so social crawlers (which don't run JS) get a correct preview.
// Wired up via vercel.json: /courses/:id → /api/og-course?id=:id

const SITE_URL = 'https://tryspeekly.com'
const SITE_NAME = 'TrySpeekly'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png?v=2`
const DEFAULT_DESC =
  'Master English with expert instructors. IELTS prep, Business English, and General English courses with certificates.'

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const toDescription = (raw = '', max = 200) => {
  const text = String(raw)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`>~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

const setMeta = (html, attr, key, value) => {
  const re = new RegExp(`(<meta\\s+${attr}=["']${key}["']\\s+content=["'])[^"']*(["'])`, 'i')
  const safe = escapeHtml(value)
  if (re.test(html)) return html.replace(re, `$1${safe}$2`)
  const tag = `<meta ${attr}="${key}" content="${safe}" />`
  if (html.includes('</head>')) return html.replace('</head>', `    ${tag}\n  </head>`)
  if (/<\/title>/i.test(html)) return html.replace(/<\/title>/i, `</title>${tag}`)
  return html.replace(/<html[^>]*>/i, (m) => `${m}${tag}`)
}

const setTitle = (html, value) =>
  html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(value)}</title>`)

export default async function handler(req, res) {
  const id = (req.query.id || '').toString().trim()
  const apiUrl = (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/+$/, '')
  const base = (process.env.PUBLIC_SITE_URL || SITE_URL).replace(/\/+$/, '')

  let html
  try {
    const r = await fetch(`${base}/index.html`)
    html = await r.text()
  } catch {
    res.setHeader('Location', `/index.html`)
    return res.status(302).end()
  }

  let course = null
  if (id && apiUrl) {
    try {
      const r = await fetch(`${apiUrl}/api/v1/courses/${encodeURIComponent(id)}`)
      if (r.ok) {
        const json = await r.json()
        if (json?.data) course = json.data
      }
    } catch {
      /* fall back to defaults */
    }
  }

  if (course) {
    const title = `${course.title} — ${SITE_NAME}`
    const desc = toDescription(course.description) || DEFAULT_DESC
    const image = course.thumbnail || DEFAULT_IMAGE
    const url = `${SITE_URL}/courses/${id}`

    html = setTitle(html, title)
    html = setMeta(html, 'name', 'description', desc)
    html = setMeta(html, 'property', 'og:type', 'website')
    html = setMeta(html, 'property', 'og:title', title)
    html = setMeta(html, 'property', 'og:description', desc)
    html = setMeta(html, 'property', 'og:url', url)
    html = setMeta(html, 'property', 'og:image', image)
    html = setMeta(html, 'property', 'og:image:alt', course.title)
    html = setMeta(html, 'name', 'twitter:card', 'summary_large_image')
    html = setMeta(html, 'name', 'twitter:title', title)
    html = setMeta(html, 'name', 'twitter:description', desc)
    html = setMeta(html, 'name', 'twitter:image', image)
    html = html.replace(/\s*<meta property="og:image:(?:width|height)"[^>]*>/gi, '')
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
  return res.status(200).send(html)
}
