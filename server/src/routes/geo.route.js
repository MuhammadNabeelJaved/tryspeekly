import express from 'express'
import SiteSettings from '../models/site-settings.model.js'
import { getCountryFromReq } from '../middlewares/geo.middleware.js'

const router = express.Router()

// GET /api/v1/geo/detect — public, never blocked
router.get('/detect', async (req, res) => {
  try {
    const country = getCountryFromReq(req) || 'PK'
    const currency = country === 'PK' ? 'PKR' : 'USD'

    const settings = await SiteSettings.findOne().select('blockedCountries')
    const blocked = settings?.blockedCountries ?? ['IN']
    const isBlocked = blocked.includes(country)

    res.json({ success: true, data: { country, currency, isBlocked } })
  } catch (error) {
    res.json({ success: true, data: { country: 'PK', currency: 'PKR', isBlocked: false } })
  }
})

export default router
