import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  publicApplyForFinancialAid,
  applyForFinancialAid,
  getMyApplications,
  getAllApplications,
  updateApplicationStatus,
} from '../controllers/financial-aid.controller.js'

const router = express.Router()

// ─── Public route (no auth required) ──────────────────────────────────────────
router.route('/public').post(publicApplyForFinancialAid)

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), applyForFinancialAid)
router.route('/my').get(authenticate, authorize('student'), getMyApplications)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), getAllApplications)
router.route('/:id/status').patch(authenticate, authorize('admin'), updateApplicationStatus)

export default router
