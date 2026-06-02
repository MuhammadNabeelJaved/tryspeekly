import mongoose from 'mongoose'
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
import User from '../models/user.model.js'
import { sendEmail } from '../utils/email.js'

const METHOD_LABELS = {
  jazzcash: 'JazzCash', easypaisa: 'EasyPaisa', nayapay: 'NayaPay',
  sadapay: 'SadaPay', zindigi: 'Zindigi', bank_local: 'Bank (Local)', bank_international: 'Bank (Intl)',
}

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
    const isResubmission = enrollment.payment && enrollment.payment.status === 'rejected'

    const result = await uploadPaymentScreenshot(req.file.buffer, Date.now())

    let couponDoc = null
    let discountApplied = enrollment.discountApplied || 0
    let offerDiscountApplied = enrollment.offerDiscountApplied || 0
    let offerDoc = null

    const course = await Course.findById(courseId)
    const coursePrice = course ? (course.currency === 'USD' ? course.priceUSD : course.price) : 0

    if (enrollment.coupon) {
      couponDoc = await Coupon.findById(enrollment.coupon)
    } else if (couponCode) {
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
      } else {
        couponDoc = null // reset if invalid
      }
    }

    // ─── Apply active offer discount ──────────────────────────────────────────
    if (enrollment.offer) {
      offerDoc = await Offer.findById(enrollment.offer)
    } else {
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

    // Email: payment submitted / resubmitted
    const student = await User.findById(req.user.id, 'name email').lean()
    if (student) {
      const emailType = isResubmission ? 'payment_resubmitted' : 'payment_submitted'
      sendEmail({
        type: emailType,
        to: student.email,
        toName: student.name,
        variables: {
          studentName: student.name,
          courseName: course?.title ?? 'your course',
          amount: amount,
          currency: currency || 'PKR',
          method: METHOD_LABELS[method] ?? method,
        },
        metadata: { paymentId: payment._id, isResubmission },
      }).catch(() => {})
    }

    res.status(201).json({ success: true, message: 'Payment submitted. Awaiting admin approval.', data: payment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/payments/my — student: own payments
export const getMyPayments = asyncHandler(async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user.id })
      .populate('course', 'title price priceUSD currency pricingType')
      .populate('teacher', 'name')
      .populate('coupon', 'code source')
      .sort({ createdAt: -1 })

    const enrollments = await Enrollment.find({ student: req.user.id }).select('course isActive')
    const enrollmentMap = {}
    enrollments.forEach(e => { if (e.course) enrollmentMap[e.course.toString()] = e.isActive })

    const data = payments.map(p => ({
      ...p.toObject(),
      // p.course can be null if the course was deleted (populate returns null)
      enrollmentActive: p.course ? (enrollmentMap[p.course._id.toString()] ?? false) : false,
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
      Payment.find(filter).populate('student', 'name email').populate('course', 'title').populate('teacher', 'name').populate('coupon', 'code source').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Payment.countDocuments(filter),
    ])

    const validPayments = payments.filter(p => p.student && p.course)

    const enrollmentDocs = await Enrollment.find({
      student: { $in: validPayments.map(p => p.student._id) },
      course: { $in: validPayments.map(p => p.course._id) },
    }).select('student course isActive')

    const enrollmentMap = {}
    enrollmentDocs.forEach(e => { enrollmentMap[`${e.student}_${e.course}`] = e.isActive })

    const data = payments.map(p => ({
      ...p.toObject(),
      enrollmentActive: p.student && p.course
        ? (enrollmentMap[`${p.student._id}_${p.course._id}`] ?? false)
        : false,
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

    // ─── Sync payment.coupon from enrollment if missing ──────────────────────
    if (!payment.coupon) {
      const enrollmentForSync = await Enrollment.findOne({ student: payment.student, course: payment.course._id })
      if (enrollmentForSync?.coupon) {
        await Payment.findByIdAndUpdate(payment._id, { coupon: enrollmentForSync.coupon })
        payment.coupon = enrollmentForSync.coupon
      }
    }

    // ─── Coupon usedCount + Referral reward crediting ────────────────────────
    if (payment.coupon) {
      const coupon = await Coupon.findById(payment.coupon)
      if (coupon) {
        // Increment usedCount for all coupon types on approval
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })

        // Credit referral reward only for referral coupons
        if (coupon.source === 'referral' && coupon.referrer) {
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
              if (enrollment) {
                await ReferralReward.create({
                  referrer: coupon.referrer,
                  referee: payment.student,
                  coupon: coupon._id,
                  course: courseId,
                  enrollment: enrollment._id,
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
              }
            }
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

      // Email: payment approved
      const student = await User.findById(payment.student, 'name email').lean()
      if (student) {
        sendEmail({
          type: 'payment_approved',
          to: student.email,
          toName: student.name,
          variables: {
            studentName: student.name,
            courseName: payment.course.title,
            amount: payment.amount,
            currency: payment.currency,
            adminNote: payment.adminNote || 'None',
            dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`,
          },
          metadata: { paymentId: payment._id },
        }).catch(() => {})
      }
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

      // Email: payment rejected
      const student = await User.findById(payment.student, 'name email').lean()
      if (student) {
        sendEmail({
          type: 'payment_rejected',
          to: student.email,
          toName: student.name,
          variables: {
            studentName: student.name,
            courseName: payment.course.title,
            rejectionReason,
            adminNote: payment.adminNote || 'None',
            dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`,
          },
          metadata: { paymentId: payment._id },
        }).catch(() => {})
      }
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

// DELETE /api/v1/payments/:id — admin: hard-delete single payment
export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
  if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } })

  if (payment.screenshotUrl) {
    const publicId = extractPublicId(payment.screenshotUrl)
    if (publicId) await deleteFile(publicId, 'image')
  }

  if (req.query.deactivateEnrollment === 'true') {
    await Enrollment.updateMany({ payment: payment._id }, { isActive: false })
  }

  await Payment.deleteOne({ _id: payment._id })

  res.json({ success: true, message: 'Payment deleted' })
})

// DELETE /api/v1/payments/bulk — admin: hard-delete multiple payments
export const bulkDeletePayments = asyncHandler(async (req, res) => {
  const { ids, deactivateEnrollments = false } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: { message: 'ids must be a non-empty array' } })
  }
  if (ids.length > 100) {
    return res.status(400).json({ success: false, error: { message: 'Cannot delete more than 100 payments at once' } })
  }

  const validIds = ids.filter(id => mongoose.isValidObjectId(id))
  const payments = await Payment.find({ _id: { $in: validIds } })

  const successfulIds = []
  const results = await Promise.allSettled(
    payments.map(async (payment) => {
      if (payment.screenshotUrl) {
        const publicId = extractPublicId(payment.screenshotUrl)
        if (publicId) await deleteFile(publicId, 'image')
      }
      await Payment.deleteOne({ _id: payment._id })
      successfulIds.push(payment._id)
      return true
    })
  )

  if (deactivateEnrollments && successfulIds.length > 0) {
    await Enrollment.updateMany({ payment: { $in: successfulIds } }, { isActive: false })
  }

  const deleted = results.filter(r => r.status === 'fulfilled' && r.value === true).length

  res.json({
    success: true,
    message: `${deleted} payment${deleted !== 1 ? 's' : ''} deleted`,
    data: { deleted },
  })
})

