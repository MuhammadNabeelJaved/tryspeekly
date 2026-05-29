import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
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
  .get(authenticate, authorizeTeamPage('salaries'), getAllPackages)
  .post(authenticate, authorizeTeamPage('salaries'), createPackage)

router.route('/:id')
  .patch(authenticate, authorizeTeamPage('salaries'), updatePackage)
  .delete(authenticate, authorizeTeamPage('salaries'), deletePackage)

router.route('/:id/payments')
  .get(authenticate, authorizeTeamPage('salaries'), getPackagePayments)
  .post(authenticate, authorizeTeamPage('salaries'), addPayment)

router.route('/:id/payments/:paymentId')
  .patch(authenticate, authorizeTeamPage('salaries'), updatePayment)
  .delete(authenticate, authorizeTeamPage('salaries'), deletePayment)

export default router
