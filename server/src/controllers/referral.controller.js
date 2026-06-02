import asyncHandler from '../utils/asyncHandler.js'
import Coupon from '../models/coupon.model.js'
import ReferralReward from '../models/referral-reward.model.js'
import ReferralWallet from '../models/referral-wallet.model.js'
import PayoutRequest from '../models/payout-request.model.js'
import SiteSettings from '../models/site-settings.model.js'
import Course from '../models/course.model.js'
import Enrollment from '../models/enrollment.model.js'
import Payment from '../models/payment.model.js'
import User from '../models/user.model.js'
import { sendEmail } from '../utils/email.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(userId) {
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `REF-${userId.toString().slice(-4).toUpperCase()}-${suffix}`
}

// Scan for approved referral payments that were never rewarded and fix them silently
async function autoProcessMissingRewards(referrerId, referralSettings) {
  if (!referralSettings?.enabled) return

  const coupons = await Coupon.find({ source: 'referral', referrer: referrerId })
  if (!coupons.length) return

  const couponIds = coupons.map(c => c._id)

  // Enrollments are the authoritative source — the coupon is stored there even if missing on payment
  const enrollments = await Enrollment.find({ coupon: { $in: couponIds } })
    .populate('course', 'title price priceUSD currency')

  for (const enrollment of enrollments) {
    if (!enrollment.payment) continue

    const payment = await Payment.findById(enrollment.payment)
    if (!payment || payment.status !== 'approved') continue

    const alreadyRewarded = await ReferralReward.findOne({ payment: payment._id })
    if (alreadyRewarded) continue

    // Sync missing coupon onto payment document
    if (!payment.coupon) {
      await Payment.findByIdAndUpdate(payment._id, {
        coupon: enrollment.coupon,
        discountApplied: payment.discountApplied || enrollment.discountApplied || 0,
      })
    }

    const coupon = coupons.find(c => c._id.toString() === enrollment.coupon.toString())
    if (!coupon) continue

    const course = enrollment.course
    const coursePrice = course.currency === 'USD' ? (course.priceUSD || 0) : (course.price || 0)
    let rewardAmount = 0
    if (referralSettings.referrerRewardType === 'percentage') {
      rewardAmount = Math.round((coursePrice * referralSettings.referrerRewardValue) / 100)
    } else {
      rewardAmount = referralSettings.referrerRewardValue
    }

    await ReferralReward.create({
      referrer: referrerId,
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
      { student: referrerId },
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

const MONTHLY_CODE_LIMIT = 5

// ─── Student: Generate referral code ─────────────────────────────────────────
export const generateReferralCode = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.body

    const settings = await SiteSettings.findOne()
    if (!settings?.referral?.enabled) {
      return res.status(400).json({ success: false, error: { message: 'Referral system is currently disabled' } })
    }

    if (courseId) {
      const course = await Course.findById(courseId)
      if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    }

    // Idempotent: return existing code if already generated (doesn't count against monthly limit)
    const existing = await Coupon.findOne({
      source: 'referral',
      referrer: req.user.id,
      course: courseId || null,
    }).populate('course', 'title')

    if (existing) {
      const shareUrl = courseId
        ? `${process.env.CLIENT_URL}/courses/${courseId}?coupon=${existing.code}`
        : `${process.env.CLIENT_URL}/courses?coupon=${existing.code}`
      return res.json({ success: true, data: { coupon: existing, shareUrl } })
    }

    // ─── Monthly limit check ─────────────────────────────────────────────────
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const thisMonthCount = await Coupon.countDocuments({
      source: 'referral',
      referrer: req.user.id,
      createdAt: { $gte: startOfMonth },
    })
    if (thisMonthCount >= MONTHLY_CODE_LIMIT) {
      const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
      return res.status(400).json({
        success: false,
        error: { message: `Monthly limit reached — you can only generate ${MONTHLY_CODE_LIMIT} referral codes in ${monthName}. You've used all ${MONTHLY_CODE_LIMIT}.` },
      })
    }

    const { refereeDiscountType, refereeDiscountValue } = settings.referral

    const coupon = await Coupon.create({
      code: generateCode(req.user.id),
      source: 'referral',
      discountType: refereeDiscountType,
      discountValue: refereeDiscountValue,
      scope: courseId ? 'course' : 'platform',
      course: courseId || null,
      maxUses: null,
      expiresAt: null,
      createdBy: req.user.id,
      referrer: req.user.id,
    })

    const shareUrl = courseId
      ? `${process.env.CLIENT_URL}/courses/${courseId}?coupon=${coupon.code}`
      : `${process.env.CLIENT_URL}/courses?coupon=${coupon.code}`

    res.status(201).json({ success: true, message: 'Referral code generated', data: { coupon, shareUrl } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Get my referral codes (active/non-expired only) ────────────────
export const getMyReferralCodes = asyncHandler(async (req, res) => {
  try {
    const now = new Date()
    const coupons = await Coupon.find({
      source: 'referral',
      referrer: req.user.id,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })

    const settings = await SiteSettings.findOne()
    const clientUrl = process.env.CLIENT_URL || ''

    const data = coupons.map(c => ({
      ...c.toObject(),
      shareUrl: c.course
        ? `${clientUrl}/courses/${c.course._id}?coupon=${c.code}`
        : `${clientUrl}/courses?coupon=${c.code}`,
    }))

    res.json({ success: true, data: { coupons: data, referralSettings: settings?.referral || {} } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Get my code stats + full history ────────────────────────────────
export const getMyCodeStats = asyncHandler(async (req, res) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const clientUrl = process.env.CLIENT_URL || ''

    const allCodes = await Coupon.find({ source: 'referral', referrer: req.user.id })
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })

    const thisMonthCount = allCodes.filter(c => new Date(c.createdAt) >= startOfMonth).length
    const remaining = Math.max(0, MONTHLY_CODE_LIMIT - thisMonthCount)

    const data = allCodes.map(c => ({
      ...c.toObject(),
      isExpired: !!(c.expiresAt && c.expiresAt < now),
      shareUrl: c.course
        ? `${clientUrl}/courses/${c.course._id}?coupon=${c.code}`
        : `${clientUrl}/courses?coupon=${c.code}`,
    }))

    res.json({
      success: true,
      data: {
        codes: data,
        monthlyLimit: MONTHLY_CODE_LIMIT,
        thisMonthCount,
        remaining,
        currentMonth: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Get my reward history ──────────────────────────────────────────
export const getMyRewards = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const settings = await SiteSettings.findOne()
    await autoProcessMissingRewards(req.user.id, settings?.referral)

    const [rewards, total] = await Promise.all([
      ReferralReward.find({ referrer: req.user.id })
        .populate('referee', 'name')
        .populate('course', 'title')
        .populate('coupon', 'code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReferralReward.countDocuments({ referrer: req.user.id }),
    ])

    res.json({
      success: true,
      data: rewards,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Get my wallet ───────────────────────────────────────────────────
export const getMyWallet = asyncHandler(async (req, res) => {
  try {
    const settings = await SiteSettings.findOne()

    // Auto-detect and fix any approved referral payments that were never rewarded
    await autoProcessMissingRewards(req.user.id, settings?.referral)

    let wallet = await ReferralWallet.findOne({ student: req.user.id })
    if (!wallet) {
      wallet = { student: req.user.id, balance: 0, totalEarned: 0, totalPaidOut: 0, transactions: [] }
    }

    const pendingPayout = await PayoutRequest.findOne({ student: req.user.id, status: 'pending' })

    res.json({ success: true, data: { wallet, pendingPayout: pendingPayout || null } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Get my payout history ──────────────────────────────────────────
export const getMyPayoutHistory = asyncHandler(async (req, res) => {
  try {
    const requests = await PayoutRequest.find({ student: req.user.id })
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, data: requests })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Request payout ──────────────────────────────────────────────────
export const createPayoutRequest = asyncHandler(async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || Number(amount) < 1) {
      return res.status(400).json({ success: false, error: { message: 'Amount must be at least 1' } })
    }

    const wallet = await ReferralWallet.findOne({ student: req.user.id })
    if (!wallet || wallet.balance < Number(amount)) {
      return res.status(400).json({ success: false, error: { message: 'Insufficient wallet balance' } })
    }

    const pendingExists = await PayoutRequest.findOne({ student: req.user.id, status: 'pending' })
    if (pendingExists) {
      return res.status(409).json({ success: false, error: { message: 'You already have a pending payout request' } })
    }

    const payoutRequest = await PayoutRequest.create({
      student: req.user.id,
      wallet: wallet._id,
      amount: Number(amount),
    })

    res.status(201).json({ success: true, message: 'Payout request submitted', data: { payoutRequest } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Public: Get referral settings ───────────────────────────────────────────
export const getPublicSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await SiteSettings.findOne()
    res.json({ success: true, data: settings?.referral || { enabled: false } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: List all referral rewards ────────────────────────────────────────
export const getAllRewards = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = status ? { status } : {}
    const skip = (Number(page) - 1) * Number(limit)

    const [rewards, total] = await Promise.all([
      ReferralReward.find(filter)
        .populate('referrer', 'name email')
        .populate('referee', 'name email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReferralReward.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: rewards,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: List payout requests ─────────────────────────────────────────────
export const getPayoutRequests = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = status ? { status } : {}
    const skip = (Number(page) - 1) * Number(limit)

    const [requests, total] = await Promise.all([
      PayoutRequest.find(filter)
        .populate('student', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PayoutRequest.countDocuments(filter),
    ])

    const populatedStudentIds = requests.map(r => r.student?._id).filter(Boolean)
    const wallets = await ReferralWallet.find({
      student: { $in: populatedStudentIds },
    }).select('student balance')
    const walletMap = {}
    wallets.forEach(w => { walletMap[w.student.toString()] = w.balance })

    const data = requests.map(r => ({
      ...r.toObject(),
      walletBalance: r.student ? (walletMap[r.student._id.toString()] ?? 0) : 0,
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

// ─── Admin: Process payout request ───────────────────────────────────────────
export const processPayoutRequest = asyncHandler(async (req, res) => {
  try {
    const { action, adminNote } = req.body
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: { message: 'action must be approve or reject' } })
    }

    const request = await PayoutRequest.findById(req.params.requestId)
    if (!request) return res.status(404).json({ success: false, error: { message: 'Payout request not found' } })
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: { message: 'Request is already processed' } })
    }

    let remainingBalance = 0
    if (action === 'approve') {
      const wallet = await ReferralWallet.findById(request.wallet)
      if (!wallet || wallet.balance < request.amount) {
        return res.status(400).json({ success: false, error: { message: 'Insufficient wallet balance' } })
      }
      wallet.balance -= request.amount
      wallet.totalPaidOut += request.amount
      wallet.transactions.push({ type: 'debit', amount: request.amount, description: 'Payout approved by admin' })
      await wallet.save()
      remainingBalance = wallet.balance

      await ReferralReward.updateMany({ referrer: request.student, status: 'credited' }, { status: 'paid_out' })

      request.status = 'approved'
    } else {
      request.status = 'rejected'
    }

    request.adminNote = adminNote || null
    request.processedAt = new Date()
    await request.save()

    // Notify the student of the payout decision (fire-and-forget)
    User.findById(request.student, 'name email').lean().then(student => {
      if (!student?.email) return
      const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/referrals`
      if (action === 'approve') {
        sendEmail({
          type: 'payout_approved',
          to: student.email,
          toName: student.name,
          variables: { studentName: student.name, amount: String(request.amount), currency: 'PKR', walletBalance: String(remainingBalance), dashboardUrl },
          metadata: { payoutRequestId: request._id },
        }).catch(() => {})
      } else {
        sendEmail({
          type: 'payout_rejected',
          to: student.email,
          toName: student.name,
          variables: { studentName: student.name, amount: String(request.amount), currency: 'PKR', reason: adminNote || 'Not specified', dashboardUrl },
          metadata: { payoutRequestId: request._id },
        }).catch(() => {})
      }
    }).catch(() => {})

    const actionLabel = action === 'approve' ? 'approved' : 'rejected'
    res.json({ success: true, message: `Payout request ${actionLabel}`, data: { request } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Get referral settings ────────────────────────────────────────────
export const getReferralSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await SiteSettings.findOne()
    res.json({ success: true, data: settings?.referral || { enabled: false } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Update referral settings ─────────────────────────────────────────
export const updateReferralSettings = asyncHandler(async (req, res) => {
  try {
    const { enabled, refereeDiscountType, refereeDiscountValue, referrerRewardType, referrerRewardValue } = req.body
    const update = {}
    if (enabled !== undefined) update['referral.enabled'] = enabled
    if (refereeDiscountType) update['referral.refereeDiscountType'] = refereeDiscountType
    if (refereeDiscountValue !== undefined) update['referral.refereeDiscountValue'] = Number(refereeDiscountValue)
    if (referrerRewardType) update['referral.referrerRewardType'] = referrerRewardType
    if (referrerRewardValue !== undefined) update['referral.referrerRewardValue'] = Number(referrerRewardValue)

    const settings = await SiteSettings.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true })
    res.json({ success: true, message: 'Referral settings updated', data: settings.referral })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
