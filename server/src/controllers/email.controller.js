import asyncHandler from '../utils/asyncHandler.js'
import EmailSettings from '../models/email-settings.model.js'
import EmailTemplate from '../models/email-template.model.js'
import EmailLog from '../models/email-log.model.js'
import { sendEmail } from '../utils/email.js'
import { BadRequestError, NotFoundError } from '../utils/apiErrors.js'

// ─── Realistic demo data for test emails ──────────────────────────────────────
const DEMO_VARS = {
  otp_verification:              { name: 'Muhammad Nabeel', otp: '847291' },
  otp_forgot_password:           { name: 'Muhammad Nabeel', otp: '512438' },
  account_verified_welcome:      { name: 'Muhammad Nabeel', role: 'student', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard` },
  contact_form_submitted:        { name: 'Muhammad Nabeel', subject: 'Course Inquiry', message: 'I would like to know more about your English courses and the enrollment process.' },
  enrollment_confirmed:          { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', teacherName: 'Sarah Khan', courseLevel: 'Advanced', courseType: 'Live' },
  enrollment_teacher_notification: { teacherName: 'Sarah Khan', studentName: 'Muhammad Nabeel', studentEmail: 'student@example.com', courseName: 'Advanced English Communication' },
  payment_submitted:             { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', amount: '5000', currency: 'PKR', method: 'Bank Transfer' },
  payment_approved:              { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', amount: '5000', currency: 'PKR', adminNote: 'Payment verified successfully.', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard` },
  payment_rejected:              { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', rejectionReason: 'Screenshot is blurry and unreadable.', adminNote: 'Please upload a clear screenshot of the transaction.', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard` },
  payment_resubmitted:           { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', amount: '5000', currency: 'PKR', method: 'JazzCash' },
  financial_aid_applied:         { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication' },
  financial_aid_approved:        { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', notes: 'Financial aid granted based on your application.', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard` },
  financial_aid_rejected:        { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', notes: 'Application does not meet the current eligibility criteria.' },
  course_created_pending:        { teacherName: 'Sarah Khan', courseName: 'Advanced English Communication' },
  course_approved:               { teacherName: 'Sarah Khan', courseName: 'Advanced English Communication', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/instructor` },
  course_rejected:               { teacherName: 'Sarah Khan', courseName: 'Advanced English Communication', reason: 'Course content does not meet our quality standards. Please revise and resubmit.', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/instructor` },
  live_class_started_teacher:    { teacherName: 'Sarah Khan', courseName: 'Advanced English Communication', meetingLink: 'https://meet.google.com/abc-xyz-123', classNumber: '5' },
  live_class_started_student:    { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', teacherName: 'Sarah Khan', meetingLink: 'https://meet.google.com/abc-xyz-123', classNumber: '5' },
  assignment_created:            { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', assignmentTitle: 'Essay: My Daily Routine', dueDate: '15 June 2026', description: 'Write a 200-word essay about your daily routine using present simple tense.', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard` },
  salary_processed:              { teacherName: 'Sarah Khan', amount: '25000', currency: 'PKR', period: 'May 2026', paymentMethod: 'Bank Transfer', notes: 'Monthly salary for May 2026.' },
  salary_requested:              { teacherName: 'Sarah Khan', amount: '₨25,000', period: 'May 2026' },
  review_submitted:              { reviewerName: 'Muhammad Nabeel', reviewType: 'Course Review', courseName: 'Advanced English Communication', rating: '5' },
  review_approved:               { reviewerName: 'Muhammad Nabeel', reviewType: 'Course Review', courseName: 'Advanced English Communication' },
  offer_created:                 { userName: 'Muhammad Nabeel', offerTitle: 'Eid Special Discount', courseName: 'Advanced English Communication', discountPercent: '30%', offerDescription: 'Celebrate Eid with a special discount on our top-rated English course!', endsAt: '30 June 2026', courseUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/courses` },
  team_member_welcome:           { name: 'Muhammad Nabeel', email: 'team@example.com', jobTitle: 'Content Manager', loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login` },
  certificate_issued:            { studentName: 'Muhammad Nabeel', courseName: 'Advanced English Communication', certificateId: 'EPC-2026-0042', certificateUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/certificate/EPC-2026-0042` },
  payout_approved:               { studentName: 'Muhammad Nabeel', amount: '1500', currency: 'PKR', walletBalance: '500', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/referrals` },
  payout_rejected:               { studentName: 'Muhammad Nabeel', amount: '1500', currency: 'PKR', reason: 'Minimum payout threshold not met.', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/referrals` },
  support_reply:                 { studentName: 'Muhammad Nabeel', subject: 'Cannot access my course', replyPreview: 'Thanks for reaching out — we have restored your access. Please log out and back in to see the change.', dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/support` },
}

// ─── Settings ─────────────────────────────────────────────────────────────────

// GET /api/v1/email/settings
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await EmailSettings.find().sort({ category: 1, name: 1 }).lean()
  res.json({ success: true, data: settings })
})

// PATCH /api/v1/email/settings/:type
export const updateSetting = asyncHandler(async (req, res) => {
  const { enabled } = req.body
  if (typeof enabled !== 'boolean') throw new BadRequestError('enabled must be a boolean')

  const setting = await EmailSettings.findOneAndUpdate(
    { type: req.params.type },
    { enabled },
    { new: true }
  )
  if (!setting) throw new NotFoundError('Email setting not found')

  res.json({ success: true, message: `Email type "${setting.name}" ${enabled ? 'enabled' : 'disabled'}`, data: setting })
})

// PATCH /api/v1/email/settings — bulk update
export const bulkUpdateSettings = asyncHandler(async (req, res) => {
  const { updates } = req.body // [{ type, enabled }]
  if (!Array.isArray(updates)) throw new BadRequestError('updates must be an array')

  const ops = updates.map(({ type, enabled }) => ({
    updateOne: { filter: { type }, update: { $set: { enabled: Boolean(enabled) } } },
  }))
  await EmailSettings.bulkWrite(ops)

  res.json({ success: true, message: 'Settings updated' })
})

// ─── Templates ────────────────────────────────────────────────────────────────

// GET /api/v1/email/templates
export const getTemplates = asyncHandler(async (req, res) => {
  const templates = await EmailTemplate.find().select('-htmlBody').sort({ name: 1 }).lean()
  res.json({ success: true, data: templates })
})

// GET /api/v1/email/templates/:type
export const getTemplate = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findOne({ type: req.params.type }).lean()
  if (!template) throw new NotFoundError('Template not found')
  res.json({ success: true, data: template })
})

// PUT /api/v1/email/templates/:type
export const updateTemplate = asyncHandler(async (req, res) => {
  const { subject, htmlBody } = req.body
  if (!subject || !htmlBody) throw new BadRequestError('subject and htmlBody are required')

  const template = await EmailTemplate.findOneAndUpdate(
    { type: req.params.type },
    { subject, htmlBody, isCustomized: true },
    { new: true }
  )
  if (!template) throw new NotFoundError('Template not found')

  res.json({ success: true, message: 'Template updated', data: template })
})

// POST /api/v1/email/templates/:type/reset
export const resetTemplate = asyncHandler(async (req, res) => {
  const { DEFAULT_TEMPLATES } = await import('../utils/emailTemplates.js')
  const def = DEFAULT_TEMPLATES.find(t => t.type === req.params.type)
  if (!def) throw new NotFoundError('Default template not found')

  const template = await EmailTemplate.findOneAndUpdate(
    { type: req.params.type },
    { subject: def.subject, htmlBody: def.htmlBody, isCustomized: false },
    { new: true }
  )
  if (!template) throw new NotFoundError('Template not found')

  res.json({ success: true, message: 'Template reset to default', data: template })
})

// POST /api/v1/email/templates/reset-all
export const resetAllTemplates = asyncHandler(async (req, res) => {
  const { DEFAULT_TEMPLATES } = await import('../utils/emailTemplates.js')

  const ops = DEFAULT_TEMPLATES.map(t => ({
    updateOne: {
      filter: { type: t.type },
      update: { $set: { subject: t.subject, htmlBody: t.htmlBody, isCustomized: false } },
    },
  }))

  const result = await EmailTemplate.bulkWrite(ops)
  res.json({ success: true, message: `Reset ${result.modifiedCount} templates to default` })
})

// ─── Logs ─────────────────────────────────────────────────────────────────────

// GET /api/v1/email/logs
export const getLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, status, type, search } = req.query
  const filter = {}
  if (status) filter.status = status
  if (type) filter.type = type
  if (search) filter.to = { $regex: search, $options: 'i' }

  const skip = (Number(page) - 1) * Number(limit)
  const [logs, total] = await Promise.all([
    EmailLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    EmailLog.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: logs,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  })
})

