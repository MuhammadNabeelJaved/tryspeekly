import asyncHandler from '../utils/asyncHandler.js'
import Offer from '../models/offer.model.js'
import { BadRequestError, NotFoundError } from '../utils/apiErrors.js'
import Enrollment from '../models/enrollment.model.js'
import User from '../models/user.model.js'
import Course from '../models/course.model.js'
import { sendEmail } from '../utils/email.js'

// ─── GET /api/v1/offers/active (public) ──────────────────────────────────────
export const getActiveOffers = asyncHandler(async (req, res) => {
  const now = new Date()
  const offers = await Offer.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  })
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, data: offers })
})

// ─── GET /api/v1/offers (admin) ───────────────────────────────────────────────
export const getAllOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find()
    .populate('course', 'title')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, data: offers })
})

// ─── POST /api/v1/offers (admin) ──────────────────────────────────────────────
export const createOffer = asyncHandler(async (req, res) => {
  const { title, bannerText, marqueeSpeedSeconds, discountType, discountValue, scope, courseId, isActive, startsAt, endsAt } = req.body

  if (!title || !discountType || discountValue == null || !scope) {
    throw new BadRequestError('title, discountType, discountValue, and scope are required')
  }
  if (scope === 'course' && !courseId) {
    throw new BadRequestError('courseId is required when scope is "course"')
  }

  const offer = await Offer.create({
    title,
    bannerText: bannerText || '',
    marqueeSpeedSeconds: marqueeSpeedSeconds ? Number(marqueeSpeedSeconds) : 60,
    discountType,
    discountValue: Number(discountValue),
    scope,
    course: scope === 'course' ? courseId : null,
    isActive: isActive !== false,
    startsAt: startsAt || null,
    endsAt: endsAt || null,
    createdBy: req.user.id,
  })

  await offer.populate('course', 'title')

  // Email enrolled students about the new offer (fire-and-forget in background)
  ;(async () => {
    try {
      let students = []
      let courseName = 'all courses'
      let courseUrl = process.env.CLIENT_URL || 'http://localhost:5173'

      if (scope === 'course' && courseId) {
        const course = await Course.findById(courseId, 'title').lean()
        courseName = course?.title ?? courseName
        courseUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/courses`

        const enrollments = await Enrollment.find({ course: courseId }).select('student').lean()
        const studentIds = enrollments.map(e => e.student)
        students = await User.find({ _id: { $in: studentIds } }, 'name email').lean()
      } else {
        // Global offer — email all users
        students = await User.find({ isVerified: true, isDeleted: { $ne: true } }, 'name email').lean()
        courseUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/courses`
      }

      const discountLabel = discountType === 'percentage' ? `${discountValue}%` : `${discountValue} off`
      const endsAtFormatted = endsAt ? new Date(endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No expiry'

      for (const student of students) {
        await sendEmail({
          type: 'offer_created',
          to: student.email,
          toName: student.name,
          variables: {
            userName: student.name,
            offerTitle: title,
            courseName,
            discountPercent: discountLabel,
            offerDescription: bannerText || '',
            endsAt: endsAtFormatted,
            courseUrl,
          },
          metadata: { offerId: offer._id },
        })
      }
    } catch (err) {
      console.warn('[Offer] email send error:', err.message)
    }
  })()

  res.status(201).json({ success: true, message: 'Offer created', data: offer })
})

// ─── PATCH /api/v1/offers/:id (admin) ────────────────────────────────────────
export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
  if (!offer) throw new NotFoundError('Offer not found')

  const allowed = ['title', 'bannerText', 'marqueeSpeedSeconds', 'discountType', 'discountValue', 'scope', 'isActive', 'startsAt', 'endsAt']
  allowed.forEach(key => {
    if (req.body[key] !== undefined) offer[key] = req.body[key]
  })
  if (req.body.courseId !== undefined) {
    offer.course = req.body.courseId || null
  }
  if (req.body.scope === 'platform') offer.course = null

  await offer.save()
  await offer.populate('course', 'title')
  res.json({ success: true, message: 'Offer updated', data: offer })
})

// ─── DELETE /api/v1/offers/:id (admin) ───────────────────────────────────────
export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id)
  if (!offer) throw new NotFoundError('Offer not found')
  res.status(204).send()
})
