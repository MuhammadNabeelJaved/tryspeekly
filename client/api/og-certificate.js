// Vercel serverless function — injects per-certificate Open Graph / Twitter tags
// so social crawlers (LinkedIn, Twitter, WhatsApp) get the actual certificate image.
// Wired via vercel.json: /certificate/:id → /api/og-certificate?id=:id

const SITE_URL = 'https://tryspeekly.com'
const SITE_NAME = 'TrySpeekly'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png?v=2`

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

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
  const certId = (req.query.id || '').toString().trim()
  const apiUrl = (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/+$/, '')
  const base = (process.env.PUBLIC_SITE_URL || SITE_URL).replace(/\/+$/, '')

  let html
  try {
    const r = await fetch(`${base}/index.html`)
    html = await r.text()
  } catch {
    res.setHeader('Location', '/index.html')
    return res.status(302).end()
  }

  let cert = null
  if (certId && apiUrl) {
    try {
      const r = await fetch(`${apiUrl}/api/v1/certificates/verify/${encodeURIComponent(certId)}`)
      if (r.ok) {
        const json = await r.json()
        if (json?.data) cert = json.data
      }
    } catch {
      // fall back to defaults
    }
  }

  if (cert) {
    const studentName = cert.student?.name ?? 'A Student'
    const courseName = cert.course?.title ?? 'a course'
    const certIdStr = cert.certificateId ?? certId
    const issueDate = cert.issueDate
      ? new Date(cert.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''

    const title = `${studentName}'s Certificate of Completion — ${courseName} | ${SITE_NAME}`
    const desc = `${studentName} has officially completed "${courseName}" on ${SITE_NAME}. Credential ID: ${certIdStr}${issueDate ? ` · Issued ${issueDate}` : ''}.`
    const url = `${SITE_URL}/certificate/${certIdStr}`
    // Use the pre-generated certificate image if available, else course thumbnail, else default
    const image = cert.credentialUrl || cert.course?.thumbnail || DEFAULT_IMAGE

    html = setTitle(html, title)
    html = setMeta(html, 'name', 'description', desc)
    html = setMeta(html, 'property', 'og:type', 'website')
    html = setMeta(html, 'property', 'og:title', title)
    html = setMeta(html, 'property', 'og:description', desc)
    html = setMeta(html, 'property', 'og:url', url)
    html = setMeta(html, 'property', 'og:image', image)
    html = setMeta(html, 'property', 'og:image:alt', `${studentName}'s TrySpeekly Certificate`)
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
