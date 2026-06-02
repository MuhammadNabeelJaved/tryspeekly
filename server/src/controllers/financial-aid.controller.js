import mongoose from 'mongoose'
import asyncHandler from '../utils/asyncHandler.js'
import FinancialAid from '../models/financial-aid.model.js'
import { createAndEmitNotification } from '../utils/notify.js'
import Course from '../models/course.model.js'
import User from '../models/user.model.js'
import { sendEmail } from '../utils/email.js'

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

    // Email: financial aid application confirmation
    const course = courseId ? await Course.findById(courseId, 'title').lean() : null
    sendEmail({
      type: 'financial_aid_applied',
      to: email,
      toName: name,
      variables: {
        studentName: name,
        courseName: course?.title ?? 'the requested course',
      },
      metadata: { applicationId: application._id },
    }).catch(() => {})

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

    const prevStatus = application.status
    application.status = status
    application.decidedAt = new Date()
    if (notes !== undefined) application.notes = notes
    if (approvedAmount !== undefined) application.approvedAmount = approvedAmount
    await application.save()

    if (prevStatus !== status && ['accepted', 'rejected', 'under_review'].includes(status)) {
      const messages = {
        accepted: 'Your financial aid application has been accepted.',
        rejected: `Your financial aid application has been rejected.${notes ? ` Reason: ${notes}` : ''}`,
        under_review: 'Your financial aid application is now under review.',
      }
      await createAndEmitNotification({
        recipientId: application.student,
        title: 'Financial Aid Update',
        message: messages[status],
        type: 'financial_aid',
        severity: status === 'accepted' ? 'low' : status === 'rejected' ? 'medium' : 'low',
        relatedId: application._id,
        relatedType: 'FinancialAid',
      })

      // Email for accepted/rejected only
      if (status === 'accepted' || status === 'rejected') {
        const [student, course] = await Promise.all([
          User.findById(application.student, 'name email').lean(),
          application.course ? Course.findById(application.course, 'title').lean() : null,
        ])
        if (student) {
          sendEmail({
            type: status === 'accepted' ? 'financial_aid_approved' : 'financial_aid_rejected',
            to: student.email,
            toName: student.name,
            variables: {
              studentName: student.name,
              courseName: course?.title ?? 'the requested course',
              notes: notes || 'None',
              dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`,
            },
            metadata: { applicationId: application._id },
          }).catch(() => {})
        }
      }
    }

    res.json({ success: true, message: 'Application status updated', data: application })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/financial-aid/:id — admin: delete single application
export const deleteApplication = asyncHandler(async (req, res) => {
  const app = await FinancialAid.findByIdAndDelete(req.params.id)
  if (!app) return res.status(404).json({ success: false, error: { message: 'Application not found' } })
  res.json({ success: true, message: 'Application deleted' })
})

// DELETE /api/v1/financial-aid/bulk — admin: bulk delete applications
export const bulkDeleteApplications = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: { message: 'ids must be a non-empty array' } })
  }
  if (ids.length > 100) {
    return res.status(400).json({ success: false, error: { message: 'Cannot delete more than 100 records at once' } })
  }
  const validIds = ids.filter(id => mongoose.isValidObjectId(id))
  const result = await FinancialAid.deleteMany({ _id: { $in: validIds } })
  res.json({ success: true, message: `${result.deletedCount} application${result.deletedCount !== 1 ? 's' : ''} deleted`, data: { deleted: result.deletedCount } })
})
