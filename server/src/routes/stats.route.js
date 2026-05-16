import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { getAdminStats } from '../controllers/stats.controller.js'

const router = express.Router()

router.route('/admin').get(authenticate, authorize('admin'), getAdminStats)

export default router
