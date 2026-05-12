import express from 'express'
import asyncHandler from '../utils/asyncHandler.js'
import { authenticate } from '../middlewares/auth.js'
import * as userController from '../controllers/user.controller.js'

const router = express.Router()

router.use(authenticate)

router.get('/profile', asyncHandler(userController.getProfile))
router.put('/profile', asyncHandler(userController.updateProfile))
router.put('/password', asyncHandler(userController.updatePassword))
router.delete('/account', asyncHandler(userController.deleteAccount))

export default router