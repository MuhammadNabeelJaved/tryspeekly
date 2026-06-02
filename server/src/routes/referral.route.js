import { Router } from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import {
  generateReferralCode,
  getMyReferralCodes,
  getMyCodeStats,
  getMyRewards,
  getMyWallet,
  createPayoutRequest,
  getPublicSettings,
  getAllRewards,
  getPayoutRequests,
  processPayoutRequest,
  getReferralSettings,
  updateReferralSettings,
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

// Admin
router.get('/', authenticate, authorizeTeamPage('referrals'), getAllRewards)
router.get('/payout-requests', authenticate, authorizeTeamPage('referrals'), getPayoutRequests)
router.patch('/payout-requests/:requestId', authenticate, authorizeTeamPage('referrals'), processPayoutRequest)
router.get('/settings', authenticate, authorizeTeamPage('referrals'), getReferralSettings)
router.patch('/settings', authenticate, authorizeTeamPage('referrals'), updateReferralSettings)

export default router
