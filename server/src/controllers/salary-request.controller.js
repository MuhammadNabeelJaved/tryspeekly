import asyncHandler from '../utils/asyncHandler.js'
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../utils/apiErrors.js'
import SalaryRequest from '../models/salary-request.model.js'
import SalaryPackage from '../models/salary-package.model.js'
import User from '../models/user.model.js'
import { createAndEmitNotification } from '../utils/notify.js'
import SalaryPayment from '../models/salary-payment.model.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPeriod(start, end) {
  const opts = { month: 'long', year: 'numeric' }
  const s = new Date(start)
  if (!end) return s.toLocaleDateString('en-PK', opts)
  const e = new Date(end)
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-PK', { month: 'long' })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  }
  return `${s.toLocaleDateString('en-PK', opts)} – ${e.toLocaleDateString('en-PK', opts)}`
}

// ─── Teacher Handlers ─────────────────────────────────────────────────────────

// POST /api/v1/salary-requests — teacher: submit a new salary request
export const createRequest = asyncHandler(async (req, res) => {
  const teacherId = req.user.id
  const { amount, periodStart, periodLabel, periodEnd, note } = req.body

  if (!amount || !periodStart) {
    throw new BadRequestError('amount and periodStart are required')
  }

  const pkg = await SalaryPackage.findOne({ teacher: teacherId })
  if (!pkg) throw new NotFoundError('No salary package found for your account')

  const existing = await SalaryRequest.findOne({ teacher: teacherId, status: 'pending' })
  if (existing) throw new ConflictError('You already have a pending salary request')

  const teacher = await User.findById(teacherId, 'name')

  const requestData = { teacher: teacherId, package: pkg._id, amount, periodStart }
  if (periodLabel !== undefined) requestData.periodLabel = periodLabel
  if (periodEnd !== undefined) requestData.periodEnd = periodEnd
  if (note !== undefined) requestData.note = note

  const request = await SalaryRequest.create(requestData)

  const admins = await User.find({ role: 'admin' }, '_id')
  for (const admin of admins) {
    await createAndEmitNotification({
      recipientId: admin._id,
      title: 'New Salary Request',
      message: `${teacher.name} has requested ₨${amount} for ${periodLabel || formatPeriod(periodStart, periodEnd)}.`,
      type: 'payment',
      severity: 'medium',
      relatedId: request._id,
      relatedType: 'SalaryRequest',
    })
  }

  res.status(201).json({ success: true, message: 'Salary request submitted', data: request })
})

// GET /api/v1/salary-requests/my — teacher: list own requests
export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await SalaryRequest.find({ teacher: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)

  res.json({ success: true, data: requests })
})

// DELETE /api/v1/salary-requests/:id — teacher: cancel own pending request
export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await SalaryRequest.findById(req.params.id)
  if (!request) throw new NotFoundError('Salary request not found')
  if (request.teacher.toString() !== req.user.id) throw new ForbiddenError('Not your request')
  if (request.status !== 'pending') throw new ForbiddenError('Only pending requests can be cancelled')

  await request.deleteOne()

  res.json({ success: true, message: 'Salary request cancelled' })
})

// ─── Admin Handlers ───────────────────────────────────────────────────────────

// GET /api/v1/salary-requests — admin: list all requests (optional ?status= filter)
export const getAllRequests = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.status) filter.status = req.query.status
  if (req.query.teacher) filter.teacher = req.query.teacher

  const requests = await SalaryRequest.find(filter)
    .populate('teacher', 'name email profileImage')
    .sort({ createdAt: -1 })

  res.json({ success: true, data: requests })
})

// PATCH /api/v1/salary-requests/:id/approve — admin: approve, auto-create SalaryPayment
export const approveRequest = asyncHandler(async (req, res) => {
  const request = await SalaryRequest.findById(req.params.id)
  if (!request) throw new NotFoundError('Salary request not found')
  if (request.status !== 'pending') throw new BadRequestError('Request is no longer pending')

  const { adminReply } = req.body

  const paymentData = {
    package: request.package,
    teacher: request.teacher,
    amount: request.amount,
    periodStart: request.periodStart,
    status: 'paid',
    paidDate: new Date(),
  }
  if (request.periodLabel) paymentData.periodLabel = request.periodLabel
  if (request.periodEnd) paymentData.periodEnd = request.periodEnd

  await SalaryPayment.create(paymentData)

  request.status = 'approved'
  request.resolvedAt = new Date()
  if (adminReply !== undefined) request.adminReply = adminReply
  await request.save()

  await createAndEmitNotification({
    recipientId: request.teacher,
    title: 'Salary Request Approved',
    message: `Your salary request of ₨${request.amount} for ${request.periodLabel || formatPeriod(request.periodStart, request.periodEnd)} has been approved.`,
    type: 'payment',
    severity: 'low',
    relatedId: request._id,
    relatedType: 'SalaryRequest',
  })

  res.json({ success: true, message: 'Request approved and payment created', data: request })
})

// PATCH /api/v1/salary-requests/:id/reject — admin: reject with reason
export const rejectRequest = asyncHandler(async (req, res) => {
  const request = await SalaryRequest.findById(req.params.id)
  if (!request) throw new NotFoundError('Salary request not found')
  if (request.status !== 'pending') throw new BadRequestError('Request is no longer pending')

  const { adminReply } = req.body

  request.status = 'rejected'
  request.resolvedAt = new Date()
  if (adminReply !== undefined) request.adminReply = adminReply
  await request.save()

  await createAndEmitNotification({
    recipientId: request.teacher,
    title: 'Salary Request Update',
    message: `Your salary request of ₨${request.amount} for ${request.periodLabel || formatPeriod(request.periodStart, request.periodEnd)} was not approved.${adminReply ? ' Reason: ' + adminReply : ''}`,
    type: 'payment',
    severity: 'low',
    relatedId: request._id,
    relatedType: 'SalaryRequest',
  })

  res.json({ success: true, message: 'Request rejected', data: request })
})
