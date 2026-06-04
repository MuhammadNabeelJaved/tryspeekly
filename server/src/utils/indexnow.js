// IndexNow — instantly notify search engines (Bing, Yandex, …) that URLs changed.
// The key is public (hosted at /<key>.txt on the site), so it is not a secret.
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '26fb9e07070002467815676d2f0bf829'

const siteBase = () =>
  (process.env.SITE_URL || process.env.CLIENT_URL || 'https://tryspeekly.com').replace(/\/+$/, '')

/**
 * Submit one or more URLs to IndexNow.
 * Fire-and-forget — never throws, so callers can skip `await`.
 * @param {string|string[]} urls
 */
export const pingIndexNow = async (urls) => {
  try {
    if (!INDEXNOW_KEY) return
    const base = siteBase()
    const host = new URL(base).host
    const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean)
    if (urlList.length === 0) return

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${base}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    })
    console.log(`[IndexNow] submitted ${urlList.length} url(s) — status ${res.status}`)
  } catch (err) {
    console.warn('[IndexNow] ping failed:', err.message)
  }
}

/** Convenience: notify IndexNow about a published blog post (+ the blog index). */
export const pingBlog = (slug) => {
  if (!slug) return
  const base = siteBase()
  pingIndexNow([`${base}/blog/${slug}`, `${base}/blog`])
}
