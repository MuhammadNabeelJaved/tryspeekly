import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { uploadPaymentScreenshot, handleMulterError } from '../middlewares/multer.js'
import {
  createPayment,
  getMyPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
  adminCreatePayment,
} from '../controllers/payment.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), uploadPaymentScreenshot, handleMulterError, createPayment)
router.route('/my').get(authenticate, authorize('student'), getMyPayments)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorizeTeamPage('payments'), getAllPayments)
router.route('/admin').post(authenticate, authorizeTeamPage('payments'), adminCreatePayment)
router.route('/:id/approve').patch(authenticate, authorizeTeamPage('payments'), approvePayment)
router.route('/:id/reject').patch(authenticate, authorizeTeamPage('payments'), rejectPayment)

export default router
