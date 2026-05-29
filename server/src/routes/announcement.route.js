import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  getAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller.js'

const router = express.Router()

// ─── Authenticated routes ──────────────────────────────────────────────────────
router.route('/').get(authenticate, getAnnouncements)

// ─── Admin routes ──────────────────────────────────────────────────────────────
// admin-only: no team member page permission maps to this endpoint
router.route('/all').get(authenticate, authorize('admin'), getAllAnnouncements)
router.route('/').post(authenticate, authorize('admin'), createAnnouncement)
router.route('/:id').patch(authenticate, authorize('admin'), updateAnnouncement)
router.route('/:id').delete(authenticate, authorize('admin'), deleteAnnouncement)

export default router
