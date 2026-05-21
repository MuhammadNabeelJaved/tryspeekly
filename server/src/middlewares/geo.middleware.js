import geoip from 'geoip-lite'
import SiteSettings from '../models/site-settings.model.js'

// In-memory cache: { list: string[], expiresAt: number }
let cache = null
const CACHE_TTL_MS = 5 * 60 * 1000

async function getBlockedCountries() {
  if (cache && Date.now() < cache.expiresAt) return cache.list
  try {
    const settings = await SiteSettings.findOne().select('blockedCountries')
    const list = settings?.blockedCountries ?? ['IN']
    cache = { list, expiresAt: Date.now() + CACHE_TTL_MS }
    return list
  } catch {
    return cache?.list ?? ['IN']
  }
}

export function invalidateGeoCache() {
  cache = null
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress || req.ip || ''
}

export function getCountryFromReq(req) {
  const ip = getClientIp(req)
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null
  }
  const geo = geoip.lookup(ip)
  return geo?.country || null
}

export const geoBlockMiddleware = async (req, res, next) => {
  // Skip geo detect endpoint so frontend can always check country
  if (req.originalUrl.startsWith('/api/v1/geo/detect') || req.originalUrl.startsWith('/api/health')) {
    return next()
  }

  const country = getCountryFromReq(req)
  if (!country) return next()

  const blocked = await getBlockedCountries()
  if (blocked.includes(country)) {
    return res.status(403).json({
      success: false,
      error: { message: 'This service is not available in your region.', code: 'GEO_BLOCKED' },
    })
  }

  next()
}
