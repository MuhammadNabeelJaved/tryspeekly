import asyncHandler from '../utils/asyncHandler.js'
import Notification from '../models/notification.model.js'
import { emitToUser } from '../utils/socket.js'

// GET /api/v1/notifications — authenticated: own notifications
export const getMyNotifications = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query
    const filter = { recipient: req.user.id }
    if (unreadOnly === 'true') filter.read = false
    const skip = (Number(page) - 1) * Number(limit)

    const [notifications, total] = await Promise.all([
      Notification.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Notification.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: notifications,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/notifications/unread/count — authenticated
export const getUnreadCount = asyncHandler(async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, read: false })
    res.json({ success: true, data: { count } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/notifications/:id/read — authenticated
export const markAsRead = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user.id })
    if (!notification) return res.status(404).json({ success: false, error: { message: 'Notification not found' } })

    notification.read = true
    notification.readAt = new Date()
    await notification.save()

    res.json({ success: true, message: 'Marked as read', data: notification })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/notifications/read-all — authenticated
export const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true, readAt: new Date() })
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/notifications — admin: create notification
export const createNotification = asyncHandler(async (req, res) => {
  try {
    const { recipientId, title, message, type, severity, relatedId, relatedType } = req.body
    if (!recipientId || !title || !message) {
      return res.status(400).json({ success: false, error: { message: 'Recipient, title, and message are required' } })
    }

    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type: type || 'system',
      severity: severity || 'low',
      relatedId,
      relatedType,
    })

    emitToUser(recipientId, 'new_notification', notification)

    res.status(201).json({ success: true, data: notification })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/notifications/:id — admin
export const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id)
    if (!notification) return res.status(404).json({ success: false, error: { message: 'Notification not found' } })
    res.json({ success: true, message: 'Notification deleted' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
