import asyncHandler from '../utils/asyncHandler.js'
import Coupon from '../models/coupon.model.js'
import ReferralReward from '../models/referral-reward.model.js'
import ReferralWallet from '../models/referral-wallet.model.js'
import PayoutRequest from '../models/payout-request.model.js'
import SiteSettings from '../models/site-settings.model.js'
import Course from '../models/course.model.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(userId) {
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `REF-${userId.toString().slice(-4).toUpperCase()}-${suffix}`
}

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

    // Idempotent: return existing code if already generated
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

// ─── Student: Get my referral codes ──────────────────────────────────────────
export const getMyReferralCodes = asyncHandler(async (req, res) => {
  try {
    const coupons = await Coupon.find({ source: 'referral', referrer: req.user.id })
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

    res.json({ success: true, data, settings: settings?.referral || {} })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Student: Get my reward history ──────────────────────────────────────────
export const getMyRewards = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

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

    const wallets = await ReferralWallet.find({
      student: { $in: requests.map(r => r.student._id) },
    }).select('student balance')
    const walletMap = {}
    wallets.forEach(w => { walletMap[w.student.toString()] = w.balance })

    const data = requests.map(r => ({
      ...r.toObject(),
      walletBalance: walletMap[r.student._id.toString()] ?? 0,
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

    if (action === 'approve') {
      const wallet = await ReferralWallet.findById(request.wallet)
      if (!wallet || wallet.balance < request.amount) {
        return res.status(400).json({ success: false, error: { message: 'Insufficient wallet balance' } })
      }
      wallet.balance -= request.amount
      wallet.totalPaidOut += request.amount
      wallet.transactions.push({ type: 'debit', amount: request.amount, description: 'Payout approved by admin' })
      await wallet.save()

      await ReferralReward.updateMany({ referrer: request.student, status: 'credited' }, { status: 'paid_out' })

      request.status = 'approved'
    } else {
      request.status = 'rejected'
    }

    request.adminNote = adminNote || null
    request.processedAt = new Date()
    await request.save()

    res.json({ success: true, message: `Payout request ${action}d`, data: { request } })
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
