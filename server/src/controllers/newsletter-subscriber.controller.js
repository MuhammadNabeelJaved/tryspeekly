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
