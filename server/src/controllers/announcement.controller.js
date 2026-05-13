import asyncHandler from '../utils/asyncHandler.js'
import Announcement from '../models/announcement.model.js'

// GET /api/v1/announcements — authenticated: relevant announcements
export const getAnnouncements = asyncHandler(async (req, res) => {
  try {
    const now = new Date()
    const filter = {
      isActive: true,
      visibleTo: req.user.role,
      $or: [{ expiredAt: { $gt: now } }, { expiredAt: null }, { expiredAt: { $exists: false } }],
    }

    const announcements = await Announcement.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: announcements })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/announcements/all — admin: all announcements
export const getAllAnnouncements = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const [announcements, total] = await Promise.all([
      Announcement.find().skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Announcement.countDocuments(),
    ])

    res.json({
      success: true,
      data: announcements,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/announcements — admin: create announcement
export const createAnnouncement = asyncHandler(async (req, res) => {
  try {
    const { title, content, type, visibleTo, expiredAt } = req.body
    if (!title || !content) {
      return res.status(400).json({ success: false, error: { message: 'Title and content are required' } })
    }

    const announcement = await Announcement.create({ title, content, type, visibleTo, expiredAt })
    res.status(201).json({ success: true, message: 'Announcement created', data: announcement })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/announcements/:id — admin: update announcement
export const updateAnnouncement = asyncHandler(async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
    if (!announcement) return res.status(404).json({ success: false, error: { message: 'Announcement not found' } })

    const allowed = ['title', 'content', 'type', 'visibleTo', 'expiredAt', 'isActive']
    allowed.forEach((f) => { if (req.body[f] !== undefined) announcement[f] = req.body[f] })
    await announcement.save()

    res.json({ success: true, message: 'Announcement updated', data: announcement })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/announcements/:id — admin
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id)
    if (!announcement) return res.status(404).json({ success: false, error: { message: 'Announcement not found' } })
    res.json({ success: true, message: 'Announcement deleted' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
