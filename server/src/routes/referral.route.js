import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  generateReferralCode,
  getMyReferralCodes,
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
router.get('/my-rewards', authenticate, authorize('student'), getMyRewards)
router.get('/my-wallet', authenticate, authorize('student'), getMyWallet)
router.post('/payout-request', authenticate, authorize('student'), createPayoutRequest)

// Admin
router.get('/', authenticate, authorize('admin'), getAllRewards)
router.get('/payout-requests', authenticate, authorize('admin'), getPayoutRequests)
router.patch('/payout-requests/:requestId', authenticate, authorize('admin'), processPayoutRequest)
router.get('/settings', authenticate, authorize('admin'), getReferralSettings)
router.patch('/settings', authenticate, authorize('admin'), updateReferralSettings)

export default router
