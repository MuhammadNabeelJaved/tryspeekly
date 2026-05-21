import asyncHandler from '../utils/asyncHandler.js'
import SiteSettings from '../models/site-settings.model.js'
import { uploadSiteLogo, uploadSiteBanner, deleteFile, extractPublicId } from '../utils/cloudinary.js'
import { invalidateGeoCache } from '../middlewares/geo.middleware.js'

const getOrCreate = async () => {
  let settings = await SiteSettings.findOne()
  if (!settings) settings = await SiteSettings.create({})
  return settings
}

// GET /api/v1/site-settings — public
export const getSiteSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await getOrCreate()
    res.json({ success: true, data: settings })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/site-settings — admin: update settings
export const updateSiteSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await getOrCreate()
    const allowed = ['site', 'contact', 'social', 'seo']

    allowed.forEach((section) => {
      if (req.body[section] && typeof req.body[section] === 'object') {
        Object.assign(settings[section], req.body[section])
      }
    })

    if (req.body.paymentsSetup !== undefined) {
      settings.paymentsSetup = req.body.paymentsSetup
      settings.markModified('paymentsSetup')
    }

    await settings.save()
    res.json({ success: true, message: 'Settings updated', data: settings })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/site-settings/logo — admin: upload logo
export const updateSiteLogo = asyncHandler(async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No image provided' } })

    const settings = await getOrCreate()

    if (settings.logoUrl) {
      const publicId = extractPublicId(settings.logoUrl)
      if (publicId) await deleteFile(publicId, 'image')
    }

    const result = await uploadSiteLogo(req.file.buffer, 'site-logo')
    settings.logoUrl = result.secure_url
    await settings.save()

    res.json({ success: true, message: 'Logo updated', logoUrl: settings.logoUrl })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/site-settings/blocked-countries — admin: list blocked countries
export const getBlockedCountries = asyncHandler(async (req, res) => {
  try {
    const settings = await getOrCreate()
    res.json({ success: true, data: settings.blockedCountries || [] })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/site-settings/blocked-countries — admin: block a country
export const blockCountry = asyncHandler(async (req, res) => {
  try {
    const { code } = req.body
    if (!code || typeof code !== 'string' || code.length !== 2) {
      return res.status(400).json({ success: false, error: { message: 'Valid 2-letter country code required' } })
    }
    const upper = code.toUpperCase()
    const settings = await getOrCreate()
    if (!settings.blockedCountries.includes(upper)) {
      settings.blockedCountries.push(upper)
      settings.markModified('blockedCountries')
      await settings.save()
      invalidateGeoCache()
    }
    res.json({ success: true, message: `${upper} blocked`, data: settings.blockedCountries })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/site-settings/blocked-countries/:code — admin: unblock a country
export const unblockCountry = asyncHandler(async (req, res) => {
  try {
    const upper = req.params.code.toUpperCase()
    const settings = await getOrCreate()
    settings.blockedCountries = settings.blockedCountries.filter(c => c !== upper)
    settings.markModified('blockedCountries')
    await settings.save()
    invalidateGeoCache()
    res.json({ success: true, message: `${upper} unblocked`, data: settings.blockedCountries })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/site-settings/banner — admin: upload banner
export const updateSiteBanner = asyncHandler(async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No image provided' } })

    const settings = await getOrCreate()

    if (settings.bannerUrl) {
      const publicId = extractPublicId(settings.bannerUrl)
      if (publicId) await deleteFile(publicId, 'image')
    }

    const result = await uploadSiteBanner(req.file.buffer, 'site-banner')
    settings.bannerUrl = result.secure_url
    await settings.save()

    res.json({ success: true, message: 'Banner updated', bannerUrl: settings.bannerUrl })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
