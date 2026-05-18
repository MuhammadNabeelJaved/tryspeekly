import asyncHandler from '../utils/asyncHandler.js'
import FinancialAid from '../models/financial-aid.model.js'

// POST /api/v1/financial-aid/public — unauthenticated: apply from public page
export const publicApplyForFinancialAid = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, reason } = req.body
    if (!name || !email || !reason) {
      return res.status(400).json({ success: false, error: { message: 'Name, email, and reason are required' } })
    }

    const application = await FinancialAid.create({ name, email, phone, reason })
    res.status(201).json({ success: true, message: 'Application submitted successfully', data: application })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/financial-aid — student: apply (authenticated)
export const applyForFinancialAid = asyncHandler(async (req, res) => {
  try {
    const { courseId, name, email, phone, reason } = req.body

    const existing = await FinancialAid.findOne({ student: req.user.id, course: courseId, status: { $in: ['pending', 'under_review'] } })
    if (existing) return res.status(409).json({ success: false, error: { message: 'You already have a pending application for this course' } })

    const application = await FinancialAid.create({
      student: req.user.id,
      course: courseId || undefined,
      name,
      email,
      phone,
      reason,
    })

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: application })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/financial-aid/my — student: own applications
export const getMyApplications = asyncHandler(async (req, res) => {
  try {
    const applications = await FinancialAid.find({ student: req.user.id })
      .populate('course', 'title')
      .sort({ appliedAt: -1 })
    res.json({ success: true, data: applications })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/financial-aid — admin: all applications
export const getAllApplications = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = status ? { status } : {}
    const skip = (Number(page) - 1) * Number(limit)

    const [applications, total] = await Promise.all([
      FinancialAid.find(filter)
        .populate('student', 'name email')
        .populate('course', 'title')
        .skip(skip)
        .limit(Number(limit))
        .sort({ appliedAt: -1 }),
      FinancialAid.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: applications,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/financial-aid/:id/status — admin
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  try {
    const { status, notes, approvedAmount } = req.body
    const validStatuses = ['pending', 'under_review', 'accepted', 'rejected']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: { message: `Status must be one of: ${validStatuses.join(', ')}` } })
    }

    const application = await FinancialAid.findById(req.params.id)
    if (!application) return res.status(404).json({ success: false, error: { message: 'Application not found' } })

    application.status = status
    application.decidedAt = new Date()
    if (notes !== undefined) application.notes = notes
    if (approvedAmount !== undefined) application.approvedAmount = approvedAmount
    await application.save()

    res.json({ success: true, message: 'Application status updated', data: application })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
