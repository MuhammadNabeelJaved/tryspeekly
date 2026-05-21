import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getPackagePayments,
  addPayment,
  updatePayment,
  deletePayment,
  getMyPackage,
} from '../controllers/salary.controller.js'

const router = express.Router()

// ─── Teacher routes ────────────────────────────────────────────────────────────
router.get('/my', authenticate, authorize('teacher'), getMyPackage)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/')
  .get(authenticate, authorize('admin'), getAllPackages)
  .post(authenticate, authorize('admin'), createPackage)

router.route('/:id')
  .patch(authenticate, authorize('admin'), updatePackage)
  .delete(authenticate, authorize('admin'), deletePackage)

router.route('/:id/payments')
  .get(authenticate, authorize('admin'), getPackagePayments)
  .post(authenticate, authorize('admin'), addPayment)

router.route('/:id/payments/:paymentId')
  .patch(authenticate, authorize('admin'), updatePayment)
  .delete(authenticate, authorize('admin'), deletePayment)

export default router
