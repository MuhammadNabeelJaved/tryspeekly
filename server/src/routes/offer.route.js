import { Router } from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { getActiveOffers, getAllOffers, createOffer, updateOffer, deleteOffer } from '../controllers/offer.controller.js'

const router = Router()

// Public
router.get('/active', getActiveOffers)

// Admin / team members with referrals permission (AdminReferrals page manages offers)
router.route('/')
  .get(authenticate, authorizeTeamPage('referrals'))
  .post(authenticate, authorize('admin'), createOffer)

router.route('/:id')
  .patch(authenticate, authorize('admin'), updateOffer)
  .delete(authenticate, authorize('admin'), deleteOffer)

export default router
