import Joi from 'joi'
import asyncHandler from '../utils/asyncHandler.js'

// ─── Predefined job titles for team members ───────────────────────────────────

export const TEAM_JOB_TITLES = [
  'Content Manager',
  'Marketing Manager',
  'Sales Executive',
  'Support Agent',
  'Curriculum Developer',
  'Video Editor',
  'Social Media Manager',
  'Finance Manager',
  'HR Manager',
  'Operations Manager',
  'Community Manager',
  'UI/UX Designer',
  'Technical Support',
  'Business Development',
  'Data Analyst',
]
import User from '../models/user.model.js'
import TeamChat from '../models/team-chat.model.js'
import TeamNotification from '../models/team-notification.model.js'
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
    jobTitle: Joi.string().valid(...TEAM_JOB_TITLES).allow('', null),
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
    variables: {
      name,
      email,
      jobTitle: jobTitle || 'Team Member',
      loginUrl: `${process.env.CLIENT_URL}/login`,
    },
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
    jobTitle: Joi.string().valid(...TEAM_JOB_TITLES).allow('', null),
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

  const oldPermissions = [...(member.permissions || [])]

  if (name !== undefined) member.name = name
  if (jobTitle !== undefined) member.jobTitle = jobTitle
  if (permissions !== undefined) member.permissions = permissions

  await member.save()

  const safe = await User.findById(member._id)
    .select('name email jobTitle permissions profileImage createdAt')
    .lean()

  // Notify team member in real time if permissions changed
  if (permissions !== undefined) {
    const newPerms = member.permissions || []
    const added   = newPerms.filter(p => !oldPermissions.includes(p))
    const removed = oldPermissions.filter(p => !newPerms.includes(p))
    if (added.length > 0 || removed.length > 0) {
      const notif = await TeamNotification.create({
        recipient: member._id,
        added,
        removed,
      })
      emitToUser(member._id, 'team:permissions:updated', {
        permissions: newPerms,
        added,
        removed,
        notifId: notif._id,
        createdAt: notif.createdAt,
      })
    }
  }

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

// ─── Shared: build thread query ───────────────────────────────────────────────

const threadQuery = (userA, userB) => ({
  $or: [
    { from: userA, to: userB },
    { from: userB, to: userA },
  ],
})

// ─── Admin: fetch chat thread with a specific team member ─────────────────────

export const getAdminThread = asyncHandler(async (req, res) => {
  const adminId = req.user.id
  const { memberId } = req.params

  const member = await User.findOne({ _id: memberId, role: 'team_member', isDeleted: false })
  if (!member) throw new NotFoundError('Team member not found.')

  const messages = await TeamChat.find(threadQuery(adminId, memberId))
    .sort({ createdAt: 1 })
    .populate('from', 'name profileImage role')
    .lean()

  res.json({ success: true, data: messages })
})

// ─── Admin: send message to team member ──────────────────────────────────────

export const sendAdminMessage = asyncHandler(async (req, res) => {
  const { message } = req.body
  const { memberId } = req.params

  if (!message?.trim()) throw new BadRequestError('Message is required.')

  const member = await User.findOne({ _id: memberId, role: 'team_member', isDeleted: false })
  if (!member) throw new NotFoundError('Team member not found.')

  const msg = await TeamChat.create({ from: req.user.id, to: memberId, message: message.trim() })
  const populated = await TeamChat.findById(msg._id)
    .populate('from', 'name profileImage role')
    .lean()

  // Notify both parties via socket so both see it in real time
  emitToUser(memberId, 'team:message:received', populated)
  emitToUser(req.user.id, 'team:message:received', populated)

  res.status(201).json({ success: true, data: populated })
})

// ─── Admin: mark thread as read ───────────────────────────────────────────────

export const markAdminThreadRead = asyncHandler(async (req, res) => {
  const { memberId } = req.params
  const member = await User.findOne({ _id: memberId, role: 'team_member', isDeleted: false })
  if (!member) throw new NotFoundError('Team member not found.')

  await TeamChat.updateMany(
    { from: memberId, to: req.user.id, read: false },
    { read: true }
  )
  res.json({ success: true, message: 'Thread marked as read.' })
})

// ─── Team member: fetch their thread with admin ───────────────────────────────

export const getMemberThread = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ role: 'admin', isDeleted: false }).select('_id').lean()
  if (!admin) throw new NotFoundError('No admin account found.')

  const messages = await TeamChat.find(threadQuery(req.user.id, admin._id))
    .sort({ createdAt: 1 })
    .populate('from', 'name profileImage role')
    .lean()

  res.json({ success: true, data: messages })
})

// ─── Team member: send message to admin ──────────────────────────────────────

export const sendMemberMessage = asyncHandler(async (req, res) => {
  const { message } = req.body
  if (!message?.trim()) throw new BadRequestError('Message is required.')

  const admin = await User.findOne({ role: 'admin', isDeleted: false }).select('_id').lean()
  if (!admin) throw new NotFoundError('No admin account found.')

  const msg = await TeamChat.create({
    from: req.user.id,
    to: admin._id,
    message: message.trim(),
  })
  const populated = await TeamChat.findById(msg._id)
    .populate('from', 'name profileImage role')
    .lean()

  // Notify admin and echo back to team member via socket
  emitToUser(admin._id, 'team:message:received', populated)
  emitToUser(req.user.id, 'team:message:received', populated)

  res.status(201).json({ success: true, data: populated })
})

// ─── Team member: mark admin messages as read ────────────────────────────────

export const markMemberThreadRead = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ role: 'admin', isDeleted: false }).select('_id').lean()
  if (!admin) throw new NotFoundError('No admin account found.')

  await TeamChat.updateMany(
    { from: admin._id, to: req.user.id, read: false },
    { read: true }
  )
  res.json({ success: true, message: 'Thread marked as read.' })
})

// ─── Team member: get permission notifications ────────────────────────────────

export const getMemberNotifications = asyncHandler(async (req, res) => {
  const notifs = await TeamNotification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean()

  res.json({ success: true, data: notifs })
})

// ─── Team member: mark all notifications read ────────────────────────────────

export const markMemberNotificationsRead = asyncHandler(async (req, res) => {
  await TeamNotification.updateMany({ recipient: req.user.id, read: false }, { read: true })
  res.json({ success: true, message: 'Notifications marked as read.' })
})

// ─── Team member: clear all notifications ────────────────────────────────────

export const clearMemberNotifications = asyncHandler(async (req, res) => {
  await TeamNotification.deleteMany({ recipient: req.user.id })
  res.json({ success: true, message: 'Notifications cleared.' })
})
