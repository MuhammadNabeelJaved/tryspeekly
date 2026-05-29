import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import {
  createRequest,
  getMyRequests,
  cancelRequest,
  getAllRequests,
  approveRequest,
  rejectRequest,
} from '../controllers/salary-request.controller.js'

const router = express.Router()

// ─── Teacher routes ────────────────────────────────────────────────────────────
router.get('/my', authenticate, authorize('teacher'), getMyRequests)
router.post('/', authenticate, authorize('teacher'), createRequest)
router.delete('/:id', authenticate, authorize('teacher'), cancelRequest)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.get('/', authenticate, authorizeTeamPage('salaries'), getAllRequests)
router.patch('/:id/approve', authenticate, authorizeTeamPage('salaries'), approveRequest)
router.patch('/:id/reject', authenticate, authorizeTeamPage('salaries'), rejectRequest)

export default router
