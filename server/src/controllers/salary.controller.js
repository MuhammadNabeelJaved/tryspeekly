import asyncHandler from '../utils/asyncHandler.js'
import { BadRequestError, NotFoundError, ConflictError } from '../utils/apiErrors.js'
import SalaryPackage from '../models/salary-package.model.js'
import SalaryPayment from '../models/salary-payment.model.js'
import User from '../models/user.model.js'
import { createAndEmitNotification } from '../utils/notify.js'

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

// ─── Package Handlers ─────────────────────────────────────────────────────────

// GET /api/v1/salaries — admin: list all salary packages
export const getAllPackages = asyncHandler(async (req, res) => {
  const packages = await SalaryPackage.find()
    .populate('teacher', 'name email profileImage')
    .sort({ createdAt: -1 })

  res.json({ success: true, data: packages })
})

// POST /api/v1/salaries — admin: create a salary package
export const createPackage = asyncHandler(async (req, res) => {
  const { teacher, amount, type, customType, startDate, endDate, status, notes } = req.body

  if (!teacher || !amount || !type || !startDate) {
    throw new BadRequestError('teacher, amount, type, and startDate are required')
  }

  const teacherUser = await User.findById(teacher)
  if (!teacherUser || teacherUser.role !== 'teacher') {
    throw new NotFoundError('Teacher not found')
  }

  const existing = await SalaryPackage.findOne({ teacher })
  if (existing) {
    throw new ConflictError('A salary package already exists for this teacher')
  }

  const packageData = {
    teacher,
    amount,
    type,
    startDate,
  }

  if (type === 'custom' && customType !== undefined) {
    packageData.customType = customType
  }
  if (endDate !== undefined) packageData.endDate = endDate
  if (status !== undefined) packageData.status = status
  if (notes !== undefined) packageData.notes = notes

  const pkg = await SalaryPackage.create(packageData)
  await pkg.populate('teacher', 'name email profileImage')

  res.status(201).json({ success: true, message: 'Salary package created', data: pkg })
})

// PATCH /api/v1/salaries/:id — admin: update a salary package
export const updatePackage = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('Salary package not found')

  const { amount, type, customType, startDate, endDate, status, notes } = req.body

  if (amount !== undefined) pkg.amount = amount
  if (startDate !== undefined) pkg.startDate = startDate
  if (endDate !== undefined) pkg.endDate = endDate
  if (status !== undefined) pkg.status = status
  if (notes !== undefined) pkg.notes = notes

  if (type !== undefined) {
    pkg.type = type
    if (type === 'custom') {
      if (customType !== undefined) pkg.customType = customType
    } else {
      pkg.customType = undefined
    }
  }

  await pkg.save()
  await pkg.populate('teacher', 'name email profileImage')

  res.json({ success: true, message: 'Salary package updated', data: pkg })
})

// DELETE /api/v1/salaries/:id — admin: delete package and cascade payments
export const deletePackage = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('Salary package not found')

  await SalaryPayment.deleteMany({ package: pkg._id })
  await pkg.deleteOne()

  res.json({ success: true, message: 'Salary package and all payments deleted' })
})

// ─── Payment Handlers ─────────────────────────────────────────────────────────

// GET /api/v1/salaries/:id/payments — admin: list payments for a package
export const getPackagePayments = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('Salary package not found')

  const payments = await SalaryPayment.find({ package: pkg._id }).sort({ periodStart: -1 })

  res.json({ success: true, data: payments })
})

// POST /api/v1/salaries/:id/payments — admin: add a payment record
export const addPayment = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findById(req.params.id)
  if (!pkg) throw new NotFoundError('Salary package not found')

  const { amount, periodLabel, periodStart, periodEnd, status, paidDate, notes, paymentMethod } = req.body

  if (!amount || !periodStart) {
    throw new BadRequestError('amount and periodStart are required')
  }

  const paymentData = {
    package: pkg._id,
    teacher: pkg.teacher,
    amount,
    periodStart,
  }

  if (periodLabel !== undefined) paymentData.periodLabel = periodLabel
  if (periodEnd !== undefined) paymentData.periodEnd = periodEnd
  if (status !== undefined) paymentData.status = status
  if (notes !== undefined) paymentData.notes = notes
  if (paymentMethod !== undefined) paymentData.paymentMethod = paymentMethod

  if (status === 'paid') {
    paymentData.paidDate = paidDate !== undefined ? paidDate : new Date()
  }

  const payment = await SalaryPayment.create(paymentData)

  if (status === 'paid') {
    await createAndEmitNotification({
      recipientId: pkg.teacher,
      title: 'Salary Payment Received',
      message: `Your salary of ₨${amount} for ${periodLabel || formatPeriod(periodStart, periodEnd)} has been paid via ${paymentMethod || 'bank transfer'}.`,
      type: 'salary_payment',
      severity: 'low',
      relatedId: payment._id,
      relatedType: 'SalaryPayment',
    })
  }

  res.status(201).json({ success: true, message: 'Payment record added', data: payment })
})

// PATCH /api/v1/salaries/:id/payments/:paymentId — admin: update a payment
export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await SalaryPayment.findOne({
    _id: req.params.paymentId,
    package: req.params.id,
  })
  if (!payment) throw new NotFoundError('Payment record not found')

  const { amount, periodLabel, periodStart, periodEnd, status, paidDate, notes, paymentMethod } = req.body
  const wasNotPaid = payment.status !== 'paid'

  if (amount !== undefined) payment.amount = amount
  if (periodLabel !== undefined) payment.periodLabel = periodLabel
  if (periodStart !== undefined) payment.periodStart = periodStart
  if (periodEnd !== undefined) payment.periodEnd = periodEnd
  if (notes !== undefined) payment.notes = notes
  if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod

  if (status !== undefined) {
    payment.status = status
    if (status === 'paid') {
      payment.paidDate = paidDate !== undefined ? paidDate : new Date()
    } else {
      payment.paidDate = undefined
    }
  }

  await payment.save()

  if (status === 'paid' && wasNotPaid) {
    const pkg = await SalaryPackage.findById(payment.package)
    if (pkg) {
      await createAndEmitNotification({
        recipientId: pkg.teacher,
        title: 'Salary Payment Received',
        message: `Your salary of ₨${payment.amount} for ${payment.periodLabel || formatPeriod(payment.periodStart, payment.periodEnd)} has been paid via ${payment.paymentMethod || 'bank transfer'}.`,
        type: 'salary_payment',
        severity: 'low',
        relatedId: payment._id,
        relatedType: 'SalaryPayment',
      })
    }
  }

  res.json({ success: true, message: 'Payment record updated', data: payment })
})

// DELETE /api/v1/salaries/:id/payments/:paymentId — admin: delete a payment
export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await SalaryPayment.findOne({
    _id: req.params.paymentId,
    package: req.params.id,
  })
  if (!payment) throw new NotFoundError('Payment record not found')

  await payment.deleteOne()

  res.json({ success: true, message: 'Payment record deleted' })
})

// ─── Teacher Self-Service ──────────────────────────────────────────────────────

// GET /api/v1/salaries/my — teacher: view own package and payments
export const getMyPackage = asyncHandler(async (req, res) => {
  const pkg = await SalaryPackage.findOne({ teacher: req.user.id }).populate(
    'teacher',
    'name email profileImage'
  )

  if (!pkg) {
    return res.json({ success: true, data: { package: null, payments: [] } })
  }

  const payments = await SalaryPayment.find({ package: pkg._id }).sort({ periodStart: -1 })

  res.json({ success: true, data: { package: pkg, payments } })
})
