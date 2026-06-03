import express from 'express'

import { chat } from '../controllers/ai-chat.controller.js'
import { optionalAuthenticate } from '../middlewares/auth.js'

const router = express.Router()

router.route('/').post(optionalAuthenticate, chat)

export default router
