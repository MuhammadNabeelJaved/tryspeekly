import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  submitContact,
  getAllContacts,
  getContact,
  markContactRead,
  deleteContact,
} from '../controllers/contact.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').post(submitContact)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), getAllContacts)
router.route('/:id').get(authenticate, authorize('admin'), getContact)
router.route('/:id/read').patch(authenticate, authorize('admin'), markContactRead)
router.route('/:id').delete(authenticate, authorize('admin'), deleteContact)

export default router
