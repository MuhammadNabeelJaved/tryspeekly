import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import { uploadPaymentScreenshot, handleMulterError } from '../middlewares/multer.js'
import {
  createPayment,
  getMyPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
  adminCreatePayment,
  directApprovePayment,
  deletePayment,
  bulkDeletePayments,
  reprocessReferralReward,
} from '../controllers/payment.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), uploadPaymentScreenshot, handleMulterError, createPayment)
router.route('/my').get(authenticate, authorize('student'), getMyPayments)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorizeTeamPage('payments'), getAllPayments)
router.route('/admin').post(authenticate, authorizeTeamPage('payments'), logActivity('create', 'payment', (req, body) => ({ resourceId: body?.data?._id, details: 'Manually created payment' })), adminCreatePayment)
router.route('/admin/direct-approve').post(authenticate, authorizeTeamPage('payments'), logActivity('approve', 'payment', () => ({ details: 'Directly approved payment' })), directApprovePayment)
router.route('/bulk').delete(authenticate, authorizeTeamPage('payments'), logActivity('delete', 'payment', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} payments` })), bulkDeletePayments)
router.route('/:id/approve').patch(authenticate, authorizeTeamPage('payments'), logActivity('approve', 'payment', (req) => ({ resourceId: req.params.id, details: 'Payment approved' })), approvePayment)
router.route('/:id/reject').patch(authenticate, authorizeTeamPage('payments'), logActivity('reject', 'payment', (req) => ({ resourceId: req.params.id, details: `Rejected: ${req.body.rejectionReason ?? ''}` })), rejectPayment)
router.route('/:id/reprocess-referral').post(authenticate, authorizeTeamPage('payments'), reprocessReferralReward)
router.route('/:id').delete(authenticate, authorizeTeamPage('payments'), logActivity('delete', 'payment', (req) => ({ resourceId: req.params.id, details: 'Deleted payment' })), deletePayment)

export default router
