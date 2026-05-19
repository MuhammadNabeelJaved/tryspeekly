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
