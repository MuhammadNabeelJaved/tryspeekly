import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import { getAdminStats, cleanupDeletedData } from '../controllers/stats.controller.js'

const router = express.Router()

router.route('/admin').get(authenticate, authorizeTeamPage('overview'), getAdminStats)

router.route('/admin/cleanup-deleted').post(
  authenticate,
  authorize('admin'),
  logActivity('delete', 'user', () => ({ details: 'Purged deleted accounts & orphaned data' })),
  cleanupDeletedData,
)

export default router
