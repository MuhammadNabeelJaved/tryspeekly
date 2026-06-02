import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
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
router.route('/').post(authenticate, authorizeTeamPage('notifications'), logActivity('create', 'notification', () => ({ details: 'Created notification' })), createNotification)
router.route('/:id').delete(authenticate, authorizeTeamPage('notifications'), logActivity('delete', 'notification', (req) => ({ resourceId: req.params.id, details: 'Deleted notification' })), deleteNotification)

export default router
