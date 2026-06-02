import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
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
router.route('/admin').post(authenticate, authorizeTeamPage('contacts'), logActivity('create', 'contact', (req) => ({ resourceName: req.body.name ?? '', details: 'Created contact' })), createContact)
router.route('/:id').get(authenticate, authorizeTeamPage('contacts'), getContact)
router.route('/:id').patch(authenticate, authorizeTeamPage('contacts'), logActivity('update', 'contact', (req) => ({ resourceId: req.params.id, details: `Status → ${req.body.status ?? ''}` })), updateContact)
router.route('/:id/read').patch(authenticate, authorizeTeamPage('contacts'), markContactRead)
router.route('/bulk').delete(authenticate, authorizeTeamPage('contacts'), logActivity('delete', 'contact', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} messages` })), bulkDeleteContacts)
router.route('/:id').delete(authenticate, authorizeTeamPage('contacts'), logActivity('delete', 'contact', (req) => ({ resourceId: req.params.id, details: 'Contact deleted' })), deleteContact)

export default router
