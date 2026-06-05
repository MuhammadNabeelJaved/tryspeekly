import Joi from 'joi'

import asyncHandler from '../utils/asyncHandler.js'
import Review from '../models/review.model.js'
import Enrollment from '../models/enrollment.model.js'
import User from '../models/user.model.js'
import { createAndEmitNotification } from '../utils/notify.js'
import { sendEmail } from '../utils/email.js'
import { uploadReviewAuthorImage } from '../utils/cloudinary.js'
import Course from '../models/course.model.js'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/apiErrors.js'

// ─── Validation schemas ────────────────────────────────────────────────────────

const submitSchema = Joi.object({
  type: Joi.string().valid('platform', 'course', 'team').required(),
  courseId: Joi.when('type', {
    is: 'course',
    then: Joi.string().required().messages({ 'any.required': 'courseId is required for course reviews' }),
    otherwise: Joi.forbidden().messages({ 'any.unknown': 'courseId is not allowed for this review type' }),
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Merge a review's custom display overrides (authorName / authorImage) into its
 * populated `author` object so consumers render the override transparently.
 * Returns a plain object. Accepts a Mongoose doc or a lean object.
 */
function withAuthorOverride(reviewDoc) {
  const r = typeof reviewDoc?.toObject === 'function' ? reviewDoc.toObject() : reviewDoc
  // authorRole is always set on admin-created reviews, so it marks a custom review.
  if (r && (r.authorName || r.authorImage || r.authorRole)) {
    r.author = {
      ...(r.author || {}),
      ...(r.authorName ? { name: r.authorName } : {}),
      ...(r.authorRole ? { role: r.authorRole } : {}),
      // When no custom image was set, drop the admin's real avatar so the client
      // renders a name-based initial fallback instead.
      profileImage: r.authorImage || undefined,
    }
  }
  return r
}

// ─── Public ────────────────────────────────────────────────────────────────────

export const getPublicReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ status: 'approved', featuredOnHome: true })
    .populate('author', 'name profileImage role')
    .sort({ updatedAt: -1 })

  res.json({ success: true, data: reviews.map(withAuthorOverride) })
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
    data: reviews.map(withAuthorOverride),
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

  if (type === 'team') {
    if (req.user.role !== 'team_member') throw new ForbiddenError('Only team members can write team experience reviews')
  }

  // Snapshot job title for team reviews so it persists even if the user's title changes later
  let jobTitle
  if (type === 'team') {
    const member = await User.findById(authorId, 'jobTitle').lean()
    jobTitle = member?.jobTitle || 'Team Member'
  }

  let review
  try {
    review = await Review.create({
      type,
      author: authorId,
      course: type === 'course' ? courseId : undefined,
      jobTitle: type === 'team' ? jobTitle : undefined,
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

  // Notify all admins in real-time
  try {
    const admins = await User.find({ role: 'admin' }).select('_id')
    const authorName = review.author.name ?? 'Someone'
    const notifPayload = {
      title: 'New Review Submitted',
      message: `${authorName} submitted a ${type} review. Review it in the admin panel.`,
      type: 'system',
      severity: 'low',
      relatedId: review._id,
      relatedType: 'Review',
    }
    await Promise.all(admins.map(admin => createAndEmitNotification({ recipientId: admin._id, ...notifPayload })))
  } catch {
    // Notification failure must not break the response
  }

  // Email confirmation to reviewer
  const reviewer = await User.findById(authorId, 'name email').lean()
  const reviewedCourse = type === 'course' && courseId ? await Course.findById(courseId, 'title').lean() : null
  if (reviewer) {
    sendEmail({
      type: 'review_submitted',
      to: reviewer.email,
      toName: reviewer.name,
      variables: {
        reviewerName: reviewer.name,
        reviewType: type === 'course' ? 'Course Review' : 'Platform Review',
        courseName: reviewedCourse?.title ?? 'N/A',
        rating: String(rating),
      },
      metadata: { reviewId: review._id },
    }).catch(() => {})
  }

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

// ─── Admin ─────────────────────────────────────────────────────────────────────

export const getAdminReviews = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query
  const filter = {}
  if (status && status !== 'all') filter.status = status
  if (type && type !== 'all') filter.type = type

  const skip = (Number(page) - 1) * Number(limit)
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('author', 'name profileImage role email')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: reviews.map(withAuthorOverride),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  })
})

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { error, value } = statusSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const review = await Review.findById(req.params.id)
  if (!review) throw new NotFoundError('Review not found')

  const prevStatus = review.status
  review.status = value.status
  if (value.adminNote) review.adminNote = value.adminNote
  if (value.status === 'rejected') review.featuredOnHome = false
  await review.save()

  // Email reviewer when approved
  if (value.status === 'approved' && prevStatus !== 'approved') {
    const [author, course] = await Promise.all([
      User.findById(review.author, 'name email').lean(),
      review.course ? Course.findById(review.course, 'title').lean() : null,
    ])
    if (author) {
      sendEmail({
        type: 'review_approved',
        to: author.email,
        toName: author.name,
        variables: {
          reviewerName: author.name,
          reviewType: review.type === 'course' ? 'Course Review' : 'Platform Review',
          courseName: course?.title ?? 'N/A',
        },
        metadata: { reviewId: review._id },
      }).catch(() => {})
    }
  }

  res.json({ success: true, message: `Review ${value.status}`, data: review })
})

