import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { getActivityLogs, getActivitySummary } from '../controllers/activity-log.controller.js'

const router = Router()
router.use(authenticate, authorize('admin'))
router.get('/',        getActivityLogs)
router.get('/summary', getActivitySummary)
export default router
