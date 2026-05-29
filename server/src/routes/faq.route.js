import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  reorderFAQs,
} from '../controllers/faq.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').get(getAllFAQs)

// ─── Admin routes ──────────────────────────────────────────────────────────────
// admin-only: no team member page permission maps to this endpoint
router.route('/').post(authenticate, authorize('admin'), createFAQ)
router.route('/reorder').patch(authenticate, authorize('admin'), reorderFAQs)
router.route('/:id').patch(authenticate, authorize('admin'), updateFAQ)
router.route('/:id').delete(authenticate, authorize('admin'), deleteFAQ)

export default router