export const toggleFeatured = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
  if (!review) throw new NotFoundError('Review not found')
  if (review.status !== 'approved') throw new BadRequestError('Only approved reviews can be featured')

  review.featuredOnHome = !review.featuredOnHome
  await review.save()

  res.json({
    success: true,
    message: review.featuredOnHome ? 'Review featured on home page' : 'Review removed from home page',
    data: review,
  })
})

export const adminDeleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id)
  if (!review) throw new NotFoundError('Review not found')

  res.json({ success: true, message: 'Review permanently deleted' })
})

const adminCreateSchema = Joi.object({
  type: Joi.string().valid('platform', 'course').required(),
  courseId: Joi.when('type', {
    is: 'course',
    then: Joi.string().required().messages({ 'any.required': 'courseId is required for course reviews' }),
    otherwise: Joi.forbidden(),
  }),
  rating: Joi.number().integer().min(1).max(5).required(),
  content: Joi.string().trim().min(10).max(1000).required(),
  status: Joi.string().valid('pending', 'approved').default('approved'),
  featuredOnHome: Joi.boolean().default(false),
  // Optional display overrides. authorImage may be a pasted URL; an uploaded
  // file (req.file) takes priority over it when both are provided.
  authorName: Joi.string().trim().max(100).allow('').optional(),
  authorImage: Joi.string().trim().uri().allow('').optional(),
  // Display role for the review; defaults to student.
  authorRole: Joi.string().valid('student', 'teacher', 'admin').default('student'),
})

// ─── Team member: get all approved team reviews ───────────────────────────────

export const getTeamReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const filter = { type: 'team', status: 'approved' }
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('author', 'name profileImage jobTitle')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: reviews.map(withAuthorOverride),
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  })
})

export const adminCreateReview = asyncHandler(async (req, res) => {
  const { error, value } = adminCreateSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const { type, courseId, rating, content, status, featuredOnHome, authorName, authorImage, authorRole } = value

  // Resolve the optional custom avatar: an uploaded file wins over a pasted URL.
  let resolvedImage = authorImage?.trim() || undefined
  if (req.file) {
    const uploaded = await uploadReviewAuthorImage(req.file.buffer)
    resolvedImage = uploaded.secure_url
  }

  let review
  try {
    review = await Review.create({
      type,
      author: req.user.id,
      course: type === 'course' ? courseId : undefined,
      rating,
      content,
      status,
      featuredOnHome: status === 'approved' ? featuredOnHome : false,
      authorName: authorName?.trim() || undefined,
      authorImage: resolvedImage,
      authorRole,
    })
  } catch (err) {
    if (err.code === 11000) throw new ConflictError('A review from this account for this target already exists')
    throw err
  }

  await review.populate('author', 'name profileImage role email')
  if (type === 'course') await review.populate('course', 'title')

  res.status(201).json({ success: true, message: 'Review created', data: withAuthorOverride(review) })
})
