import asyncHandler from '../utils/asyncHandler.js'
import SupportTicket from '../models/support.model.js'
import User from '../models/user.model.js'
import { sendEmail } from '../utils/email.js'

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

    // When staff replies, email the student who owns the ticket (fire-and-forget)
    if (!isOwner) {
      User.findById(ticket.student, 'name email').lean().then(student => {
        if (!student?.email) return
        sendEmail({
          type: 'support_reply',
          to: student.email,
          toName: student.name,
          variables: {
            studentName: student.name,
            subject: ticket.subject,
            replyPreview: content.length > 160 ? `${content.slice(0, 160)}…` : content,
            dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/support`,
          },
          metadata: { ticketId: ticket._id },
        }).catch(() => {})
      }).catch(() => {})
    }

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

// DELETE /api/v1/support/:id — admin: delete a ticket
export const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByIdAndDelete(req.params.id)
  if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } })
  res.json({ success: true, message: 'Ticket deleted' })
})

// DELETE /api/v1/support/bulk — admin: bulk-delete tickets
export const bulkDeleteTickets = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ success: false, error: { message: 'ids must be a non-empty array' } })
  const result = await SupportTicket.deleteMany({ _id: { $in: ids } })
  res.json({ success: true, message: `${result.deletedCount} ticket${result.deletedCount !== 1 ? 's' : ''} deleted`, data: { deleted: result.deletedCount } })
})
