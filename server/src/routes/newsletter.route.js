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
router.route('/subscribers/bulk').delete(bulkDeleteSubscribers)
router.route('/subscribers/:id').delete(logActivity('delete', 'newsletter-subscriber', (req) => ({ resourceId: req.params.id, details: 'Subscriber deleted' })), deleteSubscriber)
router.patch('/subscribers/:id/unsubscribe', adminUnsubscribe)

router.route('/campaigns').get(getCampaigns).post(createCampaign)
router.route('/campaigns/bulk').delete(bulkDeleteCampaigns)
router.route('/campaigns/:id').get(getCampaign).put(updateCampaign).delete(deleteCampaign)
router.post('/campaigns/:id/send', logActivity('send', 'newsletter-campaign', (req) => ({ resourceId: req.params.id, details: 'Campaign sent' })), sendCampaign)

export default router
