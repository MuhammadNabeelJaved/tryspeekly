import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import {
  applyForFinancialAid,
  getMyApplications,
  getAllApplications,
  updateApplicationStatus,
} from '../controllers/financial-aid.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), applyForFinancialAid)
router.route('/my').get(authenticate, authorize('student'), getMyApplications)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorizeTeamPage('financial-aid'), getAllApplications)
router.route('/:id/status').patch(authenticate, authorizeTeamPage('financial-aid'), updateApplicationStatus)

export default router
