import asyncHandler from '../utils/asyncHandler.js'
import Payment from '../models/payment.model.js'
import { uploadCourseMaterial, deleteFile, extractPublicId } from '../utils/cloudinary.js'
import Enrollment from '../models/enrollment.model.js'
import Notification from '../models/notification.model.js'

// POST /api/v1/payments — student submits payment proof
export const createPayment = asyncHandler(async (req, res) => {
  try {
    const { courseId, teacherId, method, transactionId, amount, currency } = req.body

    if (!req.file) return res.status(400).json({ success: false, error: { message: 'Payment screenshot is required' } })

    const result = await uploadCourseMaterial(req.file.buffer, `payment_${Date.now()}`)

    const payment = await Payment.create({
      student: req.user.id,
      course: courseId,
      teacher: teacherId,
      method,
      transactionId,
      screenshotUrl: result.secure_url,
      amount,
      currency: currency || 'PKR',
    })

    await Enrollment.findOneAndUpdate(
      { student: req.user.id, course: courseId },
      { payment: payment._id }
    )

    res.status(201).json({ success: true, message: 'Payment submitted. Awaiting admin approval.', data: payment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/payments/my — student: own payments
export const getMyPayments = asyncHandler(async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user.id })
      .populate('course', 'title')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 })
    res.json({ success: true, data: payments })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/payments — admin: all payments with filters
export const getAllPayments = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = status ? { status } : {}
    const skip = (Number(page) - 1) * Number(limit)

    const [payments, total] = await Promise.all([
      Payment.find(filter).populate('student', 'name email').populate('course', 'title').populate('teacher', 'name').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Payment.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: payments,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/payments/:id/approve — admin
export const approvePayment = asyncHandler(async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
    if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } })
    if (payment.status !== 'pending') return res.status(400).json({ success: false, error: { message: 'Payment already processed' } })

    payment.status = 'approved'
    payment.adminNote = req.body.adminNote || ''
    await payment.save()

    res.json({ success: true, message: 'Payment approved', data: payment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/payments/:id/reject — admin
export const rejectPayment = asyncHandler(async (req, res) => {
  try {
    const { rejectionReason } = req.body
    if (!rejectionReason) return res.status(400).json({ success: false, error: { message: 'Rejection reason is required' } })

    const payment = await Payment.findById(req.params.id)
    if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } })
    if (payment.status !== 'pending') return res.status(400).json({ success: false, error: { message: 'Payment already processed' } })

    payment.status = 'rejected'
    payment.rejectionReason = rejectionReason
    await payment.save()

    res.json({ success: true, message: 'Payment rejected', data: payment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
