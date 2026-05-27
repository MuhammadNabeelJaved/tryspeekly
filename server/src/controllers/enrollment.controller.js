import asyncHandler from '../utils/asyncHandler.js'
import Enrollment from '../models/enrollment.model.js'
import Course from '../models/course.model.js'
import FinancialAid from '../models/financial-aid.model.js'

// POST /api/v1/enrollments — student enrolls in a course
export const createEnrollment = asyncHandler(async (req, res) => {
  try {
    const { courseId, paymentId } = req.body

    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    if (course.status !== 'published') return res.status(400).json({ success: false, error: { message: 'Course is not available for enrollment' } })

    const existing = await Enrollment.findOne({ student: req.user.id, course: courseId })
    if (existing) return res.status(409).json({ success: false, error: { message: 'Already enrolled in this course' } })

    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: courseId,
      teacher: course.teacher,
      payment: paymentId,
      progress: { totalSessions: course.totalSessions },
    })

    course.enrolledStudents.push(req.user.id)
    await course.save()

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
