import { Router } from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import {
  createCoupon, getCoupons, getCoupon, updateCoupon, deleteCoupon,
  validateCoupon, getCouponUsageTracking,
} from '../controllers/coupon.controller.js'

const router = Router()

router.route('/validate').post(authenticate, validateCoupon)

router.route('/tracking').get(authenticate, authorizeTeamPage('referrals'), getCouponUsageTracking)

router.route('/')
  .get(authenticate, authorizeTeamPage('referrals'), getCoupons)
  .post(authenticate, authorizeTeamPage('referrals'), createCoupon)

router.route('/:id')
  .get(authenticate, authorizeTeamPage('referrals'), getCoupon)
  .patch(authenticate, authorizeTeamPage('referrals'), updateCoupon)
  .delete(authenticate, authorizeTeamPage('referrals'), deleteCoupon)

export default router
