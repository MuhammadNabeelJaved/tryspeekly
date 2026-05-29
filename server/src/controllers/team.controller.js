import Joi from 'joi'
import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/user.model.js'
import TeamChat from '../models/team-chat.model.js'
import { emitToUser } from '../utils/socket.js'
import { BadRequestError, NotFoundError, ConflictError } from '../utils/apiErrors.js'
import { sendEmail } from '../utils/email.js'

// ─── List team members ────────────────────────────────────────────────────────

export const listTeamMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ role: 'team_member', isDeleted: false })
    .select('name email jobTitle permissions profileImage createdAt')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, message: 'Team members retrieved.', data: members })
})

// ─── Get single team member ───────────────────────────────────────────────────

export const getTeamMember = asyncHandler(async (req, res) => {
  const member = await User.findOne({
    _id: req.params.id,
    role: 'team_member',
    isDeleted: false,
  }).select('name email jobTitle permissions profileImage createdAt').lean()

  if (!member) throw new NotFoundError('Team member not found.')
  res.json({ success: true, message: 'Team member retrieved.', data: member })
})

// ─── Create team member ───────────────────────────────────────────────────────

export const createTeamMember = asyncHandler(async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    jobTitle: Joi.string().max(100).allow('', null),
    permissions: Joi.array().items(Joi.string()).default([]),
  })
  const { error, value } = schema.validate(req.body, { abortEarly: false })
  if (error) throw new BadRequestError(error.details.map(d => d.message).join('; '))

  const { name, email, password, jobTitle, permissions } = value

  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) throw new ConflictError('A user with this email already exists.')

  const member = await User.create({
    name,
    email,
    password,
    jobTitle,
    permissions,
    role: 'team_member',
    isVerified: true,
  })

  sendEmail({
    type: 'team_member_welcome',
    to: email,
    toName: name,
    variables: { name, email, jobTitle: jobTitle || 'Team Member' },
    metadata: { memberId: member._id },
  }).catch(() => {})

  const safe = await User.findById(member._id)
    .select('name email jobTitle permissions profileImage createdAt')
    .lean()

  res.status(201).json({ success: true, message: 'Team member created.', data: safe })
})

// ─── Update team member ───────────────────────────────────────────────────────

export const updateTeamMember = asyncHandler(async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    jobTitle: Joi.string().max(100).allow('', null),
    permissions: Joi.array().items(Joi.string()),
  })
  const { error, value } = schema.validate(req.body, { abortEarly: false })
  if (error) throw new BadRequestError(error.details.map(d => d.message).join('; '))

  const { name, email, jobTitle, permissions } = value

  const member = await User.findOne({
    _id: req.params.id,
    role: 'team_member',
    isDeleted: false,
  })
  if (!member) throw new NotFoundError('Team member not found.')

  if (email && email !== member.email) {
    const conflict = await User.findOne({ email: email.toLowerCase().trim() })
    if (conflict) throw new ConflictError('This email is already in use.')
    member.email = email
  }

  if (name !== undefined) member.name = name
  if (jobTitle !== undefined) member.jobTitle = jobTitle
  if (permissions !== undefined) member.permissions = permissions

  await member.save()

  const safe = await User.findById(member._id)
    .select('name email jobTitle permissions profileImage createdAt')
    .lean()

  res.json({ success: true, message: 'Team member updated.', data: safe })
})

// ─── Delete team member ───────────────────────────────────────────────────────

export const deleteTeamMember = asyncHandler(async (req, res) => {
  const member = await User.findOne({
    _id: req.params.id,
    role: 'team_member',
    isDeleted: false,
  })
  if (!member) throw new NotFoundError('Team member not found.')

  member.isDeleted = true
  await member.save()

  res.json({ success: true, message: 'Team member removed.' })
})
