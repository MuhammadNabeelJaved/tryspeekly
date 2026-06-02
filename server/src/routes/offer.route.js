import { Router } from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import { getActiveOffers, getAllOffers, createOffer, updateOffer, deleteOffer, bulkDeleteOffers } from '../controllers/offer.controller.js'

const router = Router()

// Public
router.get('/active', getActiveOffers)

// Admin / team members with referrals permission
router.route('/')
  .get(authenticate, authorizeTeamPage('referrals'), getAllOffers)
  .post(authenticate, authorizeTeamPage('referrals'), logActivity('create', 'offer', (req, body) => ({ resourceId: body?.data?._id, resourceName: req.body.title ?? '', details: 'Created offer' })), createOffer)

router.route('/bulk')
  .delete(authenticate, authorizeTeamPage('referrals'), logActivity('delete', 'offer', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} offers` })), bulkDeleteOffers)

router.route('/:id')
  .patch(authenticate, authorizeTeamPage('referrals'), logActivity('update', 'offer', (req) => ({ resourceId: req.params.id, details: 'Updated offer' })), updateOffer)
  .delete(authenticate, authorizeTeamPage('referrals'), logActivity('delete', 'offer', (req) => ({ resourceId: req.params.id, details: 'Deleted offer' })), deleteOffer)

export default router
