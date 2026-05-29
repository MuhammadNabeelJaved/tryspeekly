import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
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
router.route('/').patch(authenticate, authorizeTeamPage('cms'), updateSiteSettings)
router.route('/logo').patch(authenticate, authorizeTeamPage('cms'), uploadProfileImage, handleMulterError, updateSiteLogo)
router.route('/banner').patch(authenticate, authorizeTeamPage('cms'), uploadProfileImage, handleMulterError, updateSiteBanner)
router.route('/blocked-countries').get(authenticate, authorizeTeamPage('cms', 'geo-access'), getBlockedCountries).post(authenticate, authorizeTeamPage('cms', 'geo-access'), blockCountry)
router.route('/blocked-countries/:code').delete(authenticate, authorizeTeamPage('cms', 'geo-access'), unblockCountry)

export default router
