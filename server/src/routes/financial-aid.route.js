import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
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
router.route('/bulk').delete(authenticate, authorizeTeamPage('financial-aid'), logActivity('delete', 'financial-aid', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} applications` })), bulkDeleteApplications)
router.route('/:id/status').patch(authenticate, authorizeTeamPage('financial-aid'), logActivity('update', 'financial-aid', (req) => ({ resourceId: req.params.id, details: `Status → ${req.body.status ?? ''}` })), updateApplicationStatus)
router.route('/:id').delete(authenticate, authorizeTeamPage('financial-aid'), logActivity('delete', 'financial-aid', (req) => ({ resourceId: req.params.id, details: 'Deleted application' })), deleteApplication)

export default router
