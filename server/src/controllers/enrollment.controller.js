import asyncHandler from '../utils/asyncHandler.js'
import Enrollment from '../models/enrollment.model.js'
import Course from '../models/course.model.js'
import FinancialAid from '../models/financial-aid.model.js'
import User from '../models/user.model.js'
import Coupon from '../models/coupon.model.js'
import Offer from '../models/offer.model.js'
import Payment from '../models/payment.model.js'
import { getEffectivePrice } from '../utils/offerUtils.js'
import { createAndEmitNotification } from '../utils/notify.js'
import { sendEmail } from '../utils/email.js'

// POST /api/v1/enrollments — student enrolls in a course
export const createEnrollment = asyncHandler(async (req, res) => {
  try {
    const { courseId, paymentId, couponCode } = req.body

    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    if (course.status !== 'published') return res.status(400).json({ success: false, error: { message: 'Course is not available for enrollment' } })

    const existing = await Enrollment.findOne({ student: req.user.id, course: courseId })
    if (existing) return res.status(409).json({ success: false, error: { message: 'Already enrolled in this course' } })

    let couponDoc = null
    let discountApplied = 0
    let offerDiscountApplied = 0
    let offerDoc = null
    let coursePrice = course.currency === 'USD' ? course.priceUSD : course.price

    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase().trim() })
      const isExpired = couponDoc?.expiresAt && couponDoc.expiresAt < new Date()
      const isExhausted = couponDoc?.maxUses != null && couponDoc.usedCount >= couponDoc.maxUses
      if (couponDoc && couponDoc.isActive && !isExpired && !isExhausted) {
        if (coursePrice && Number.isFinite(coursePrice)) {
          if (couponDoc.discountType === 'percentage') {
            discountApplied = Math.round((coursePrice * couponDoc.discountValue) / 100)
          } else {
            discountApplied = Math.min(couponDoc.discountValue, coursePrice)
          }
        }
      } else {
        return res.status(400).json({ success: false, error: { message: 'Invalid or expired coupon code' } })
      }
    }

    const now = new Date()
    const activeOffers = await Offer.find({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    }).lean()

    if (course && coursePrice) {
      const { discountedPrice, offer } = getEffectivePrice(courseId, coursePrice, activeOffers)
      if (offer) {
        offerDiscountApplied = coursePrice - discountedPrice
        offerDoc = offer
      }
    }

    const finalPrice = Math.max(0, coursePrice - discountApplied - offerDiscountApplied)
    let isFree = finalPrice === 0 && coursePrice > 0

    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: courseId,
      teacher: course.teacher,
      payment: paymentId || null,
      progress: { totalSessions: course.totalSessions },
      coupon: couponDoc ? couponDoc._id : null,
      discountApplied,
      offerDiscountApplied,
      offer: offerDoc ? offerDoc._id : null,
      isActive: isFree
    })

    if (isFree) {
      // Auto-create a payment record for the free enrollment
      const payment = await Payment.create({
        student: req.user.id,
        course: courseId,
        teacher: course.teacher,
        method: 'bank_local',
        transactionId: 'FREE_100_PERCENT',
        amount: 0,
        currency: course.currency || 'PKR',
        status: 'approved',
        adminNote: 'Auto-approved due to 100% discount',
        coupon: couponDoc ? couponDoc._id : null,
        discountApplied,
        offerDiscountApplied,
        offer: offerDoc ? offerDoc._id : null,
      })
      enrollment.payment = payment._id
      await enrollment.save()

      await createAndEmitNotification({
        recipientId: req.user.id,
        title: 'Enrollment Activated',
        message: `Your enrollment for "${course.title}" has been automatically approved due to a 100% discount.`,
        type: 'payment',
        severity: 'low',
        relatedId: enrollment._id,
        relatedType: 'Enrollment',
      })
    }

    course.enrolledStudents.push(req.user.id)
    await course.save()

    // Emails: student confirmation + teacher notification
    const [student, teacher] = await Promise.all([
      User.findById(req.user.id, 'name email').lean(),
      User.findById(course.teacher, 'name email').lean(),
    ])

    if (student) {
      sendEmail({
        type: 'enrollment_confirmed',
        to: student.email,
        toName: student.name,
        variables: {
          studentName: student.name,
          courseName: course.title,
          teacherName: teacher?.name ?? 'your instructor',
          courseLevel: course.level ?? 'N/A',
          courseType: course.type ?? 'N/A',
        },
        metadata: { enrollmentId: enrollment._id, courseId: course._id },
      }).catch(() => {})
    }

    if (teacher) {
      sendEmail({
        type: 'enrollment_teacher_notification',
        to: teacher.email,
        toName: teacher.name,
        variables: {
          teacherName: teacher.name,
          studentName: student?.name ?? 'A student',
          studentEmail: student?.email ?? '',
          courseName: course.title,
        },
        metadata: { enrollmentId: enrollment._id, courseId: course._id },
      }).catch(() => {})
    }

    res.status(201).json({ success: true, message: 'Enrolled successfully', data: enrollment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/enrollments/my — student: own enrollments
export const getMyEnrollments = asyncHandler(async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate('course', 'title thumbnail type level sessionDuration recurringSchedule totalSessions price priceUSD currency')
      .populate('teacher', 'name profileImage')
      .populate('payment', '_id status method amount currency screenshotUrl rejectionReason adminNote createdAt')
      .populate('financialAid', '_id status course name')
      .sort({ enrolledAt: -1 })
    res.json({ success: true, data: enrollments })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/enrollments/:id — student/teacher/admin
export const getEnrollment = asyncHandler(async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('student', 'name email profileImage')
      .populate('course', 'title thumbnail totalSessions')
      .populate('teacher', 'name profileImage')

    if (!enrollment) return res.status(404).json({ success: false, error: { message: 'Enrollment not found' } })

    const isStudent = enrollment.student._id.toString() === req.user.id.toString()
    const isTeacher = enrollment.teacher._id.toString() === req.user.id.toString()
    if (!isStudent && !isTeacher && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Not authorized' } })
    }

    res.json({ success: true, data: enrollment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/enrollments/teacher/my — teacher: their students
export const getTeacherEnrollments = asyncHandler(async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ teacher: req.user.id })
      .populate('student', 'name email profileImage')
      .populate('course', 'title')
      .sort({ enrolledAt: -1 })
    res.json({ success: true, data: enrollments })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/enrollments/:id/attendance — teacher: mark attendance
export const markAttendance = asyncHandler(async (req, res) => {
  try {
    const { sessionNumber, duration } = req.body
    const enrollment = await Enrollment.findById(req.params.id)
    if (!enrollment) return res.status(404).json({ success: false, error: { message: 'Enrollment not found' } })

    if (enrollment.teacher.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Not authorized' } })
    }

    enrollment.attendance.push({ sessionNumber, duration })
    enrollment.progress.sessionsAttended = enrollment.attendance.length
    enrollment.progress.lastAttendedAt = new Date()
    await enrollment.save()

    res.json({ success: true, message: 'Attendance marked', data: enrollment.progress })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/enrollments/by-financial-aid/:aidId — admin/student: get enrollment linked to a financial aid application
export const getEnrollmentByFinancialAid = asyncHandler(async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ financialAid: req.params.aidId })
      .populate('student', 'name email profileImage')
      .populate('course', 'title thumbnail level type totalSessions')
      .populate('teacher', 'name profileImage')
    if (!enrollment) return res.status(404).json({ success: false, error: { message: 'No enrollment found for this financial aid application' } })
    res.json({ success: true, data: enrollment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/enrollments/admin/financial-aid — admin: enroll student free via accepted financial aid
export const adminEnrollWithFinancialAid = asyncHandler(async (req, res) => {
  try {
    const { financialAidId, courseId, studentId: overrideStudentId } = req.body
    if (!financialAidId || !courseId) {
      return res.status(400).json({ success: false, error: { message: 'financialAidId and courseId are required' } })
    }

    const aid = await FinancialAid.findById(financialAidId).populate('student', '_id name email')
    if (!aid) return res.status(404).json({ success: false, error: { message: 'Financial aid application not found' } })
    if (aid.status !== 'accepted') {
      return res.status(400).json({ success: false, error: { message: 'Financial aid application must be accepted before enrolling' } })
    }

    const studentId = aid.student?._id || overrideStudentId
    if (!studentId) {
      return res.status(400).json({ success: false, error: { message: 'No registered student linked to this application. Provide a studentId.' } })
    }

    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    if (course.status !== 'published') {
      return res.status(400).json({ success: false, error: { message: 'Course is not available for enrollment' } })
    }

    const existing = await Enrollment.findOne({ student: studentId, course: courseId })
    if (existing) return res.status(409).json({ success: false, error: { message: 'Student is already enrolled in this course' } })

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      teacher: course.teacher,
      financialAid: financialAidId,
      isActive: true,
      progress: { totalSessions: course.totalSessions },
    })

    if (!course.enrolledStudents.includes(aid.student._id)) {
      course.enrolledStudents.push(aid.student._id)
      await course.save()
    }

    const populated = await Enrollment.findById(enrollment._id)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('teacher', 'name')

    res.status(201).json({ success: true, message: 'Student enrolled successfully with financial aid', data: populated })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/enrollments — admin: all enrollments
export const getAllEnrollments = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const [enrollments, total] = await Promise.all([
      Enrollment.find()
        .populate('student', 'name email profileImage')
        .populate('course', 'title level')
        .populate('teacher', 'name profileImage')
        .populate('payment', 'method amount currency status transactionId createdAt')
        .populate('financialAid', 'status name')
        .skip(skip)
        .limit(Number(limit))
        .sort({ enrolledAt: -1 }),
      Enrollment.countDocuments(),
    ])
    res.json({
      success: true,
      data: enrollments,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/enrollments/admin/unpaid — admin: enrollments with no payment record yet
export const getUnpaidEnrollments = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const filter = { payment: null, isActive: false, financialAid: null }
    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('student', 'name email profileImage')
        .populate('course', 'title level price priceUSD currency pricingType')
        .populate('teacher', 'name')
        .skip(skip)
        .limit(Number(limit))
        .sort({ enrolledAt: -1 }),
      Enrollment.countDocuments(filter),
    ])
    res.json({
      success: true,
      data: enrollments,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
