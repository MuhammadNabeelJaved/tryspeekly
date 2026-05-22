import asyncHandler from '../utils/asyncHandler.js'
import Contact from '../models/contact.model.js'

// POST /api/v1/contact — public: submit contact form
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, subject, and message are required' })
  }
  const contact = await Contact.create({ name, email, phone, subject, message })
  res.status(201).json({ success: true, message: 'Message sent successfully', data: contact })
})

// GET /api/v1/contact — admin: all messages
export const getAllContacts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead, status, search } = req.query
  const filter = {}
  if (isRead !== undefined) filter.isRead = isRead === 'true'
  if (status) filter.status = status
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
    ]
  }

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
})

// GET /api/v1/contact/:id — admin
export const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id)
  if (!contact) return res.status(404).json({ success: false, message: 'Message not found' })
  res.json({ success: true, data: contact })
})

// POST /api/v1/contact/admin — admin: manually create contact
export const createContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message, status, notes } = req.body
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, subject, and message are required' })
  }
  const contact = await Contact.create({ name, email, phone, subject, message, status: status || 'new', notes })
  res.status(201).json({ success: true, message: 'Contact created successfully', data: contact })
})

// PATCH /api/v1/contact/:id — admin: update contact
export const updateContact = asyncHandler(async (req, res) => {
  const allowed = ['name', 'email', 'phone', 'subject', 'message', 'isRead', 'status', 'notes']
  const updates = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  const contact = await Contact.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' })
  res.json({ success: true, message: 'Contact updated', data: contact })
})

// PATCH /api/v1/contact/:id/read — admin
export const markContactRead = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true })
  if (!contact) return res.status(404).json({ success: false, message: 'Message not found' })
  res.json({ success: true, message: 'Marked as read', data: contact })
})

// DELETE /api/v1/contact/:id — admin
export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id)
  if (!contact) return res.status(404).json({ success: false, message: 'Message not found' })
  res.json({ success: true, message: 'Message deleted' })
})
