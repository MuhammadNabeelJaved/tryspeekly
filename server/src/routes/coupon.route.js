import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  createCoupon, getCoupons, getCoupon, updateCoupon, deleteCoupon, validateCoupon,
} from '../controllers/coupon.controller.js'

const router = Router()

router.route('/validate').post(authenticate, validateCoupon)

router.route('/')
  .get(authenticate, authorize('admin'), getCoupons)
  .post(authenticate, authorize('admin'), createCoupon)

router.route('/:id')
  .get(authenticate, authorize('admin'), getCoupon)
  .patch(authenticate, authorize('admin'), updateCoupon)
  .delete(authenticate, authorize('admin'), deleteCoupon)

export default router
