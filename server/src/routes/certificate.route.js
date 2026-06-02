import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import {
  issueCertificate,
  getMyCertificates,
  getCertificate,
  revokeCertificate,
  getAllCertificates,
  claimCertificate,
  verifyCertificate,
  deleteCertificate,
  bulkDeleteCertificates,
} from '../controllers/certificate.controller.js'

const router = express.Router()

// ─── Specific paths first (must come before /:id catch-all) ────────────────
router.route('/my').get(authenticate, authorize('student'), getMyCertificates)
router.route('/claim').post(authenticate, authorize('student'), claimCertificate)
router.route('/verify/:certificateId').get(verifyCertificate)
router.route('/').get(authenticate, authorizeTeamPage('certificates'), getAllCertificates)
router.route('/').post(authenticate, authorize('teacher', 'admin'), issueCertificate)
router.route('/bulk').delete(authenticate, authorizeTeamPage('certificates'), logActivity('delete', 'certificate', (req) => ({ details: `Bulk-deleted ${req.body?.ids?.length ?? 0} certificates` })), bulkDeleteCertificates)

// ─── Parameterised routes (must come AFTER all specific paths) ──────────────
router.route('/:id').get(getCertificate)
router.route('/:id').delete(authenticate, authorizeTeamPage('certificates'), logActivity('delete', 'certificate', (req) => ({ resourceId: req.params.id, details: 'Certificate deleted' })), deleteCertificate)
router.route('/:id/revoke').patch(authenticate, authorizeTeamPage('certificates'), logActivity('update', 'certificate', (req) => ({ resourceId: req.params.id, details: 'Certificate revoked' })), revokeCertificate)

export default router
