import asyncHandler from '../utils/asyncHandler.js'
import Message from '../models/message.model.js'
import User from '../models/user.model.js'
import Enrollment from '../models/enrollment.model.js'
import { emitToUser } from '../utils/socket.js'
import mongoose from 'mongoose'

// POST /api/v1/messages — send a message
export const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { receiverId, content } = req.body
    if (!receiverId || !content) return res.status(400).json({ success: false, error: { message: 'Receiver and content are required' } })
    if (receiverId === req.user.id.toString()) return res.status(400).json({ success: false, error: { message: 'Cannot send message to yourself' } })

    const message = await Message.create({ sender: req.user.id, receiver: receiverId, content })
    await message.populate('sender', 'name profileImage role')

    emitToUser(receiverId, 'new_message', message)

    res.status(201).json({ success: true, data: message })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/messages/conversations — get conversation list with other user's info
export const getConversations = asyncHandler(async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id)

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ['$sender', '$receiver'] },
              { s: '$sender', r: '$receiver' },
              { s: '$receiver', r: '$sender' },
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$isRead', false] }, { $eq: ['$receiver', userId] }] }, 1, 0] },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      {
        $addFields: {
          otherUserId: {
            $cond: [{ $eq: ['$lastMessage.sender', userId] }, '$lastMessage.receiver', '$lastMessage.sender'],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'otherUserId',
          foreignField: '_id',
          as: 'userArr',
          pipeline: [{ $project: { name: 1, profileImage: 1, role: 1 } }],
        },
      },
      { $addFields: { user: { $arrayElemAt: ['$userArr', 0] } } },
      { $project: { userArr: 0, otherUserId: 0 } },
    ])

    await Message.populate(conversations, [
      { path: 'lastMessage.sender', select: 'name profileImage role' },
      { path: 'lastMessage.receiver', select: 'name profileImage role' },
    ])

    res.json({ success: true, data: conversations })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/messages/contacts — users available to message based on role
export const getContacts = asyncHandler(async (req, res) => {
  try {
    const { role, id: userId } = req.user
    let users = []

    if (role === 'student') {
      const enrollments = await Enrollment.find({ student: userId, isActive: true }).select('teacher')
      const teacherIds = [...new Set(enrollments.map(e => e.teacher?.toString()).filter(Boolean))]
      const [teachers, admins] = await Promise.all([
        User.find({ _id: { $in: teacherIds } }).select('name profileImage role'),
        User.find({ role: 'admin' }).select('name profileImage role'),
      ])
      users = [...teachers, ...admins]
    } else if (role === 'teacher') {
      const enrollments = await Enrollment.find({ teacher: userId, isActive: true }).select('student')
      const studentIds = [...new Set(enrollments.map(e => e.student.toString()))]
      const [students, admins] = await Promise.all([
        User.find({ _id: { $in: studentIds } }).select('name profileImage role'),
        User.find({ role: 'admin' }).select('name profileImage role'),
      ])
      users = [...students, ...admins]
    } else {
      users = await User.find({ role: { $in: ['student', 'teacher'] } })
        .select('name profileImage role')
        .limit(500)
        .sort({ name: 1 })
    }

    res.json({ success: true, data: users })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/messages/:userId — get messages with a specific user
export const getMessagesWith = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const otherId = req.params.userId

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: otherId },
        { sender: otherId, receiver: req.user.id },
      ],
    })
      .populate('sender', 'name profileImage role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    await Message.updateMany({ sender: otherId, receiver: req.user.id, isRead: false }, { isRead: true, readAt: new Date() })

    res.json({ success: true, data: messages.reverse() })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/messages/unread/count — get unread message count
export const getUnreadCount = asyncHandler(async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user.id, isRead: false })
    res.json({ success: true, data: { count } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
