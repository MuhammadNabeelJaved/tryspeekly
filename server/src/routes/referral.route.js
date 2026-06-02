import { Router } from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import {
  generateReferralCode,
  getMyReferralCodes,
  getMyCodeStats,
  getMyRewards,
  getMyWallet,
  createPayoutRequest,
  getMyPayoutHistory,
  getPublicSettings,
  getAllRewards,
  getPayoutRequests,
  processPayoutRequest,
  getReferralSettings,
  updateReferralSettings,
  bulkDeleteRewards,
  bulkDeletePayoutRequests,
} from '../controllers/referral.controller.js'

const router = Router()

// Public
router.get('/public-settings', getPublicSettings)

// Student
router.post('/generate', authenticate, authorize('student'), generateReferralCode)
router.get('/my-codes', authenticate, authorize('student'), getMyReferralCodes)
router.get('/my-code-stats', authenticate, authorize('student'), getMyCodeStats)
router.get('/my-rewards', authenticate, authorize('student'), getMyRewards)
router.get('/my-wallet', authenticate, authorize('student'), getMyWallet)
router.post('/payout-request', authenticate, authorize('student'), createPayoutRequest)
router.get('/my-payout-history', authenticate, authorize('student'), getMyPayoutHistory)

// Admin
router.get('/', authenticate, authorizeTeamPage('referrals'), getAllRewards)
router.delete('/rewards/bulk', authenticate, authorizeTeamPage('referrals'), logActivity('delete', 'referral-reward', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} referral rewards` })), bulkDeleteRewards)
router.get('/payout-requests', authenticate, authorizeTeamPage('referrals'), getPayoutRequests)
router.delete('/payout-requests/bulk', authenticate, authorizeTeamPage('referrals'), logActivity('delete', 'payout-request', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} payout requests` })), bulkDeletePayoutRequests)
router.patch('/payout-requests/:requestId', authenticate, authorizeTeamPage('referrals'), logActivity('update', 'payout-request', (req) => ({ resourceId: req.params.requestId, details: `Payout ${req.body.action ?? ''}` })), processPayoutRequest)
router.get('/settings', authenticate, authorizeTeamPage('referrals'), getReferralSettings)
router.patch('/settings', authenticate, authorizeTeamPage('referrals'), logActivity('update', 'referral-settings', () => ({ details: 'Updated referral settings' })), updateReferralSettings)

export default router
