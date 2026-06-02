import asyncHandler from '../utils/asyncHandler.js'
import Certificate from '../models/certificate.model.js'
import Enrollment from '../models/enrollment.model.js'
import User from '../models/user.model.js'
import Course from '../models/course.model.js'
import { sendEmail } from '../utils/email.js'

// Fire-and-forget: email the student that their certificate is ready.
async function emailCertificateIssued(cert) {
  try {
    const [student, course] = await Promise.all([
      User.findById(cert.student, 'name email').lean(),
      Course.findById(cert.course, 'title').lean(),
    ])
    if (!student?.email) return
    sendEmail({
      type: 'certificate_issued',
      to: student.email,
      toName: student.name,
      variables: {
        studentName: student.name,
        courseName: course?.title ?? 'your course',
        certificateId: cert.certificateId,
        certificateUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/certificate/${cert.certificateId}`,
      },
      metadata: { certificateId: cert._id },
    }).catch(() => {})
  } catch { /* ignore */ }
}

// POST /api/v1/certificates — admin/teacher: issue certificate
export const issueCertificate = asyncHandler(async (req, res) => {
  try {
    const { enrollmentId, credentialUrl } = req.body
    if (!enrollmentId) return res.status(400).json({ success: false, error: { message: 'Enrollment ID is required' } })

    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment) return res.status(404).json({ success: false, error: { message: 'Enrollment not found' } })

    const existing = await Certificate.findOne({ enrollment: enrollmentId })
    if (existing) return res.status(409).json({ success: false, error: { message: 'Certificate already issued for this enrollment' } })

    const certificate = await Certificate.create({
      enrollment: enrollmentId,
      student: enrollment.student,
      course: enrollment.course,
      credentialUrl,
    })

    emailCertificateIssued(certificate)

    res.status(201).json({ success: true, message: 'Certificate issued successfully', data: certificate })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/certificates/my — student: own certificates
export const getMyCertificates = asyncHandler(async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user.id, status: 'issued' })
      .populate('course', 'title thumbnail level')
      .populate({ path: 'enrollment', populate: { path: 'teacher', select: 'name' } })
      .sort({ issueDate: -1 })
    res.json({ success: true, data: certificates })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})

// GET /api/v1/certificates/:id — public
export const getCertificate = asyncHandler(async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'name')
      .populate('course', 'title')
    if (!certificate) return res.status(404).json({ success: false, error: { message: 'Certificate not found' } })
    res.json({ success: true, data: certificate })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/certificates/:id/revoke — admin
export const revokeCertificate = asyncHandler(async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
    if (!certificate) return res.status(404).json({ success: false, error: { message: 'Certificate not found' } })
    if (certificate.status === 'revoked') return res.status(400).json({ success: false, error: { message: 'Certificate already revoked' } })

    certificate.status = 'revoked'
    certificate.revokedAt = new Date()
    await certificate.save()

    res.json({ success: true, message: 'Certificate revoked', data: certificate })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/certificates/claim — student: self-claim when course is complete
export const claimCertificate = asyncHandler(async (req, res) => {
  try {
    const { enrollmentId } = req.body
    if (!enrollmentId) {
      return res.status(400).json({ success: false, message: 'Enrollment ID is required' })
    }

    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' })
    }

    if (enrollment.student.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only claim certificates for your own enrollments' })
    }

    const { sessionsAttended = 0, totalSessions = 0 } = enrollment.progress ?? {}
    if (totalSessions === 0 || sessionsAttended < totalSessions) {
      return res.status(400).json({
        success: false,
        message: `Course not yet complete: ${sessionsAttended}/${totalSessions} sessions attended`,
      })
    }

    const existing = await Certificate.findOne({ enrollment: enrollmentId })
      .populate('student', 'name')
      .populate('course', 'title level thumbnail')
      .populate({ path: 'enrollment', populate: { path: 'teacher', select: 'name' } })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Certificate already issued for this enrollment',
        data: existing,
      })
    }

    const cert = await Certificate.create({
      enrollment: enrollmentId,
      student: enrollment.student,
      course: enrollment.course,
    })

    const populated = await Certificate.findById(cert._id)
      .populate('student', 'name')
      .populate('course', 'title level thumbnail')
      .populate({ path: 'enrollment', populate: { path: 'teacher', select: 'name' } })

    emailCertificateIssued(cert)

    res.status(201).json({ success: true, message: 'Certificate claimed successfully', data: populated })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})

// GET /api/v1/certificates/verify/:certificateId — public: verify by human-readable ID
export const verifyCertificate = asyncHandler(async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
      status: 'issued',
    })
      .populate('student', 'name')
      .populate('course', 'title level thumbnail')
      .populate({ path: 'enrollment', populate: { path: 'teacher', select: 'name' } })

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found or has been revoked' })
    }

    res.json({ success: true, data: certificate })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})

// GET /api/v1/certificates — admin: all certificates
export const getAllCertificates = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = status ? { status } : {}
    const skip = (Number(page) - 1) * Number(limit)

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .populate('student', 'name email')
        .populate('course', 'title')
        .skip(skip)
        .limit(Number(limit))
        .sort({ issueDate: -1 }),
      Certificate.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: certificates,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/certificates/:id — admin: hard-delete a certificate record
export const deleteCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findByIdAndDelete(req.params.id)
  if (!cert) return res.status(404).json({ success: false, error: { message: 'Certificate not found' } })
  res.json({ success: true, message: 'Certificate deleted' })
})

// DELETE /api/v1/certificates/bulk — admin: hard-delete multiple certificates
export const bulkDeleteCertificates = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ success: false, error: { message: 'ids must be a non-empty array' } })
  const result = await Certificate.deleteMany({ _id: { $in: ids } })
  res.json({ success: true, message: `${result.deletedCount} certificate${result.deletedCount !== 1 ? 's' : ''} deleted`, data: { deleted: result.deletedCount } })
})
