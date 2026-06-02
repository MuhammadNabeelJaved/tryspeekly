import Joi from 'joi'
import { randomUUID } from 'crypto'
import asyncHandler from '../utils/asyncHandler.js'
import NewsletterSubscriber from '../models/newsletter-subscriber.model.js'
import { BadRequestError, NotFoundError, ConflictError } from '../utils/apiErrors.js'
import { sendNewsletterWelcome } from '../utils/newsletter-sender.js'

const emailSchema = Joi.object({ email: Joi.string().email().lowercase().trim().required() })

// ─── POST /api/v1/newsletter/subscribers (public) ─────────────────────────────
export const subscribe = asyncHandler(async (req, res) => {
  const { error, value } = emailSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const existing = await NewsletterSubscriber.findOne({ email: value.email })

  if (existing) {
    if (existing.status === 'active') {
      throw new ConflictError('This email is already subscribed.')
    }
    existing.status = 'active'
    existing.unsubscribedAt = null
    existing.token = randomUUID()
    await existing.save()
    sendNewsletterWelcome({ to: existing.email, token: existing.token }).catch(err =>
      console.error('[Newsletter] Welcome email error:', err.message)
    )
    return res.json({ success: true, message: 'Welcome back! You have been re-subscribed.' })
  }

  const newToken = randomUUID()
  await NewsletterSubscriber.create({ email: value.email, token: newToken })
  sendNewsletterWelcome({ to: value.email, token: newToken }).catch(err =>
    console.error('[Newsletter] Welcome email error:', err.message)
  )
  res.status(201).json({ success: true, message: 'Subscribed successfully!' })
})

// ─── GET /api/v1/newsletter/subscribers (admin) ───────────────────────────────
export const getSubscribers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 20)
  const search = req.query.search?.trim()

  const escaped = search ? search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null
  const filter = escaped ? { email: { $regex: escaped, $options: 'i' } } : {}
  const total = await NewsletterSubscriber.countDocuments(filter)
  const subscribers = await NewsletterSubscriber.find(filter)
    .sort({ subscribedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()

  res.json({
    success: true,
    data: {
      subscribers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  })
})

// ─── DELETE /api/v1/newsletter/subscribers/:id (admin) ────────────────────────
export const deleteSubscriber = asyncHandler(async (req, res) => {
  const sub = await NewsletterSubscriber.findByIdAndDelete(req.params.id)
  if (!sub) throw new NotFoundError('Subscriber not found')
  res.status(204).send()
})

// ─── PATCH /api/v1/newsletter/subscribers/:id/unsubscribe (admin) ─────────────
export const adminUnsubscribe = asyncHandler(async (req, res) => {
  const sub = await NewsletterSubscriber.findByIdAndUpdate(
    req.params.id,
    { status: 'unsubscribed', unsubscribedAt: new Date() },
    { new: true }
  )
  if (!sub) throw new NotFoundError('Subscriber not found')
  res.json({ success: true, message: 'Subscriber unsubscribed', data: sub })
})

// ─── GET /api/v1/newsletter/unsubscribe?token=xx (public) ─────────────────────
export const unsubscribeByToken = asyncHandler(async (req, res) => {
  const { token } = req.query
  if (!token) throw new BadRequestError('Token is required')

  await NewsletterSubscriber.findOneAndUpdate(
    { token },
    { status: 'unsubscribed', unsubscribedAt: new Date() }
  )
  res.json({ success: true, message: 'You have been unsubscribed successfully.' })
})

// ─── DELETE /api/v1/newsletter/subscribers/bulk (admin) ───────────────────────
export const bulkDeleteSubscribers = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ success: false, error: { message: 'ids must be a non-empty array' } })
  const result = await NewsletterSubscriber.deleteMany({ _id: { $in: ids } })
  res.json({ success: true, message: `${result.deletedCount} subscriber${result.deletedCount !== 1 ? 's' : ''} deleted`, data: { deleted: result.deletedCount } })
})

// ─── GET /api/v1/newsletter/stats (admin) ─────────────────────────────────────
export const getNewsletterStats = asyncHandler(async (req, res) => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [total, active, unsubscribed, thisMonth] = await Promise.all([
    NewsletterSubscriber.countDocuments({}),
    NewsletterSubscriber.countDocuments({ status: 'active' }),
    NewsletterSubscriber.countDocuments({ status: 'unsubscribed' }),
    NewsletterSubscriber.countDocuments({ subscribedAt: { $gte: startOfMonth } }),
  ])
  res.json({ success: true, data: { total, active, unsubscribed, thisMonth } })
})

// ─── GET /api/v1/newsletter/growth (admin) ────────────────────────────────────
export const getNewsletterGrowth = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const rows = await NewsletterSubscriber.aggregate([
    { $match: { subscribedAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$subscribedAt' }, month: { $month: '$subscribedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  const data = rows.map(r => ({
    month: new Date(r._id.year, r._id.month - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' }),
    subscribers: r.count,
  }))

  res.json({ success: true, data })
})
