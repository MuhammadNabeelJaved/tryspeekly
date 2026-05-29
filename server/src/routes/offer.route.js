import { Router } from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { getActiveOffers, getAllOffers, createOffer, updateOffer, deleteOffer } from '../controllers/offer.controller.js'

const router = Router()

// Public
router.get('/active', getActiveOffers)

// Admin / team members with referrals permission
router.route('/')
  .get(authenticate, authorizeTeamPage('referrals'))
  .post(authenticate, authorizeTeamPage('referrals'), createOffer)

router.route('/:id')
  .patch(authenticate, authorizeTeamPage('referrals'), updateOffer)
  .delete(authenticate, authorizeTeamPage('referrals'), deleteOffer)

export default router
