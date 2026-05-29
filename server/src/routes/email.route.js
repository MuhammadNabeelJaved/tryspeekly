import { Router } from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import {
  getSettings, updateSetting, bulkUpdateSettings,
  getTemplates, getTemplate, updateTemplate, resetTemplate, resetAllTemplates,
  getLogs, clearLogs,
  sendTestEmail,
  getStats,
} from '../controllers/email.controller.js'

const router = Router()

router.use(authenticate, authorizeTeamPage('email'))

// Settings
router.get('/settings', getSettings)
router.patch('/settings/:type', updateSetting)
router.patch('/settings', bulkUpdateSettings)

// Templates
router.get('/templates', getTemplates)
router.get('/templates/:type', getTemplate)
router.put('/templates/:type', updateTemplate)
router.post('/templates/:type/reset', resetTemplate)
router.post('/templates/reset-all', resetAllTemplates)

// Logs
router.get('/logs', getLogs)
router.delete('/logs', clearLogs)

// Test & Stats
router.post('/test', sendTestEmail)
router.get('/stats', getStats)

export default router
