import { Router } from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
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
router.patch('/settings/:type', logActivity('update', 'email-settings', (req) => ({ resourceName: req.params.type, details: `Updated email trigger: ${req.params.type}` })), updateSetting)
router.patch('/settings', logActivity('update', 'email-settings', () => ({ details: 'Bulk-updated email settings' })), bulkUpdateSettings)

// Templates
router.get('/templates', getTemplates)
router.get('/templates/:type', getTemplate)
router.put('/templates/:type', logActivity('update', 'email-template', (req) => ({ resourceName: req.params.type, details: `Updated email template: ${req.params.type}` })), updateTemplate)
router.post('/templates/:type/reset', logActivity('update', 'email-template', (req) => ({ resourceName: req.params.type, details: `Reset email template: ${req.params.type}` })), resetTemplate)
router.post('/templates/reset-all', logActivity('update', 'email-template', () => ({ details: 'Reset all email templates' })), resetAllTemplates)

// Logs
router.get('/logs', getLogs)
router.delete('/logs', logActivity('delete', 'email-log', () => ({ details: 'Cleared email logs' })), clearLogs)

// Test & Stats
router.post('/test', logActivity('send', 'email', (req) => ({ details: `Sent test email${req.body?.to ? ` to ${req.body.to}` : ''}` })), sendTestEmail)
router.get('/stats', getStats)

export default router
