import express from 'express'
import asyncHandler from '../utils/asyncHandler.js'
import { authenticate } from '../middlewares/auth.js'
import * as userController from '../controllers/user.controller.js'

const router = express.Router()

router.use(authenticate)

router.route('/profile').post(asyncHandler(userController.updateProfile))
router.route('/change-password').post(asyncHandler(userController.changePassword))
router.route('/delete-account').post(asyncHandler(userController.deleteAccount))

export default router