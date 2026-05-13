import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
    createUser,
    verifyEmail,
    loginUser,
    logoutUser,
    refreshToken,
    getUserProfile,
    getAllUsers,
    updateUserProfile,
    requestPasswordReset,
    resetPassword,
    deleteUser,
} from '../controllers/user.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/register').post(createUser)
router.route('/verify-email').post(verifyEmail)
router.route('/login').post(loginUser)
router.route('/refresh-token').post(refreshToken)
router.route('/forgot-password').post(requestPasswordReset)
router.route('/reset-password').post(resetPassword)

// ─── Protected routes (login required) ────────────────────────────────────────
router.route('/logout').post(authenticate, logoutUser)
router.route('/profile')
    .get(authenticate, getUserProfile)
    .patch(authenticate, updateUserProfile)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), getAllUsers)
router.route('/:id').delete(authenticate, authorize('admin'), deleteUser)

export default router
