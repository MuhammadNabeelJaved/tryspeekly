import asyncHandler from '../utils/asyncHandler.js'
import Message from '../models/message.model.js'
import mongoose from 'mongoose'

// POST /api/v1/messages — send a message
export const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { receiverId, content } = req.body
    if (!receiverId || !content) return res.status(400).json({ success: false, error: { message: 'Receiver and content are required' } })
    if (receiverId === req.user.id.toString()) return res.status(400).json({ success: false, error: { message: 'Cannot send message to yourself' } })

    const message = await Message.create({ sender: req.user.id, receiver: receiverId, content })
    await message.populate('sender', 'name profileImage')

    res.status(201).json({ success: true, data: message })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/messages/conversations — get all conversation threads
export const getConversations = asyncHandler(async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id)

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $gt: ['$sender', '$receiver'] }, { s: '$sender', r: '$receiver' }, { s: '$receiver', r: '$sender' }],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$isRead', false] }, { $eq: ['$receiver', userId] }] }, 1, 0] } },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
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
      .populate('sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    // Mark messages as read
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
