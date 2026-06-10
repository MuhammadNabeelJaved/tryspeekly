import asyncHandler from '../utils/asyncHandler.js'
import MonthlyFee from '../models/monthly-fee.model.js'
import Enrollment from '../models/enrollment.model.js'
import { emitToUser } from '../utils/socket.js'

const POPULATE_OPTS = [
  { path: 'student', select: 'name email' },
  { path: 'course',  select: 'title' },
]

// ─── POST /api/v1/monthly-fees ─────────────────────────────────────────────────
export const addFee = asyncHandler(async (req, res) => {
  try {
    const { enrollmentId, month, year, amount, currency, method, status, dueDate, paidDate, adminNote } = req.body

    if (!enrollmentId || !month || !year || amount === undefined) {
      return res.status(400).json({ success: false, error: { message: 'enrollmentId, month, year, and amount are required' } })
    }

    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment) return res.status(404).json({ success: false, error: { message: 'Enrollment not found' } })

    const fee = await MonthlyFee.create({
      enrollment: enrollmentId,
      student: enrollment.student,
      course: enrollment.course,
      month: Number(month),
      year: Number(year),
      amount: Number(amount),
      currency: currency || 'PKR',
      method: method || undefined,
      status: status || 'pending',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      paidDate: status === 'paid' && paidDate ? new Date(paidDate) : undefined,
      adminNote: adminNote || undefined,
      recordedBy: req.user.id,
    })

    const populated = await MonthlyFee.findById(fee._id).populate(POPULATE_OPTS)
    emitToUser(enrollment.student, 'monthly_fee_update', {})
    res.status(201).json({ success: true, message: 'Fee recorded', data: populated })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: { message: 'A fee record for this month already exists for this enrollment' } })
    }
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── POST /api/v1/monthly-fees/generate — bulk-create pending fee records ──────
export const generateFees = asyncHandler(async (req, res) => {
  try {
    const { enrollmentId, startMonth, startYear, months, amount, currency, dayOfMonth } = req.body

    if (!enrollmentId || !startMonth || !startYear || !months || amount === undefined) {
      return res.status(400).json({ success: false, error: { message: 'enrollmentId, startMonth, startYear, months, and amount are required' } })
    }

    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment) return res.status(404).json({ success: false, error: { message: 'Enrollment not found' } })

    const created = []
    const skipped = []
    let m = Number(startMonth)
    let y = Number(startYear)

    for (let i = 0; i < Math.min(Number(months), 60); i++) {
      const dueDate = dayOfMonth ? new Date(y, m - 1, Number(dayOfMonth)) : undefined
      try {
        const fee = await MonthlyFee.create({
          enrollment: enrollmentId,
          student: enrollment.student,
          course: enrollment.course,
          month: m,
          year: y,
          amount: Number(amount),
          currency: currency || 'PKR',
          status: 'pending',
          dueDate,
          recordedBy: req.user.id,
        })
        created.push(fee)
      } catch (err) {
        if (err.code === 11000) skipped.push(`${m}/${y}`)
        else throw err
      }
      m++
      if (m > 12) { m = 1; y++ }
    }

    if (created.length > 0) emitToUser(enrollment.student, 'monthly_fee_update', {})
    res.status(201).json({
      success: true,
      message: `Generated ${created.length} fee record(s)${skipped.length ? `, skipped ${skipped.length} (already existed)` : ''}`,
      data: { created, skipped },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── GET /api/v1/monthly-fees — admin list with filters ───────────────────────
export const getFees = asyncHandler(async (req, res) => {
  try {
    const { studentId, courseId, enrollmentId, month, year, status, page = 1, limit = 200 } = req.query
    const filter = {}
    if (studentId)    filter.student    = studentId
    if (courseId)     filter.course     = courseId
    if (enrollmentId) filter.enrollment = enrollmentId
    if (month)        filter.month      = Number(month)
    if (year)         filter.year       = Number(year)
    if (status && status !== 'all') filter.status = status

    const skip = (Number(page) - 1) * Number(limit)
    const [fees, total] = await Promise.all([
      MonthlyFee.find(filter).populate(POPULATE_OPTS).sort({ year: -1, month: -1 }).skip(skip).limit(Number(limit)),
      MonthlyFee.countDocuments(filter),
    ])

    res.json({ success: true, data: fees, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── PATCH /api/v1/monthly-fees/:id ───────────────────────────────────────────
export const updateFee = asyncHandler(async (req, res) => {
  try {
    const { amount, currency, method, status, dueDate, paidDate, adminNote } = req.body
    const fee = await MonthlyFee.findById(req.params.id)
    if (!fee) return res.status(404).json({ success: false, error: { message: 'Fee record not found' } })

    if (amount    !== undefined) fee.amount    = Number(amount)
    if (currency  !== undefined) fee.currency  = currency
    if (method    !== undefined) fee.method    = method || undefined
    if (status    !== undefined) fee.status    = status
    if (dueDate   !== undefined) fee.dueDate   = dueDate  ? new Date(dueDate)  : undefined
    if (paidDate  !== undefined) fee.paidDate  = paidDate ? new Date(paidDate) : undefined
    if (adminNote !== undefined) fee.adminNote = adminNote || undefined

    await fee.save()
    const populated = await MonthlyFee.findById(fee._id).populate(POPULATE_OPTS)
    emitToUser(fee.student, 'monthly_fee_update', {})
    res.json({ success: true, message: 'Fee updated', data: populated })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── DELETE /api/v1/monthly-fees/:id ──────────────────────────────────────────
export const deleteFee = asyncHandler(async (req, res) => {
  try {
    const fee = await MonthlyFee.findByIdAndDelete(req.params.id)
    if (!fee) return res.status(404).json({ success: false, error: { message: 'Fee record not found' } })
    emitToUser(fee.student, 'monthly_fee_update', {})
    res.json({ success: true, message: 'Fee record deleted' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── GET /api/v1/monthly-fees/my — student: own fees ─────────────────────────
export const getMyFees = asyncHandler(async (req, res) => {
  try {
    const fees = await MonthlyFee.find({ student: req.user.id })
      .populate('course', 'title level')
      .sort({ year: -1, month: -1 })
    res.json({ success: true, data: fees })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
