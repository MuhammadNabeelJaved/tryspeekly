import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  listTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getAdminThread,
  sendAdminMessage,
  markAdminThreadRead,
  getMemberThread,
  sendMemberMessage,
  markMemberThreadRead,
  getMemberNotifications,
  markMemberNotificationsRead,
  clearMemberNotifications,
} from '../controllers/team.controller.js'

const router = express.Router()

// ─── Admin: team member CRUD ──────────────────────────────────────────────────
router
  .route('/')
  .get(authenticate, authorize('admin'), listTeamMembers)
  .post(authenticate, authorize('admin'), createTeamMember)

// ─── Team member: permission notifications (must be before /:id) ─────────────
router
  .route('/notifications/me')
  .get(authenticate, authorize('team_member'), getMemberNotifications)
  .patch(authenticate, authorize('team_member'), markMemberNotificationsRead)
  .delete(authenticate, authorize('team_member'), clearMemberNotifications)

router
  .route('/:id')
  .get(authenticate, authorize('admin'), getTeamMember)
  .put(authenticate, authorize('admin'), updateTeamMember)
  .delete(authenticate, authorize('admin'), deleteTeamMember)

// ─── Team member: chat with admin (must be before /:id routes) ───────────────
router
  .route('/chat/me')
  .get(authenticate, authorize('team_member'), getMemberThread)
  .post(authenticate, authorize('team_member'), sendMemberMessage)

router
  .route('/chat/me/read')
  .patch(authenticate, authorize('team_member'), markMemberThreadRead)

// ─── Admin: chat with a specific team member ──────────────────────────────────
router
  .route('/chat/:memberId')
  .get(authenticate, authorize('admin'), getAdminThread)
  .post(authenticate, authorize('admin'), sendAdminMessage)

router
  .route('/chat/:memberId/read')
  .patch(authenticate, authorize('admin'), markAdminThreadRead)

export default router
