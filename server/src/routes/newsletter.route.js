import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import {
  subscribe,
  getSubscribers,
  deleteSubscriber,
  adminUnsubscribe,
  unsubscribeByToken,
} from '../controllers/newsletter-subscriber.controller.js'
import {
  getCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
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

router.route('/subscribers').get(getSubscribers)
router.route('/subscribers/:id').delete(deleteSubscriber)
router.patch('/subscribers/:id/unsubscribe', adminUnsubscribe)

router.route('/campaigns').get(getCampaigns).post(createCampaign)
router.route('/campaigns/:id').get(getCampaign).put(updateCampaign).delete(deleteCampaign)
router.post('/campaigns/:id/send', sendCampaign)

export default router
