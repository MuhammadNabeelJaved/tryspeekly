// Proxies the backend's dynamic sitemap so tryspeekly.com/sitemap.xml returns
// a live sitemap that includes all published courses and blog posts.

const BACKEND = (process.env.VITE_API_URL || process.env.API_URL || 'https://tryspeekly-api.onrender.com/api/v1').replace(/\/+$/, '')

export default async function handler(req, res) {
  try {
    const r = await fetch(`${BACKEND}/seo/sitemap.xml`, {
      headers: { Accept: 'application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) throw new Error(`Backend returned ${r.status}`)
    const xml = await r.text()
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).send(xml)
  } catch {
    // Fall back to the static sitemap so robots.txt remains satisfied
    res.setHeader('Location', '/sitemap.xml?static=1')
    return res.status(302).end()
  }
}
