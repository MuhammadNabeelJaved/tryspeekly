import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
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
router.route('/').post(authenticate, authorize('admin'), createNotification)
router.route('/:id').delete(authenticate, authorize('admin'), deleteNotification)

export default router
