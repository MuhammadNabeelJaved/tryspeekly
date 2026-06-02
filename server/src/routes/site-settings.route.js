import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import { uploadProfileImage, handleMulterError } from '../middlewares/multer.js'
import {
  getSiteSettings,
  updateSiteSettings,
  updateSiteLogo,
  updateSiteBanner,
  getBlockedCountries,
  blockCountry,
  unblockCountry,
  getFeaturedCourses,
  getFeaturedBlogs,
} from '../controllers/site-settings.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').get(getSiteSettings)
router.route('/featured-courses').get(getFeaturedCourses)
router.route('/featured-blogs').get(getFeaturedBlogs)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/').patch(authenticate, authorizeTeamPage('cms'), logActivity('update', 'site-settings', () => ({ details: 'Updated site settings' })), updateSiteSettings)
router.route('/logo').patch(authenticate, authorizeTeamPage('cms'), uploadProfileImage, handleMulterError, logActivity('update', 'site-settings', () => ({ details: 'Updated site logo' })), updateSiteLogo)
router.route('/banner').patch(authenticate, authorizeTeamPage('cms'), uploadProfileImage, handleMulterError, logActivity('update', 'site-settings', () => ({ details: 'Updated site banner' })), updateSiteBanner)
router.route('/blocked-countries').get(authenticate, authorizeTeamPage('cms', 'geo-access'), getBlockedCountries).post(authenticate, authorizeTeamPage('cms', 'geo-access'), logActivity('create', 'geo-access', (req) => ({ resourceName: req.body.code ?? '', details: `Blocked country ${req.body.code ?? ''}` })), blockCountry)
router.route('/blocked-countries/:code').delete(authenticate, authorizeTeamPage('cms', 'geo-access'), logActivity('delete', 'geo-access', (req) => ({ resourceName: req.params.code, details: `Unblocked country ${req.params.code}` })), unblockCountry)

export default router
