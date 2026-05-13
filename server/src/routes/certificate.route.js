import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  issueCertificate,
  getMyCertificates,
  getCertificate,
  revokeCertificate,
  getAllCertificates,
} from '../controllers/certificate.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/:id').get(getCertificate)

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/my').get(authenticate, authorize('student'), getMyCertificates)

// ─── Admin/Teacher routes ──────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('teacher', 'admin'), issueCertificate)
router.route('/:id/revoke').patch(authenticate, authorize('admin'), revokeCertificate)
router.route('/').get(authenticate, authorize('admin'), getAllCertificates)

export default router
