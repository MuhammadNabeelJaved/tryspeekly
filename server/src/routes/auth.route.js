const express = require('express')
const router = express.Router()
const { asyncHandler } = require('../utils/asyncHandler')
const authController = require('../controllers/auth.controller')

router.post('/register', asyncHandler(authController.register))
router.post('/login', asyncHandler(authController.login))
router.post('/refresh-token', asyncHandler(authController.refreshToken))
router.post('/logout', asyncHandler(authController.logout))
router.post('/forgot-password', asyncHandler(authController.forgotPassword))
router.post('/reset-password/:token', asyncHandler(authController.resetPassword))
router.post('/verify-email/:token', asyncHandler(authController.verifyEmail))
router.post('/resend-verification', asyncHandler(authController.resendVerification))

module.exports = router