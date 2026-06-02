import { Router } from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import {
  createCoupon, getCoupons, getCoupon, updateCoupon, deleteCoupon, bulkDeleteCoupons,
  validateCoupon, getCouponUsageTracking,
} from '../controllers/coupon.controller.js'

const router = Router()

router.route('/validate').post(authenticate, validateCoupon)

router.route('/tracking').get(authenticate, authorizeTeamPage('referrals'), getCouponUsageTracking)

router.route('/')
  .get(authenticate, authorizeTeamPage('referrals'), getCoupons)
  .post(authenticate, authorizeTeamPage('referrals'), logActivity('create', 'coupon', (req, body) => ({ resourceId: body?.data?._id, resourceName: req.body.code ?? '', details: 'Created coupon' })), createCoupon)

router.route('/bulk')
  .delete(authenticate, authorizeTeamPage('referrals'), logActivity('delete', 'coupon', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} coupons` })), bulkDeleteCoupons)

router.route('/:id')
  .get(authenticate, authorizeTeamPage('referrals'), getCoupon)
  .patch(authenticate, authorizeTeamPage('referrals'), logActivity('update', 'coupon', (req) => ({ resourceId: req.params.id, details: 'Updated coupon' })), updateCoupon)
  .delete(authenticate, authorizeTeamPage('referrals'), logActivity('delete', 'coupon', (req) => ({ resourceId: req.params.id, details: 'Deleted coupon' })), deleteCoupon)

export default router
