import mongoose from 'mongoose'

import asyncHandler from '../utils/asyncHandler.js'
import Coupon from '../models/coupon.model.js'
import Course from '../models/course.model.js'
import Enrollment from '../models/enrollment.model.js'
import SiteSettings from '../models/site-settings.model.js'

// ─── Admin: Create coupon ──────────────────────────────────────────────────────
export const createCoupon = asyncHandler(async (req, res) => {
  try {
    const { code, discountType, discountValue, scope, courseId, maxUses, expiresAt } = req.body

    if (!code || !discountType || discountValue === undefined || !scope) {
      return res.status(400).json({ success: false, error: { message: 'code, discountType, discountValue, and scope are required' } })
    }
    if (scope === 'course' && !courseId) {
      return res.status(400).json({ success: false, error: { message: 'courseId is required when scope is course' } })
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() })
    if (existing) return res.status(409).json({ success: false, error: { message: 'Coupon code already exists' } })

    if (scope === 'course') {
      const course = await Course.findById(courseId)
      if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      source: 'admin',
      discountType,
      discountValue: Number(discountValue),
      scope,
      course: scope === 'course' ? courseId : null,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
      createdBy: req.user.id,
    })

    res.status(201).json({ success: true, message: 'Coupon created', data: { coupon } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: List coupons ───────────────────────────────────────────────────────
export const getCoupons = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, source, isActive, scope } = req.query
    const filter = {}
    if (source) filter.source = source
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (scope) filter.scope = scope

    const skip = (Number(page) - 1) * Number(limit)
    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .populate('course', 'title')
        .populate('referrer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Coupon.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: { coupons },
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Get single coupon ──────────────────────────────────────────────────
export const getCoupon = asyncHandler(async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('course', 'title')
      .populate('referrer', 'name email')
      .populate('createdBy', 'name')
    if (!coupon) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } })
    res.json({ success: true, data: { coupon } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Update coupon ──────────────────────────────────────────────────────
export const updateCoupon = asyncHandler(async (req, res) => {
  try {
    const allowed = {}
    if (req.body.isActive !== undefined) allowed.isActive = req.body.isActive
    if (req.body.maxUses !== undefined) allowed.maxUses = req.body.maxUses === null ? null : Number(req.body.maxUses)
    if (req.body.expiresAt !== undefined) allowed.expiresAt = req.body.expiresAt || null
    if (req.body.discountValue !== undefined) allowed.discountValue = Number(req.body.discountValue)
    if (req.body.discountType !== undefined) allowed.discountType = req.body.discountType
    if (req.body.code !== undefined) {
      const normalizedCode = req.body.code.toUpperCase().trim()
      const duplicate = await Coupon.findOne({ code: normalizedCode, _id: { $ne: req.params.id } })
      if (duplicate) return res.status(409).json({ success: false, error: { message: 'Coupon code already exists' } })
      allowed.code = normalizedCode
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true })
    if (!coupon) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } })
    res.json({ success: true, message: 'Coupon updated', data: { coupon } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Delete coupon ──────────────────────────────────────────────────────
export const deleteCoupon = asyncHandler(async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id)
    if (!coupon) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } })
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Bulk-delete coupons ────────────────────────────────────────────────
// Only admin-created coupons are deletable; referral coupons are system-managed.
export const bulkDeleteCoupons = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ success: false, error: { message: 'ids must be a non-empty array' } })
  if (ids.length > 100)
    return res.status(400).json({ success: false, error: { message: 'Cannot delete more than 100 coupons at once' } })

  const validIds = ids.filter(id => mongoose.isValidObjectId(id))
  const result = await Coupon.deleteMany({ _id: { $in: validIds }, source: 'admin' })
  res.json({
    success: true,
    message: `${result.deletedCount} coupon${result.deletedCount !== 1 ? 's' : ''} deleted`,
    data: { deleted: result.deletedCount },
  })
})

// ─── Student: Validate coupon ──────────────────────────────────────────────────
export const validateCoupon = asyncHandler(async (req, res) => {
  try {
    const { code, courseId } = req.body
    if (!code || !courseId) {
      return res.status(400).json({ success: false, error: { message: 'code and courseId are required' } })
    }

    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() })
    if (!coupon) {
      return res.json({ success: true, data: { valid: false, reason: 'Coupon code not found' } })
    }
    if (!coupon.isActive) {
      return res.json({ success: true, data: { valid: false, reason: 'Coupon is inactive' } })
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.json({ success: true, data: { valid: false, reason: 'Coupon has expired' } })
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return res.json({ success: true, data: { valid: false, reason: 'Coupon usage limit reached' } })
    }
    if (coupon.scope === 'course' && coupon.course?.toString() !== courseId) {
      return res.json({ success: true, data: { valid: false, reason: 'Coupon is not valid for this course' } })
    }
    if (coupon.source === 'referral' && coupon.referrer?.toString() === req.user.id.toString()) {
      return res.json({ success: true, data: { valid: false, reason: 'You cannot use your own referral code' } })
    }

    // Check referral system enabled for referral coupons
    if (coupon.source === 'referral') {
      const settings = await SiteSettings.findOne()
      if (!settings?.referral?.enabled) {
        return res.json({ success: true, data: { valid: false, reason: 'Referral system is currently disabled' } })
      }
    }

    // Check not already enrolled
    const alreadyEnrolled = await Enrollment.findOne({ student: req.user.id, course: courseId })
    if (alreadyEnrolled) {
      return res.json({ success: true, data: { valid: false, reason: 'You are already enrolled in this course' } })
    }

    const coursePrice = course.currency === 'USD' ? course.priceUSD : course.price
    if (!coursePrice || !Number.isFinite(coursePrice)) {
      return res.status(400).json({ success: false, error: { message: 'Course price is unavailable' } })
    }
    let discountAmount = 0
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((coursePrice * coupon.discountValue) / 100)
    } else {
      discountAmount = Math.min(coupon.discountValue, coursePrice)
    }
    const finalPrice = Math.max(0, coursePrice - discountAmount)

    res.json({
      success: true,
      data: {
        valid: true,
        couponId: coupon._id,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalPrice,
        currency: course.currency,
        originalPrice: coursePrice,
      },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Admin: Get coupon/offer usage tracking ───────────────────────────────────
export const getCouponUsageTracking = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const filter = {}
    if (type === 'coupon') {
      filter.coupon = { $ne: null }
    } else if (type === 'offer') {
      filter.offer = { $ne: null }
    } else {
      filter.$or = [
        { coupon: { $ne: null } },
        { offer: { $ne: null } },
        { discountApplied: { $gt: 0 } },
        { offerDiscountApplied: { $gt: 0 } },
      ]
    }

    const [records, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('student', 'name email')
        .populate('course', 'title price priceUSD currency')
        .populate('coupon', 'code discountType discountValue source')
        .populate('offer', 'title discountType discountValue')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Enrollment.countDocuments(filter),
    ])

    const data = records.map(r => ({
      _id: r._id,
      student: r.student,
      course: r.course,
      coupon: r.coupon,
      offer: r.offer,
      discountApplied: r.discountApplied || 0,
      offerDiscountApplied: r.offerDiscountApplied || 0,
      totalDiscount: (r.discountApplied || 0) + (r.offerDiscountApplied || 0),
      isActive: r.isActive,
      enrolledAt: r.enrolledAt,
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
