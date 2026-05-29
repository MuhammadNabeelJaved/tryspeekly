import express from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { getAdminStats } from '../controllers/stats.controller.js'

const router = express.Router()

router.route('/admin').get(authenticate, authorizeTeamPage('overview'), getAdminStats)

export default router
