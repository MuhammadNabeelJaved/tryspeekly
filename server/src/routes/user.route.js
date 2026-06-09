import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { ForbiddenError } from '../utils/apiErrors.js'
import { uploadProfileImage, handleMulterError } from '../middlewares/multer.js'
import {
    createUser,
    adminCreateUser,
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
    bulkDeleteUsers,
    markOnboardingDone,
    changeUserRole,
    blockUser,
    getPublicTeachers,
    getHomeInstructors,
    toggleShowOnHome,
    getCoursesPageInstructors,
    toggleShowOnCoursesPage,
} from '../controllers/user.controller.js'


// Passes for admin or any verified team_member (read-only user lookup)
const allowTeamMember = (req, res, next) => {
    if (!req.user) return next(new ForbiddenError('Not authenticated.'))
    if (req.user.role === 'admin' || req.user.role === 'team_member') return next()
    return next(new ForbiddenError('Access denied.'))
}

const router = express.Router()


// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/public-teachers').get(getPublicTeachers)
router.route('/home-instructors').get(getHomeInstructors)
router.route('/courses-instructors').get(getCoursesPageInstructors)
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
router.route('/')
    .get(authenticate, authorizeTeamPage('students', 'instructors'), getAllUsers)
    .post(authenticate, authorize('admin'), adminCreateUser)
router.route('/bulk').delete(authenticate, authorize('admin'), bulkDeleteUsers)
router.route('/:id/role').patch(authenticate, authorize('admin'), changeUserRole)
router.route('/:id/block').patch(authenticate, authorize('admin'), blockUser)
router.route('/:id/show-on-home').patch(authenticate, authorize('admin'), toggleShowOnHome)
router.route('/:id/show-on-courses').patch(authenticate, authorize('admin'), toggleShowOnCoursesPage)
router.route('/:id')
    .get(authenticate, allowTeamMember, getUserById)
    .delete(authenticate, authorize('admin'), deleteUser)

export default router
