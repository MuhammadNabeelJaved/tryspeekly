import dns from 'dns'
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import app from './app.js'
import connectDB from './src/database/db.js'
import { setIO, emitToUser } from './src/utils/socket.js'
import Enrollment from './src/models/enrollment.model.js'
import Message from './src/models/message.model.js'
import TeamChat from './src/models/team-chat.model.js'
import User from './src/models/user.model.js'
import NewsletterCampaign from './src/models/newsletter-campaign.model.js'
import { dispatchCampaign } from './src/utils/newsletter-sender.js'

// Override DNS to use Google Public DNS for MongoDB Atlas SRV record lookup
dns.setServers(['8.8.8.8', '8.8.4.4'])

const PORT = process.env.PORT || 5000

const httpServer = createServer(app)

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || /^http:\/\/localhost:\d+$/,
    credentials: true,
  },
})

setIO(io)

// Socket.io auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Authentication required'))

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    socket.data.user = decoded
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})

io.on('connection', async (socket) => {
  const { id: userId, role } = socket.data.user ?? {}
  if (userId) socket.join(`user:${userId}`)

  if (role === 'student') {
    try {
      const enrollments = await Enrollment.find({ student: userId, isActive: true }).select('course').lean()
      enrollments.forEach((e) => socket.join(`course:${e.course}`))
    } catch (err) {
      console.warn('[Socket] failed to join course rooms for student:', err.message)
    }
  }

  // ─── Typing indicators ─────────────────────────────────────────────────────
  socket.on('typing', ({ receiverId }) => {
    if (userId && receiverId) emitToUser(receiverId, 'user_typing', { senderId: userId })
  })

  socket.on('stop_typing', ({ receiverId }) => {
    if (userId && receiverId) emitToUser(receiverId, 'user_stop_typing', { senderId: userId })
  })

  // ─── Mark messages as read ─────────────────────────────────────────────────
  socket.on('mark_read', async ({ senderId }) => {
    if (!userId || !senderId) return
    try {
      await Message.updateMany(
        { sender: senderId, receiver: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      )
      emitToUser(senderId, 'messages_read', { by: userId })
    } catch (err) {
      console.warn('[Socket] mark_read error:', err.message)
    }
  })

  // ─── Team chat ───────────────────────────────────────────────────────────────
  socket.on('team:message:send', async ({ toId, message }) => {
    if (!userId || !toId || !message?.trim()) return
    try {
      // Admin may only message a team_member; team_member may only message admin
      const sender = await User.findById(userId).select('role').lean()
      if (!sender) return
      const recipient = await User.findById(toId).select('role').lean()
      if (!recipient) return

      const validPair =
        (sender.role === 'admin' && recipient.role === 'team_member') ||
        (sender.role === 'team_member' && recipient.role === 'admin')
      if (!validPair) return

      const msg = await TeamChat.create({
        from: userId,
        to: toId,
        message: message.trim(),
      })
      const populated = await TeamChat.findById(msg._id)
        .populate('from', 'name profileImage role')
        .lean()

      emitToUser(toId, 'team:message:received', populated)
      emitToUser(userId, 'team:message:received', populated)
    } catch (err) {
      console.warn('[Socket] team:message:send error:', err.message)
    }
  })

  socket.on('team:message:read', async ({ threadPartnerId }) => {
    if (!userId || !threadPartnerId) return
    try {
      await TeamChat.updateMany(
        { from: threadPartnerId, to: userId, read: false },
        { read: true }
      )
      emitToUser(threadPartnerId, 'team:messages:read', { by: userId })
    } catch (err) {
      console.warn('[Socket] team:message:read error:', err.message)
    }
  })

  socket.on('disconnect', () => {
    if (userId) socket.leave(`user:${userId}`)
  })
})

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`✓ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  })
}).catch((err) => {
  console.error('✗ Failed to connect to MongoDB:', err.message)
  process.exit(1)
})

// ─── Newsletter scheduler — checks for due campaigns every 60 s ───────────────
setInterval(async () => {
  try {
    const due = await NewsletterCampaign.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() },
    }).lean()

    for (const campaign of due) {
      await NewsletterCampaign.findByIdAndUpdate(campaign._id, { status: 'sending' })
      dispatchCampaign(campaign._id).catch(async (err) => {
        console.error('[Newsletter scheduler] dispatch error:', err.message)
        await NewsletterCampaign.findByIdAndUpdate(campaign._id, { status: 'failed' })
      })
    }
  } catch (err) {
    console.warn('[Newsletter scheduler] error:', err.message)
  }
}, 60_000)
