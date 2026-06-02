import asyncHandler from '../utils/asyncHandler.js'
import ActivityLog from '../models/activity-log.model.js'
import User from '../models/user.model.js'

// GET /api/v1/activity-logs  — admin only, paginated
export const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, teamMember, resource, startDate, endDate } = req.query
  const filter = {}
  if (teamMember)           filter.teamMember = teamMember
  if (resource)             filter.resource   = resource
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = new Date(startDate)
    if (endDate)   filter.createdAt.$lte = new Date(endDate)
  }
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await ActivityLog.countDocuments(filter)
  const logs  = await ActivityLog.find(filter)
    .populate('teamMember', 'name profileImage jobTitle')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()
  res.json({
    success: true,
    data: logs,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  })
})

// GET /api/v1/activity-logs/summary  — admin only, per-member counts last 30 days
export const getActivitySummary = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const rows = await ActivityLog.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$teamMember', count: { $sum: 1 }, lastAction: { $max: '$createdAt' } } },
    { $sort: { count: -1 } },
  ])
  const memberIds = rows.map(r => r._id).filter(Boolean)
  const members = await User.find({ _id: { $in: memberIds } }).select('name profileImage jobTitle').lean()
  const memberMap = {}
  members.forEach(m => { memberMap[m._id.toString()] = m })
  const data = rows.map(r => ({ ...r, member: memberMap[r._id?.toString()] ?? null }))
  res.json({ success: true, data })
})
