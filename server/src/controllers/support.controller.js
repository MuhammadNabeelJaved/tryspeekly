import asyncHandler from '../utils/asyncHandler.js'
import SupportTicket from '../models/support.model.js'

// POST /api/v1/support — student: create ticket
export const createTicket = asyncHandler(async (req, res) => {
  try {
    const { courseId, subject, description, priority } = req.body

    const ticket = await SupportTicket.create({
      student: req.user.id,
      course: courseId || undefined,
      subject,
      description,
      priority: priority || 'medium',
    })

    res.status(201).json({ success: true, message: 'Support ticket created', data: ticket })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/support/my — student: own tickets
export const getMyTickets = asyncHandler(async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ student: req.user.id })
      .populate('course', 'title')
      .select('-messages')
      .sort({ updatedAt: -1 })
    res.json({ success: true, data: tickets })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/support/:id — student/admin
export const getTicket = asyncHandler(async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('student', 'name email profileImage')
      .populate('course', 'title')
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } })

    const isOwner = ticket.student._id.toString() === req.user.id.toString()
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Not authorized' } })
    }

    res.json({ success: true, data: ticket })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/support/:id/reply — student/admin
export const replyToTicket = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ success: false, error: { message: 'Message content is required' } })

    const ticket = await SupportTicket.findById(req.params.id)
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } })
    if (ticket.status === 'closed') return res.status(400).json({ success: false, error: { message: 'Cannot reply to a closed ticket' } })

    const isOwner = ticket.student.toString() === req.user.id.toString()
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Not authorized' } })
    }

    const senderRole = req.user.role === 'admin' ? 'admin' : 'student'
    ticket.messages.push({ sender: senderRole, senderId: req.user.id, content })
    ticket.lastMessageAt = new Date()
    if (ticket.status === 'closed') ticket.status = 'open'
    await ticket.save()

    res.json({ success: true, message: 'Reply added', data: ticket.messages[ticket.messages.length - 1] })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/support/:id/status — admin
export const updateTicketStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['open', 'pending', 'closed']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: { message: `Status must be one of: ${validStatuses.join(', ')}` } })
    }

    const ticket = await SupportTicket.findById(req.params.id)
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } })

    ticket.status = status
    if (status === 'closed') ticket.closedAt = new Date()
    await ticket.save()

    res.json({ success: true, message: 'Ticket status updated', data: ticket })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/support — admin: all tickets
export const getAllTickets = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query
    const filter = {}
    if (status) filter.status = status
    if (priority) filter.priority = priority
    const skip = (Number(page) - 1) * Number(limit)

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('student', 'name email')
        .populate('course', 'title')
        .select('-messages')
        .skip(skip)
        .limit(Number(limit))
        .sort({ lastMessageAt: -1 }),
      SupportTicket.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: tickets,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
