import Joi from 'joi'

import asyncHandler from '../utils/asyncHandler.js'
import Review from '../models/review.model.js'
import Enrollment from '../models/enrollment.model.js'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/apiErrors.js'

// ─── Validation schemas ────────────────────────────────────────────────────────

const submitSchema = Joi.object({
  type: Joi.string().valid('platform', 'course').required(),
  courseId: Joi.when('type', {
    is: 'course',
    then: Joi.string().required().messages({ 'any.required': 'courseId is required for course reviews' }),
    otherwise: Joi.forbidden().messages({ 'any.unknown': 'courseId is not allowed for platform reviews' }),
  }),
  rating: Joi.number().integer().min(1).max(5).required(),
  content: Joi.string().trim().min(10).max(1000).required(),
})

const updateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  content: Joi.string().trim().min(10).max(1000),
}).min(1)

export const statusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  adminNote: Joi.string().trim().max(500).allow(''),
})

// ─── Public ────────────────────────────────────────────────────────────────────

export const getPublicReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ status: 'approved', featuredOnHome: true })
    .populate('author', 'name profileImage role')
    .sort({ updatedAt: -1 })

  res.json({ success: true, data: reviews })
})

export const getCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const { page = 1, limit = 10 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const filter = { type: 'course', course: courseId, status: 'approved' }
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('author', 'name profileImage role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  })
})

// ─── Authenticated user ────────────────────────────────────────────────────────

export const submitReview = asyncHandler(async (req, res) => {
  const { error, value } = submitSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const { type, courseId, rating, content } = value
  const authorId = req.user.id

  if (type === 'course') {
    if (req.user.role !== 'student') throw new ForbiddenError('Only students can write course reviews')

    const enrollment = await Enrollment.findOne({ student: authorId, course: courseId, isActive: true })
    if (!enrollment) throw new ForbiddenError('You must be enrolled in this course to review it')

    const { sessionsAttended, totalSessions } = enrollment.progress
    if (sessionsAttended < totalSessions) {
      throw new ForbiddenError('Complete the course before writing a review')
    }
  }

  let review
  try {
    review = await Review.create({
      type,
      author: authorId,
      course: type === 'course' ? courseId : undefined,
      rating,
      content,
    })
  } catch (err) {
    if (err.code === 11000) {
      throw new ConflictError(
        type === 'course'
          ? 'You have already reviewed this course'
          : 'You have already submitted a platform review'
      )
    }
    throw err
  }

  await review.populate('author', 'name profileImage role')

  res.status(201).json({
    success: true,
    message: 'Review submitted. It will appear after admin approval.',
    data: review,
  })
})

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ author: req.user.id })
    .populate('course', 'title')
    .sort({ createdAt: -1 })

  res.json({ success: true, data: reviews })
})

export const getMyCourseReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ author: req.user.id, course: req.params.courseId })
    .populate('author', 'name profileImage role')

  res.json({ success: true, data: review ?? null })
})

export const updateReview = asyncHandler(async (req, res) => {
  const { error, value } = updateSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const review = await Review.findOne({ _id: req.params.id, author: req.user.id })
  if (!review) throw new NotFoundError('Review not found')

  Object.assign(review, value, { status: 'pending', featuredOnHome: false })
  await review.save()
  await review.populate('author', 'name profileImage role')

  res.json({
    success: true,
    message: 'Review updated. It will re-enter the approval queue.',
    data: review,
  })
})

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, author: req.user.id })
  if (!review) throw new NotFoundError('Review not found')

  review.isDeleted = true
  await review.save()

  res.json({ success: true, message: 'Review deleted' })
})
