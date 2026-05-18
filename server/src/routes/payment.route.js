import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadDocument, handleMulterError } from '../middlewares/multer.js'
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
router.route('/').post(authenticate, authorize('student'), uploadDocument, handleMulterError, createPayment)
router.route('/my').get(authenticate, authorize('student'), getMyPayments)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), getAllPayments)
router.route('/admin').post(authenticate, authorize('admin'), adminCreatePayment)
router.route('/:id/approve').patch(authenticate, authorize('admin'), approvePayment)
router.route('/:id/reject').patch(authenticate, authorize('admin'), rejectPayment)

export default router
