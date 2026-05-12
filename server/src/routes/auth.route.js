import express from 'express'
import asyncHandler from '../utils/asyncHandler.js'
import * as authController from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register', asyncHandler(authController.register))
router.post('/login', asyncHandler(authController.login))
router.post('/refresh-token', asyncHandler(authController.refreshToken))
router.post('/logout', asyncHandler(authController.logout))
router.post('/forgot-password', asyncHandler(authController.forgotPassword))
router.post('/reset-password/:token', asyncHandler(authController.resetPassword))
router.post('/verify-email/:token', asyncHandler(authController.verifyEmail))
router.post('/resend-verification', asyncHandler(authController.resendVerification))

export default router