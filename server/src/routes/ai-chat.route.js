import express from 'express'
import rateLimit from 'express-rate-limit'

import { chat } from '../controllers/ai-chat.controller.js'
import { optionalAuthenticate } from '../middlewares/auth.js'

const router = express.Router()

// Tighter limit than the global one: this endpoint can trigger a paid AI API call,
// so cap how many messages a single IP can send to protect cost.
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many chat messages. Please wait a few minutes and try again.' },
})

router.route('/').post(chatLimiter, optionalAuthenticate, chat)

export default router
