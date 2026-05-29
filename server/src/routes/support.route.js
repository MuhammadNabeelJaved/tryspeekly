import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import {
  createTicket,
  getMyTickets,
  getTicket,
  replyToTicket,
  updateTicketStatus,
  getAllTickets,
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
router.route('/:id/status').patch(authenticate, authorizeTeamPage('support'), updateTicketStatus)

export default router
