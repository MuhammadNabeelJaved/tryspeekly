import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  issueCertificate,
  getMyCertificates,
  getCertificate,
  revokeCertificate,
  getAllCertificates,
  claimCertificate,
  verifyCertificate,
} from '../controllers/certificate.controller.js'

const router = express.Router()

// ─── Specific paths first (must come before /:id catch-all) ────────────────
router.route('/my').get(authenticate, authorize('student'), getMyCertificates)
router.route('/claim').post(authenticate, authorize('student'), claimCertificate)
router.route('/verify/:certificateId').get(verifyCertificate)
router.route('/').get(authenticate, authorize('admin'), getAllCertificates)
router.route('/').post(authenticate, authorize('teacher', 'admin'), issueCertificate)

// ─── Parameterised routes (must come AFTER all specific paths) ──────────────
router.route('/:id').get(getCertificate)
router.route('/:id/revoke').patch(authenticate, authorize('admin'), revokeCertificate)

export default router
