import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadProfileImage, handleMulterError } from '../middlewares/multer.js'
import {
  getSiteSettings,
  updateSiteSettings,
  updateSiteLogo,
  updateSiteBanner,
  getBlockedCountries,
  blockCountry,
  unblockCountry,
} from '../controllers/site-settings.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').get(getSiteSettings)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/').patch(authenticate, authorize('admin'), updateSiteSettings)
router.route('/logo').patch(authenticate, authorize('admin'), uploadProfileImage, handleMulterError, updateSiteLogo)
router.route('/banner').patch(authenticate, authorize('admin'), uploadProfileImage, handleMulterError, updateSiteBanner)
router.route('/blocked-countries').get(authenticate, authorize('admin'), getBlockedCountries).post(authenticate, authorize('admin'), blockCountry)
router.route('/blocked-countries/:code').delete(authenticate, authorize('admin'), unblockCountry)

export default router
