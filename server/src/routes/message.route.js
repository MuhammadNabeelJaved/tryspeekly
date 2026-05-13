import express from 'express'
import { authenticate } from '../middlewares/auth.js'
import {
  sendMessage,
  getConversations,
  getMessagesWith,
  getUnreadCount,
} from '../controllers/message.controller.js'

const router = express.Router()

// ─── All protected ─────────────────────────────────────────────────────────────
router.route('/').post(authenticate, sendMessage)
router.route('/conversations').get(authenticate, getConversations)
router.route('/unread/count').get(authenticate, getUnreadCount)
router.route('/:userId').get(authenticate, getMessagesWith)

export default router
