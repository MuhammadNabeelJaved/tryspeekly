import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import {
  subscribe,
  getSubscribers,
  deleteSubscriber,
  adminUnsubscribe,
  unsubscribeByToken,
  bulkDeleteSubscribers,
  getNewsletterStats,
  getNewsletterGrowth,
} from '../controllers/newsletter-subscriber.controller.js'
import {
  getCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  bulkDeleteCampaigns,
} from '../controllers/newsletter-campaign.controller.js'

const router = Router()

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many subscribe attempts. Please try again later.' },
})

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/subscribers', subscribeLimiter, subscribe)
router.get('/unsubscribe', unsubscribeByToken)

// ─── Admin & team members with newsletter permission ──────────────────────────
router.use(authenticate, authorizeTeamPage('newsletter'))

router.get('/stats',  getNewsletterStats)
router.get('/growth', getNewsletterGrowth)

router.route('/subscribers').get(getSubscribers)
router.route('/subscribers/bulk').delete(logActivity('delete', 'newsletter-subscriber', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} subscribers` })), bulkDeleteSubscribers)
router.route('/subscribers/:id').delete(logActivity('delete', 'newsletter-subscriber', (req) => ({ resourceId: req.params.id, details: 'Subscriber deleted' })), deleteSubscriber)
router.patch('/subscribers/:id/unsubscribe', logActivity('update', 'newsletter-subscriber', (req) => ({ resourceId: req.params.id, details: 'Unsubscribed subscriber' })), adminUnsubscribe)

router.route('/campaigns').get(getCampaigns).post(logActivity('create', 'newsletter-campaign', (req, body) => ({ resourceId: body?.data?._id, resourceName: req.body.subject ?? '', details: 'Created campaign' })), createCampaign)
router.route('/campaigns/bulk').delete(logActivity('delete', 'newsletter-campaign', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} campaigns` })), bulkDeleteCampaigns)
router.route('/campaigns/:id').get(getCampaign).put(logActivity('update', 'newsletter-campaign', (req) => ({ resourceId: req.params.id, details: 'Updated campaign' })), updateCampaign).delete(logActivity('delete', 'newsletter-campaign', (req) => ({ resourceId: req.params.id, details: 'Deleted campaign' })), deleteCampaign)
router.post('/campaigns/:id/send', logActivity('send', 'newsletter-campaign', (req) => ({ resourceId: req.params.id, details: 'Campaign sent' })), sendCampaign)

export default router
