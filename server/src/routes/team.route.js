import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  listTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../controllers/team.controller.js'

const router = express.Router()

// All team management routes are admin-only
router.use(authenticate, authorize('admin'))

router.route('/').get(listTeamMembers).post(createTeamMember)
router.route('/:id').get(getTeamMember).put(updateTeamMember).delete(deleteTeamMember)

export default router
