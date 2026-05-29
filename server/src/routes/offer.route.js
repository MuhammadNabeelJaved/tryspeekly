import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { getActiveOffers, getAllOffers, createOffer, updateOffer, deleteOffer } from '../controllers/offer.controller.js'

const router = Router()

// Public
router.get('/active', getActiveOffers)

// Admin
// admin-only: no team member page permission maps to this endpoint
router.route('/')
  .get(authenticate, authorize('admin'), getAllOffers)
  .post(authenticate, authorize('admin'), createOffer)

router.route('/:id')
  .patch(authenticate, authorize('admin'), updateOffer)
  .delete(authenticate, authorize('admin'), deleteOffer)

export default router
