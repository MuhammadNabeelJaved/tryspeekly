import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import {
  createTicket,
  getMyTickets,
  getTicket,
  replyToTicket,
  updateTicketStatus,
  getAllTickets,
  deleteTicket,
  bulkDeleteTickets,
} from '../controllers/support.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, createTicket)
router.route('/my').get(authenticate, getMyTickets)

// ─── Shared (student/admin) ────────────────────────────────────────────────────
router.route('/:id').get(authenticate, getTicket)
router.route('/:id/reply').post(authenticate, replyToTicket)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorizeTeamPage('support'), getAllTickets)
router.route('/bulk').delete(authenticate, authorizeTeamPage('support'), logActivity('delete', 'support', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} tickets` })), bulkDeleteTickets)
router.route('/:id/status').patch(authenticate, authorizeTeamPage('support'), logActivity('update', 'support', (req) => ({ resourceId: req.params.id, details: `Status → ${req.body.status ?? ''}` })), updateTicketStatus)
router.route('/:id').delete(authenticate, authorizeTeamPage('support'), logActivity('delete', 'support', (req) => ({ resourceId: req.params.id, details: 'Ticket deleted' })), deleteTicket)

export default router
