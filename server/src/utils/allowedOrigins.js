// ─── Allowed CORS Origins ───────────────────────────────────────────────────
// CLIENT_URL holds the canonical frontend origin (e.g. https://tryspeekly.com).
// The site is also reachable via the www subdomain, so we accept both the bare
// and www variants. In development we additionally allow any localhost port.

const buildVariants = (url) => {
  try {
    const parsed = new URL(url)
    const host = parsed.host.replace(/^www\./, '')
    return [`${parsed.protocol}//${host}`, `${parsed.protocol}//www.${host}`]
  } catch {
    return [url]
  }
}

const staticOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean)
  .flatMap(buildVariants)

const localhostRegex = /^http:\/\/localhost:\d+$/

// Returns true when the given request origin is allowed.
export const isAllowedOrigin = (origin) => {
  if (!origin) return true // same-origin / non-browser requests (curl, server-to-server)
  if (staticOrigins.includes(origin)) return true
  if (process.env.NODE_ENV !== 'production' && localhostRegex.test(origin)) return true
  return false
}

// Express `cors` origin callback.
export const corsOriginCheck = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true)
  } else {
    callback(new Error(`Not allowed by CORS: ${origin}`))
  }
}
