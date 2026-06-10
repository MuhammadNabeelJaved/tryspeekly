import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { addFee, generateFees, getFees, updateFee, deleteFee, getMyFees } from '../controllers/monthly-fee.controller.js'

const router = express.Router()

// Student — own fee history (static path before /:id)
router.route('/my').get(authenticate, getMyFees)

// Admin — bulk generate
router.route('/generate').post(authenticate, authorize('admin'), generateFees)

// Admin — list / create
router.route('/')
  .get(authenticate, authorize('admin'), getFees)
  .post(authenticate, authorize('admin'), addFee)

// Admin — update / delete single record
router.route('/:id')
  .patch(authenticate, authorize('admin'), updateFee)
  .delete(authenticate, authorize('admin'), deleteFee)

export default router
