import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
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
router.get('/', authenticate, authorize('admin'), getAllRequests)
router.patch('/:id/approve', authenticate, authorize('admin'), approveRequest)
router.patch('/:id/reject', authenticate, authorize('admin'), rejectRequest)

export default router
