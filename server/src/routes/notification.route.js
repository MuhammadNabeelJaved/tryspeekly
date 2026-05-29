import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
} from '../controllers/notification.controller.js'

const router = express.Router()

// ─── Authenticated routes ──────────────────────────────────────────────────────
router.route('/').get(authenticate, getMyNotifications)
router.route('/unread/count').get(authenticate, getUnreadCount)
router.route('/read-all').patch(authenticate, markAllAsRead)
router.route('/:id/read').patch(authenticate, markAsRead)

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorizeTeamPage('notifications'), createNotification)
router.route('/:id').delete(authenticate, authorizeTeamPage('notifications'), deleteNotification)

export default router
