import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadProfileImage, handleMulterError } from '../middlewares/multer.js'
import {
    createUser,
    verifyEmail,
    resendVerification,
    loginUser,
    logoutUser,
    refreshToken,
    getUserProfile,
    getAllUsers,
    getUserById,
    updateUserProfile,
    updateProfileImage,
    changePassword,
    requestPasswordReset,
    resetPassword,
    deleteUser,
    markOnboardingDone,
} from '../controllers/user.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/register').post(createUser)
router.route('/verify-email').post(verifyEmail)
router.route('/resend-verification').post(resendVerification)
router.route('/login').post(loginUser)
router.route('/refresh-token').post(refreshToken)
router.route('/forgot-password').post(requestPasswordReset)
router.route('/reset-password').post(resetPassword)

// ─── Protected routes (login required) ────────────────────────────────────────
router.route('/logout').post(authenticate, logoutUser)
router.route('/onboarding-done').patch(authenticate, markOnboardingDone)
router.route('/profile')
    .get(authenticate, getUserProfile)
    .patch(authenticate, updateUserProfile)
router.route('/profile/image')
    .patch(authenticate, uploadProfileImage, handleMulterError, updateProfileImage)
router.route('/change-password').post(authenticate, changePassword)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), getAllUsers)
router.route('/:id')
    .get(authenticate, authorize('admin'), getUserById)
    .delete(authenticate, authorize('admin'), deleteUser)

export default router
