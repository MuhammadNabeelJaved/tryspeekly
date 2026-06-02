import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import {
  applyForFinancialAid,
  getMyApplications,
  getAllApplications,
  updateApplicationStatus,
  deleteApplication,
  bulkDeleteApplications,
} from '../controllers/financial-aid.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), applyForFinancialAid)
router.route('/my').get(authenticate, authorize('student'), getMyApplications)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorizeTeamPage('financial-aid'), getAllApplications)
router.route('/bulk').delete(authenticate, authorizeTeamPage('financial-aid'), bulkDeleteApplications)
router.route('/:id/status').patch(authenticate, authorizeTeamPage('financial-aid'), updateApplicationStatus)
router.route('/:id').delete(authenticate, authorizeTeamPage('financial-aid'), deleteApplication)

export default router