// DELETE /api/v1/email/logs — admin: clear all logs
export const clearLogs = asyncHandler(async (req, res) => {
  const result = await EmailLog.deleteMany({})
  res.json({ success: true, message: `Deleted ${result.deletedCount} email log entries` })
})

// ─── Test email ───────────────────────────────────────────────────────────────

// POST /api/v1/email/test
export const sendTestEmail = asyncHandler(async (req, res) => {
  const { type, to } = req.body
  if (!type || !to) throw new BadRequestError('type and to are required')

  const template = await EmailTemplate.findOne({ type }).lean()
  if (!template) throw new NotFoundError('Template not found')

  const demoVars = DEMO_VARS[type] ?? template.variables.reduce((acc, v) => { acc[v] = `[${v}]`; return acc }, {})

  await sendEmail({ type, to, toName: 'Test Recipient', variables: demoVars, metadata: { isTest: true } })

  res.json({ success: true, message: `Test email sent to ${to}` })
})

// ─── Stats ────────────────────────────────────────────────────────────────────

// GET /api/v1/email/stats
export const getStats = asyncHandler(async (req, res) => {
  const [total, sent, failed, skipped] = await Promise.all([
    EmailLog.countDocuments(),
    EmailLog.countDocuments({ status: 'sent' }),
    EmailLog.countDocuments({ status: 'failed' }),
    EmailLog.countDocuments({ status: 'skipped' }),
  ])

  const recentByType = await EmailLog.aggregate([
    { $match: { status: 'sent' } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ])

  res.json({ success: true, data: { total, sent, failed, skipped, recentByType } })
})
