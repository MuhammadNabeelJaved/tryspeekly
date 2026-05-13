import asyncHandler from '../utils/asyncHandler.js'
import Contact from '../models/contact.model.js'

// POST /api/v1/contact — public: submit contact form
export const submitContact = asyncHandler(async (req, res) => {
  try {
    const { name, email, subject, message } = req.body
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: { message: 'Name, email, subject, and message are required' } })
    }

    const contact = await Contact.create({ name, email, subject, message })
    res.status(201).json({ success: true, message: 'Message sent successfully', data: contact })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/contact — admin: all messages
export const getAllContacts = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query
    const filter = {}
    if (isRead !== undefined) filter.isRead = isRead === 'true'
    const skip = (Number(page) - 1) * Number(limit)

    const [contacts, total] = await Promise.all([
      Contact.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Contact.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: contacts,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/contact/:id — admin
export const getContact = asyncHandler(async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact) return res.status(404).json({ success: false, error: { message: 'Message not found' } })
    res.json({ success: true, data: contact })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/contact/:id/read — admin
export const markContactRead = asyncHandler(async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true })
    if (!contact) return res.status(404).json({ success: false, error: { message: 'Message not found' } })
    res.json({ success: true, message: 'Marked as read', data: contact })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/contact/:id — admin
export const deleteContact = asyncHandler(async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id)
    if (!contact) return res.status(404).json({ success: false, error: { message: 'Message not found' } })
    res.json({ success: true, message: 'Message deleted' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
