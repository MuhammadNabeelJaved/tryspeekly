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
} from '../controllers/team.controller.js'

const router = express.Router()

// ─── Admin: team member CRUD ──────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), listTeamMembers)
router.route('/').post(authenticate, authorize('admin'), createTeamMember)
router.route('/:id').get(authenticate, authorize('admin'), getTeamMember)
router.route('/:id').put(authenticate, authorize('admin'), updateTeamMember)
router.route('/:id').delete(authenticate, authorize('admin'), deleteTeamMember)

// ─── Team member: chat with admin ────────────────────────────────────────────
router.route('/chat/me').get(authenticate, authorize('team_member'), getMemberThread)
router.route('/chat/me').post(authenticate, authorize('team_member'), sendMemberMessage)
router.route('/chat/me/read').patch(authenticate, authorize('team_member'), markMemberThreadRead)

// ─── Admin: chat with a specific team member ──────────────────────────────────
router.route('/chat/:memberId').get(authenticate, authorize('admin'), getAdminThread)
router.route('/chat/:memberId').post(authenticate, authorize('admin'), sendAdminMessage)
router.route('/chat/:memberId/read').patch(authenticate, authorize('admin'), markAdminThreadRead)

export default router
