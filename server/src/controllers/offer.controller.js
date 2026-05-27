import asyncHandler from '../utils/asyncHandler.js'
import Offer from '../models/offer.model.js'
import { BadRequestError, NotFoundError } from '../utils/apiErrors.js'

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
  const { title, bannerText, discountType, discountValue, scope, courseId, isActive, startsAt, endsAt } = req.body

  if (!title || !discountType || discountValue == null || !scope) {
    throw new BadRequestError('title, discountType, discountValue, and scope are required')
  }
  if (scope === 'course' && !courseId) {
    throw new BadRequestError('courseId is required when scope is "course"')
  }

  const offer = await Offer.create({
    title,
    bannerText: bannerText || '',
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
  res.status(201).json({ success: true, message: 'Offer created', data: offer })
})

// ─── PATCH /api/v1/offers/:id (admin) ────────────────────────────────────────
export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
  if (!offer) throw new NotFoundError('Offer not found')

  const allowed = ['title', 'bannerText', 'discountType', 'discountValue', 'scope', 'isActive', 'startsAt', 'endsAt']
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