// POST /api/v1/payments/admin/direct-approve — admin: create payment + immediately approve (for WhatsApp payments)
export const directApprovePayment = asyncHandler(async (req, res) => {
  try {
    const { enrollmentId, method, transactionId, amount, currency, adminNote } = req.body

    if (!enrollmentId || !method || !amount) {
      return res.status(400).json({ success: false, error: { message: 'enrollmentId, method, and amount are required' } })
    }

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course', 'title price priceUSD currency')
    if (!enrollment) return res.status(404).json({ success: false, error: { message: 'Enrollment not found' } })
    if (enrollment.payment) return res.status(409).json({ success: false, error: { message: 'A payment record already exists for this enrollment' } })

    const payment = await Payment.create({
      student: enrollment.student,
      course: enrollment.course._id,
      teacher: enrollment.teacher,
      method,
      transactionId: transactionId || '',
      amount: Number(amount),
      currency: currency || 'PKR',
      status: 'approved',
      adminNote: adminNote || 'Approved by admin (WhatsApp / direct verification)',
      coupon: enrollment.coupon || null,
      discountApplied: enrollment.discountApplied || 0,
      offerDiscountApplied: enrollment.offerDiscountApplied || 0,
      offer: enrollment.offer || null,
    })

    await Enrollment.findByIdAndUpdate(enrollment._id, { payment: payment._id, isActive: true })

    // ─── Coupon usedCount + Referral reward crediting ────────────────────────
    if (payment.coupon) {
      const coupon = await Coupon.findById(payment.coupon)
      if (coupon) {
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })
        if (coupon.source === 'referral' && coupon.referrer) {
          const alreadyRewarded = await ReferralReward.findOne({ payment: payment._id })
          if (!alreadyRewarded) {
            const settings = await SiteSettings.findOne()
            const referral = settings?.referral
            if (referral?.enabled) {
              const course = enrollment.course
              const coursePrice = course.currency === 'USD' ? (course.priceUSD || 0) : (course.price || 0)
              let rewardAmount = 0
              if (referral.referrerRewardType === 'percentage') {
                rewardAmount = Math.round((coursePrice * referral.referrerRewardValue) / 100)
              } else {
                rewardAmount = referral.referrerRewardValue
              }
              await ReferralReward.create({
                referrer: coupon.referrer,
                referee: enrollment.student,
                coupon: coupon._id,
                course: course._id,
                enrollment: enrollment._id,
                payment: payment._id,
                discountGiven: enrollment.discountApplied || 0,
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
            }
          }
        }
      }
    }

    await createAndEmitNotification({
      recipientId: enrollment.student,
      title: 'Payment Approved',
      message: `Your payment for "${enrollment.course.title}" has been approved. You now have full access.`,
      type: 'payment',
      severity: 'low',
      relatedId: payment._id,
      relatedType: 'Payment',
    })

    const student = await User.findById(enrollment.student, 'name email').lean()
    if (student) {
      sendEmail({
        type: 'payment_approved',
        to: student.email,
        toName: student.name,
        variables: {
          studentName: student.name,
          courseName: enrollment.course.title,
          amount: payment.amount,
          currency: payment.currency,
          adminNote: payment.adminNote,
          dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`,
        },
        metadata: { paymentId: payment._id },
      }).catch(() => {})
    }

    const populated = await Payment.findById(payment._id)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('teacher', 'name')

    res.status(201).json({ success: true, message: 'Payment approved and course access granted', data: populated })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/payments/:id/reprocess-referral — admin: retroactively credit referral reward
export const reprocessReferralReward = asyncHandler(async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('course', 'title price priceUSD currency')
    if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } })
    if (payment.status !== 'approved') {
      return res.status(400).json({ success: false, error: { message: 'Payment must be approved before processing referral reward' } })
    }

    // Sync coupon from enrollment if missing on payment
    let couponId = payment.coupon
    const enrollment = await Enrollment.findOne({ student: payment.student, course: payment.course._id })
    if (!couponId && enrollment?.coupon) {
      couponId = enrollment.coupon
      await Payment.findByIdAndUpdate(payment._id, { coupon: enrollment.coupon })
    }

    if (!couponId) {
      return res.status(400).json({ success: false, error: { message: 'No coupon found on this payment or its enrollment' } })
    }

    const coupon = await Coupon.findById(couponId)
    if (!coupon) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } })
    if (coupon.source !== 'referral' || !coupon.referrer) {
      return res.status(400).json({ success: false, error: { message: 'Coupon is not a referral coupon' } })
    }

    const alreadyRewarded = await ReferralReward.findOne({ payment: payment._id })
    if (alreadyRewarded) {
      return res.json({ success: true, message: 'Referral reward was already processed', data: { alreadyProcessed: true } })
    }

    const settings = await SiteSettings.findOne()
    const referral = settings?.referral
    if (!referral?.enabled) {
      return res.status(400).json({ success: false, error: { message: 'Referral system is currently disabled' } })
    }

    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })

    const course = payment.course
    const coursePrice = course.currency === 'USD' ? (course.priceUSD || 0) : (course.price || 0)
    let rewardAmount = 0
    if (referral.referrerRewardType === 'percentage') {
      rewardAmount = Math.round((coursePrice * referral.referrerRewardValue) / 100)
    } else {
      rewardAmount = referral.referrerRewardValue
    }

    if (!enrollment) {
      return res.status(404).json({ success: false, error: { message: 'Enrollment not found' } })
    }

    await ReferralReward.create({
      referrer: coupon.referrer,
      referee: payment.student,
      coupon: coupon._id,
      course: course._id,
      enrollment: enrollment._id,
      payment: payment._id,
      discountGiven: payment.discountApplied || enrollment.discountApplied || 0,
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

    res.json({
      success: true,
      message: `Referral reward of ${course.currency} ${rewardAmount} credited to referrer`,
      data: { rewardAmount },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
