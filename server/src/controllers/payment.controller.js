import asyncHandler from '../utils/asyncHandler.js'
import Payment from '../models/payment.model.js'
import { uploadPaymentScreenshot, deleteFile, extractPublicId } from '../utils/cloudinary.js'
import Enrollment from '../models/enrollment.model.js'
import { createAndEmitNotification } from '../utils/notify.js'
import Course from '../models/course.model.js'
import Coupon from '../models/coupon.model.js'
import ReferralReward from '../models/referral-reward.model.js'
import ReferralWallet from '../models/referral-wallet.model.js'
import SiteSettings from '../models/site-settings.model.js'
import Offer from '../models/offer.model.js'
import { getEffectivePrice } from '../utils/offerUtils.js'

// POST /api/v1/payments — student submits payment proof
export const createPayment = asyncHandler(async (req, res) => {
  try {
    const { courseId, teacherId, method, transactionId, amount, currency, couponCode } = req.body

    if (!req.file) return res.status(400).json({ success: false, error: { message: 'Payment screenshot is required' } })

    const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId }).populate('payment', 'status')
    if (!enrollment) return res.status(404).json({ success: false, error: { message: 'Enrollment not found for this course' } })
    if (enrollment.payment && enrollment.payment.status === 'pending') {
      return res.status(409).json({ success: false, error: { message: 'A payment is already under review for this course' } })
    }

    const result = await uploadPaymentScreenshot(req.file.buffer, Date.now())

    let couponDoc = null
    let discountApplied = 0
    let offerDiscountApplied = 0
    let offerDoc = null

    const course = await Course.findById(courseId)
    const coursePrice = course ? (course.currency === 'USD' ? course.priceUSD : course.price) : 0

    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase().trim() })
      const isExpired = couponDoc?.expiresAt && couponDoc.expiresAt < new Date()
      const isExhausted = couponDoc?.maxUses != null && couponDoc.usedCount >= couponDoc.maxUses
      if (couponDoc && couponDoc.isActive && !isExpired && !isExhausted) {
        if (coursePrice && Number.isFinite(coursePrice)) {
          if (couponDoc.discountType === 'percentage') {
            discountApplied = Math.round((coursePrice * couponDoc.discountValue) / 100)
          } else {
            discountApplied = Math.min(couponDoc.discountValue, coursePrice)
          }
        }
      }
    }

    // ─── Apply active offer discount ──────────────────────────────────────────
    const now = new Date()
    const activeOffers = await Offer.find({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    }).lean()

    if (course && coursePrice) {
      const { discountedPrice, offer } = getEffectivePrice(courseId, coursePrice, activeOffers)
      if (offer) {
        offerDiscountApplied = coursePrice - discountedPrice
        offerDoc = offer
      }
    }

    const payment = await Payment.create({
      student: req.user.id,
      course: courseId,
      teacher: teacherId,
      method,
      transactionId,
      screenshotUrl: result.secure_url,
      amount,
      currency: currency || 'PKR',
      coupon: couponDoc ? couponDoc._id : null,
      discountApplied: discountApplied + offerDiscountApplied,
      offerDiscountApplied,
      offer: offerDoc ? offerDoc._id : null,
    })

    await Enrollment.findByIdAndUpdate(enrollment._id, { payment: payment._id })

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

    const enrollments = await Enrollment.find({ student: req.user.id }).select('course isActive')
    const enrollmentMap = {}
    enrollments.forEach(e => { enrollmentMap[e.course.toString()] = e.isActive })

    const data = payments.map(p => ({
      ...p.toObject(),
      enrollmentActive: enrollmentMap[p.course._id.toString()] ?? false,
    }))

    res.json({ success: true, data })
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

    const enrollmentDocs = await Enrollment.find({
      student: { $in: payments.map(p => p.student._id) },
      course: { $in: payments.map(p => p.course._id) },
    }).select('student course isActive')

    const enrollmentMap = {}
    enrollmentDocs.forEach(e => { enrollmentMap[`${e.student}_${e.course}`] = e.isActive })

    const data = payments.map(p => ({
      ...p.toObject(),
      enrollmentActive: enrollmentMap[`${p.student._id}_${p.course._id}`] ?? false,
    }))

    res.json({
      success: true,
      data,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/payments/:id/approve — admin (can approve from any status)
export const approvePayment = asyncHandler(async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('course', 'title price priceUSD currency')
    if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } })

    const previousStatus = payment.status
    payment.status = 'approved'
    payment.adminNote = req.body.adminNote || ''
    payment.rejectionReason = ''
    await payment.save()

    // ─── Referral reward crediting ────────────────────────────────────────────
    if (payment.coupon) {
      const coupon = await Coupon.findById(payment.coupon)
      if (coupon && coupon.source === 'referral' && coupon.referrer) {
        const alreadyRewarded = await ReferralReward.findOne({ payment: payment._id })
        if (!alreadyRewarded) {
          const settings = await SiteSettings.findOne()
          const referral = settings?.referral

          if (referral?.enabled) {
            const course = payment.course
            const courseId = course._id
            const coursePrice = course.currency === 'USD' ? (course.priceUSD || 0) : (course.price || 0)

            let rewardAmount = 0
            if (referral.referrerRewardType === 'percentage') {
              rewardAmount = Math.round((coursePrice * referral.referrerRewardValue) / 100)
            } else {
              rewardAmount = referral.referrerRewardValue
            }

            const enrollment = await Enrollment.findOne({ student: payment.student, course: courseId })
            if (!enrollment) return

            await ReferralReward.create({
              referrer: coupon.referrer,
              referee: payment.student,
              coupon: coupon._id,
              course: courseId,
              enrollment: enrollment?._id,
              payment: payment._id,
              discountGiven: payment.discountApplied || 0,
              rewardAmount,
              status: 'credited',
              creditedAt: new Date(),
            })

            await ReferralWallet.findOneAndUpdate(
              { student: coupon.referrer },
              {
                $inc: { balance: rewardAmount, totalEarned: rewardAmount },
                $push: {
                  transactions: {
                    type: 'credit',
                    amount: rewardAmount,
                    description: `Referral reward for ${course?.title || 'a course'}`,
                    date: new Date(),
                  },
                },
              },
              { upsert: true, new: true }
            )

            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })
          }
        }
      }
    }

    await Enrollment.findOneAndUpdate(
      { student: payment.student, course: payment.course._id },
      { isActive: true }
    )

    if (previousStatus !== 'approved') {
      await createAndEmitNotification({
        recipientId: payment.student,
        title: 'Payment Approved',
        message: `Your payment for "${payment.course.title}" has been approved. You now have full access.`,
        type: 'payment',
        severity: 'low',
        relatedId: payment._id,
        relatedType: 'Payment',
      })
    }

    res.json({ success: true, message: 'Payment approved', data: payment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/payments/:id/reject — admin (can reject from any status)
export const rejectPayment = asyncHandler(async (req, res) => {
  try {
    const { rejectionReason } = req.body
    if (!rejectionReason) return res.status(400).json({ success: false, error: { message: 'Rejection reason is required' } })

    const payment = await Payment.findById(req.params.id).populate('course', 'title')
    if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } })

    const previousStatus = payment.status
    payment.status = 'rejected'
    payment.rejectionReason = rejectionReason
    payment.adminNote = ''
    await payment.save()

    // Deactivate enrollment when rejecting an approved payment
    if (previousStatus === 'approved') {
      await Enrollment.findOneAndUpdate(
        { student: payment.student, course: payment.course._id },
        { isActive: false }
      )
    }

    if (previousStatus !== 'rejected') {
      await createAndEmitNotification({
        recipientId: payment.student,
        title: 'Payment Rejected',
        message: `Your payment for "${payment.course.title}" was rejected: ${rejectionReason}. Please resubmit your payment proof.`,
        type: 'payment',
        severity: 'medium',
        relatedId: payment._id,
        relatedType: 'Payment',
      })
    }

    res.json({ success: true, message: 'Payment rejected', data: payment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/payments/admin — admin manually creates a payment record
export const adminCreatePayment = asyncHandler(async (req, res) => {
  try {
    const { studentId, courseId, teacherId, method, transactionId, amount, currency, adminNote } = req.body

    if (!studentId || !courseId || !teacherId || !method || !amount) {
      return res.status(400).json({ success: false, error: { message: 'studentId, courseId, teacherId, method, and amount are required' } })
    }

    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId })
    if (!enrollment) return res.status(404).json({ success: false, error: { message: 'Enrollment not found for this student and course' } })

    const payment = await Payment.create({
      student: studentId,
      course: courseId,
      teacher: teacherId,
      method,
      transactionId: transactionId || '',
      amount,
      currency: currency || 'PKR',
      adminNote: adminNote || '',
    })

    await Enrollment.findByIdAndUpdate(enrollment._id, { payment: payment._id })

    const populated = await Payment.findById(payment._id)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('teacher', 'name')

    res.status(201).json({ success: true, message: 'Payment record created', data: populated })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
