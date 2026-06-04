// Vercel serverless function — injects per-post Open Graph / Twitter tags into the
// SPA's index.html so social crawlers (which do NOT run JS) get a correct preview.
// Wired up via vercel.json: /blog/slug/:slug → /api/og-blog?slug=:slug

const SITE_URL = 'https://tryspeekly.com'
const SITE_NAME = 'TrySpeekly'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
const DEFAULT_DESC =
  'Master English with expert instructors. IELTS prep, Business English, and General English courses with certificates.'

// ─── Helpers ────────────────────────────────────────────────────────────────
const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Strip HTML/markdown, collapse whitespace, clamp length — for a clean description.
const toDescription = (raw = '', max = 200) => {
  const text = String(raw)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`>~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

// Replace an existing <meta>'s content, or insert the tag if absent. The insertion
// anchor falls back through </head> → </title> → <html> so it works even on minified
// HTML where optional tags like </head> may be stripped.
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

// ─── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const slug = (req.query.slug || '').toString().trim()
  const apiUrl = (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/+$/, '')
  // Fetch the canonical, unminified index.html (the per-deployment VERCEL_URL can
  // return a processed/minified variant without our <head> meta tags).
  const base = (process.env.PUBLIC_SITE_URL || SITE_URL).replace(/\/+$/, '')

  // Always start from the real built index.html so hashed asset paths stay correct
  // and the React app boots normally for human visitors.
  let html
  try {
    const r = await fetch(`${base}/index.html`)
    html = await r.text()
  } catch {
    res.setHeader('Location', `/index.html`)
    return res.status(302).end()
  }

  // Best-effort blog lookup — on any failure we serve the default (homepage) tags.
  let blog = null
  if (slug && apiUrl) {
    try {
      const r = await fetch(`${apiUrl}/api/v1/blogs/${encodeURIComponent(slug)}`)
      if (r.ok) {
        const json = await r.json()
        if (json?.data?.status === 'published' || json?.data?.status === undefined) {
          blog = json.data
        }
      }
    } catch {
      /* ignore — fall back to defaults */
    }
  }

  if (blog) {
    const title = `${blog.title} — ${SITE_NAME}`
    const desc = toDescription(blog.excerpt || blog.content) || DEFAULT_DESC
    const image = blog.coverImage || DEFAULT_IMAGE
    const url = `${SITE_URL}/blog/slug/${slug}`

    html = setTitle(html, title)
    html = setMeta(html, 'name', 'description', desc)
    html = setMeta(html, 'property', 'og:type', 'article')
    html = setMeta(html, 'property', 'og:title', title)
    html = setMeta(html, 'property', 'og:description', desc)
    html = setMeta(html, 'property', 'og:url', url)
    html = setMeta(html, 'property', 'og:image', image)
    html = setMeta(html, 'property', 'og:image:alt', blog.title)
    html = setMeta(html, 'name', 'twitter:card', 'summary_large_image')
    html = setMeta(html, 'name', 'twitter:title', title)
    html = setMeta(html, 'name', 'twitter:description', desc)
    html = setMeta(html, 'name', 'twitter:image', image)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Cache at the edge; crawlers and repeat visitors skip the round-trips.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
  return res.status(200).send(html)
}
