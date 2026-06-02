import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import {
  submitContact,
  getAllContacts,
  getContact,
  createContact,
  updateContact,
  markContactRead,
  deleteContact,
  bulkDeleteContacts,
} from '../controllers/contact.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').post(submitContact)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorizeTeamPage('contacts'), getAllContacts)
router.route('/admin').post(authenticate, authorizeTeamPage('contacts'), createContact)
router.route('/:id').get(authenticate, authorizeTeamPage('contacts'), getContact)
router.route('/:id').patch(authenticate, authorizeTeamPage('contacts'), updateContact)
router.route('/:id/read').patch(authenticate, authorizeTeamPage('contacts'), markContactRead)
router.route('/bulk').delete(authenticate, authorizeTeamPage('contacts'), bulkDeleteContacts)
router.route('/:id').delete(authenticate, authorizeTeamPage('contacts'), deleteContact)

export default router
