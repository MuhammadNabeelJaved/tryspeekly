import Joi from 'joi'
import asyncHandler from '../utils/asyncHandler.js'
import NewsletterCampaign from '../models/newsletter-campaign.model.js'
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/apiErrors.js'
import { dispatchCampaign } from '../utils/newsletter-sender.js'

const EDITABLE = ['draft', 'scheduled']

const createSchema = Joi.object({
  subject: Joi.string().min(1).max(300).required(),
  htmlBody: Joi.string().min(1).required(),
  status: Joi.string().valid('draft', 'scheduled').required(),
  scheduledAt: Joi.when('status', {
    is: 'scheduled',
    then: Joi.date().greater('now').required(),
    otherwise: Joi.date().optional().allow(null),
  }),
})

const updateSchema = Joi.object({
  subject: Joi.string().min(1).max(300),
  htmlBody: Joi.string().min(1),
  status: Joi.string().valid('draft', 'scheduled'),
  scheduledAt: Joi.when('status', {
    is: 'scheduled',
    then: Joi.date().greater('now').required(),
    otherwise: Joi.date().allow(null).optional(),
  }),
})

// ─── GET /api/v1/newsletter/campaigns ─────────────────────────────────────────
export const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await NewsletterCampaign.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .lean()
  res.json({ success: true, data: campaigns })
})

// ─── POST /api/v1/newsletter/campaigns ────────────────────────────────────────
export const createCampaign = asyncHandler(async (req, res) => {
  const { error, value } = createSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const campaign = await NewsletterCampaign.create({ ...value, createdBy: req.user.id })
  res.status(201).json({ success: true, message: 'Campaign created', data: campaign })
})

// ─── GET /api/v1/newsletter/campaigns/:id ─────────────────────────────────────
export const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await NewsletterCampaign.findById(req.params.id)
    .populate('createdBy', 'name email')
    .lean()
  if (!campaign) throw new NotFoundError('Campaign not found')
  res.json({ success: true, data: campaign })
})

// ─── PUT /api/v1/newsletter/campaigns/:id ─────────────────────────────────────
export const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await NewsletterCampaign.findById(req.params.id)
  if (!campaign) throw new NotFoundError('Campaign not found')
  if (!EDITABLE.includes(campaign.status)) {
    throw new ForbiddenError('Only draft and scheduled campaigns can be edited')
  }

  const { error, value } = updateSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  Object.assign(campaign, value)
  await campaign.save()
  res.json({ success: true, message: 'Campaign updated', data: campaign })
})

// ─── DELETE /api/v1/newsletter/campaigns/:id ──────────────────────────────────
export const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await NewsletterCampaign.findById(req.params.id)
  if (!campaign) throw new NotFoundError('Campaign not found')
  if (!EDITABLE.includes(campaign.status)) {
    throw new ForbiddenError('Only draft and scheduled campaigns can be deleted')
  }

  await campaign.deleteOne()
  res.status(204).send()
})

// ─── POST /api/v1/newsletter/campaigns/:id/send ───────────────────────────────
export const sendCampaign = asyncHandler(async (req, res) => {
  const campaign = await NewsletterCampaign.findById(req.params.id)
  if (!campaign) throw new NotFoundError('Campaign not found')
  if (!EDITABLE.includes(campaign.status)) {
    throw new ForbiddenError('Campaign has already been sent or is currently sending')
  }

  campaign.status = 'sending'
  await campaign.save()

  dispatchCampaign(campaign._id).catch(async (err) => {
    console.error('[Newsletter] dispatch error:', err.message)
    await NewsletterCampaign.findByIdAndUpdate(campaign._id, { status: 'failed' })
  })

  res.json({ success: true, message: 'Campaign is being sent', data: { id: campaign._id } })
})
