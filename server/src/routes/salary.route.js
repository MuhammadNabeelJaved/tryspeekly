import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
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
  .post(authenticate, authorizeTeamPage('salaries'), logActivity('create', 'salary-package', (req, body) => ({ resourceId: body?.data?._id, details: 'Created salary package' })), createPackage)

router.route('/:id')
  .patch(authenticate, authorizeTeamPage('salaries'), logActivity('update', 'salary-package', (req) => ({ resourceId: req.params.id, details: 'Updated salary package' })), updatePackage)
  .delete(authenticate, authorizeTeamPage('salaries'), logActivity('delete', 'salary-package', (req) => ({ resourceId: req.params.id, details: 'Deleted salary package' })), deletePackage)

router.route('/:id/payments')
  .get(authenticate, authorizeTeamPage('salaries'), getPackagePayments)
  .post(authenticate, authorizeTeamPage('salaries'), logActivity('create', 'salary-payment', (req) => ({ resourceId: req.params.id, details: 'Recorded salary payment' })), addPayment)

router.route('/:id/payments/:paymentId')
  .patch(authenticate, authorizeTeamPage('salaries'), logActivity('update', 'salary-payment', (req) => ({ resourceId: req.params.paymentId, details: 'Updated salary payment' })), updatePayment)
  .delete(authenticate, authorizeTeamPage('salaries'), logActivity('delete', 'salary-payment', (req) => ({ resourceId: req.params.paymentId, details: 'Deleted salary payment' })), deletePayment)

export default router
