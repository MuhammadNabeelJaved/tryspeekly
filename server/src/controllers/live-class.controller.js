import asyncHandler from '../utils/asyncHandler.js'
import LiveClass from '../models/live-class.model.js'
import Course from '../models/course.model.js'
import Enrollment from '../models/enrollment.model.js'
import Notification from '../models/notification.model.js'
import User from '../models/user.model.js'
import { getIO, emitToUser } from '../utils/socket.js'
import { sendEmail } from '../utils/email.js'

// POST /api/v1/live-classes - Create/start a live class
export const createLiveClass = asyncHandler(async (req, res) => {
  const { courseId, meetingLink, classNumber } = req.body

  const course = await Course.findById(courseId)
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' })
  }

  if (course.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to start live class for this course' })
  }

  const existingActive = await LiveClass.findOne({
    course: courseId,
    status: 'active',
  })

  if (existingActive) {
    return res.status(400).json({ success: false, message: 'An active live class already exists for this course' })
  }

  const liveClass = await LiveClass.create({
    course: courseId,
    teacher: req.user.id,
    meetingLink,
    classNumber,
    status: 'active',
  })

  await liveClass.populate('course', 'title totalSessions')
  await liveClass.populate('teacher', 'name profileImage')

  getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

  // ─── Notify all enrolled students ─────────────────────────────────────────
  try {
    const enrollments = await Enrollment.find({ course: courseId }).select('student').lean()

    if (enrollments.length > 0) {
      const notifDocs = enrollments.map(e => ({
        recipient: e.student,
        title: 'Live Class Started!',
        message: `${course.title} is now live. Join your class now!`,
        type: 'course',
        severity: 'high',
        relatedId: liveClass._id,
        relatedType: 'LiveClass',
      }))

      const saved = await Notification.insertMany(notifDocs)
      saved.forEach(notif => emitToUser(notif.recipient, 'new_notification', notif))
    }
  } catch (err) {
    console.warn('[LiveClass] failed to send student notifications:', err.message)
  }

  // Emails: teacher confirmation + all enrolled students
  const teacher = await User.findById(req.user.id, 'name email').lean()
  if (teacher) {
    sendEmail({
      type: 'live_class_started_teacher',
      to: teacher.email,
      toName: teacher.name,
      variables: {
        teacherName: teacher.name,
        courseName: liveClass.course.title,
        meetingLink,
        classNumber: classNumber ?? 'N/A',
      },
      metadata: { liveClassId: liveClass._id },
    }).catch(() => {})
  }

  // Email enrolled students (fire-and-forget in background)
  ;(async () => {
    try {
      const enrollments = await Enrollment.find({ course: courseId }).select('student').lean()
      const studentIds = enrollments.map(e => e.student)
      const students = await User.find({ _id: { $in: studentIds } }, 'name email').lean()
      for (const student of students) {
        await sendEmail({
          type: 'live_class_started_student',
          to: student.email,
          toName: student.name,
          variables: {
            studentName: student.name,
            courseName: liveClass.course.title,
            teacherName: teacher?.name ?? 'Your instructor',
            meetingLink,
            classNumber: classNumber ?? 'N/A',
          },
          metadata: { liveClassId: liveClass._id, courseId },
        })
      }
    } catch (err) {
      console.warn('[LiveClass] email send error:', err.message)
    }
  })()

  res.status(201).json({
    success: true,
    message: 'Live class started successfully',
    data: liveClass,
  })
})

// PATCH /api/v1/live-classes/:id - Update live class (meeting link)
export const updateLiveClass = asyncHandler(async (req, res) => {
  const { meetingLink } = req.body

  const liveClass = await LiveClass.findById(req.params.id)
  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Live class not found' })
  }

  if (liveClass.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this live class' })
  }

  liveClass.meetingLink = meetingLink
  await liveClass.save()

  await liveClass.populate('course', 'title totalSessions')
  await liveClass.populate('teacher', 'name profileImage')

  getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

  res.json({
    success: true,
    message: 'Live class updated successfully',
    data: liveClass,
  })
})

// PATCH /api/v1/live-classes/:id/complete - Mark live class as completed
export const completeLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id)
  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Live class not found' })
  }

  if (liveClass.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to complete this live class' })
  }

  liveClass.status = 'completed'
  await liveClass.save()

  await liveClass.populate('course', 'title totalSessions')
  await liveClass.populate('teacher', 'name profileImage')

  getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

  try {
    const enrollments = await Enrollment.find({ course: liveClass.course._id }).select('student').lean()
    enrollments.forEach(e => emitToUser(e.student, 'live-class:ended', { liveClassId: liveClass._id }))
  } catch {}

  res.json({
    success: true,
    message: 'Live class marked as completed',
    data: liveClass,
  })
})

// PATCH /api/v1/live-classes/:id/cancel - Cancel live class
export const cancelLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id)
  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Live class not found' })
  }

  if (liveClass.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to cancel this live class' })
  }

  liveClass.status = 'cancelled'
  await liveClass.save()

  await liveClass.populate('course', 'title totalSessions')
  await liveClass.populate('teacher', 'name profileImage')

  getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

  try {
    const enrollments = await Enrollment.find({ course: liveClass.course._id }).select('student').lean()
    enrollments.forEach(e => emitToUser(e.student, 'live-class:ended', { liveClassId: liveClass._id }))
  } catch {}

  res.json({
    success: true,
    message: 'Live class cancelled',
    data: liveClass,
  })
})

// GET /api/v1/live-classes/active - Get all active live classes (for students)
export const getActiveLiveClasses = asyncHandler(async (req, res) => {
  const liveClasses = await LiveClass.find({ status: 'active' })
    .populate('course', 'title totalSessions')
    .populate('teacher', 'name profileImage')
    .sort({ createdAt: -1 })

  res.json({
    success: true,
    data: liveClasses,
  })
})

// GET /api/v1/live-classes/course/:courseId - Get live class for specific course
export const getLiveClassByCourse = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findOne({
    course: req.params.courseId,
    status: 'active',
  })
    .populate('course', 'title totalSessions')
    .populate('teacher', 'name profileImage')

  res.json({
    success: true,
    data: liveClass,
  })
})

// GET /api/v1/live-classes/teacher - Get teacher's all live classes
export const getTeacherLiveClasses = asyncHandler(async (req, res) => {
  const liveClasses = await LiveClass.find({ teacher: req.user.id })
    .populate('course', 'title totalSessions')
    .sort({ createdAt: -1 })

  res.json({
    success: true,
    data: liveClasses,
  })
})

// GET /api/v1/live-classes/teacher/completed - Get teacher's completed live classes
export const getTeacherCompletedClasses = asyncHandler(async (req, res) => {
  const liveClasses = await LiveClass.find({
    teacher: req.user.id,
    status: 'completed',
  })
    .populate('course', 'title totalSessions')
    .sort({ createdAt: -1 })

  res.json({
    success: true,
    data: liveClasses,
  })
})

// POST /api/v1/live-classes/schedule - Create a scheduled class
export const scheduleClass = asyncHandler(async (req, res) => {
  const { courseId, scheduledAt } = req.body

  if (!courseId || !scheduledAt) {
    return res.status(400).json({ success: false, message: 'courseId and scheduledAt are required' })
  }

  const course = await Course.findById(courseId)
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' })
  }

  if (course.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to schedule class for this course' })
  }

  // Remove any existing scheduled class for this course before creating new one
  await LiveClass.updateMany(
    { course: courseId, teacher: req.user.id, status: 'scheduled' },
    { isDeleted: true }
  )

  const liveClass = await LiveClass.create({
    course: courseId,
    teacher: req.user.id,
    meetingLink: '',
    classNumber: 0,
    scheduledAt: new Date(scheduledAt),
    status: 'scheduled',
  })

  await liveClass.populate('course', 'title totalSessions')
  await liveClass.populate('teacher', 'name profileImage')

  getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

  res.status(201).json({
    success: true,
    message: 'Class scheduled successfully',
    data: liveClass,
  })
})

// PATCH /api/v1/live-classes/:id/reschedule - Update scheduled datetime
export const updateSchedule = asyncHandler(async (req, res) => {
  const { scheduledAt } = req.body

  if (!scheduledAt) {
    return res.status(400).json({ success: false, message: 'scheduledAt is required' })
  }

  const liveClass = await LiveClass.findById(req.params.id)
  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Scheduled class not found' })
  }

  if (liveClass.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this schedule' })
  }

  if (liveClass.status !== 'scheduled') {
    return res.status(400).json({ success: false, message: 'Only scheduled classes can be rescheduled' })
  }

  liveClass.scheduledAt = new Date(scheduledAt)
  await liveClass.save()

  await liveClass.populate('course', 'title totalSessions')
  await liveClass.populate('teacher', 'name profileImage')

  getIO()?.to(`course:${liveClass.course._id}`).emit('live-class:updated', liveClass)

  res.json({
    success: true,
    message: 'Schedule updated successfully',
    data: liveClass,
  })
})

// GET /api/v1/live-classes/student/upcoming - Get scheduled+active live classes for student's enrolled courses
export const getStudentUpcomingClasses = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user.id }).select('course')
  const courseIds = enrollments.map((e) => e.course)

  const liveClasses = await LiveClass.find({
    course: { $in: courseIds },
    status: { $in: ['scheduled', 'active'] },
  })
    .populate('course', 'title totalSessions')
    .populate('teacher', 'name profileImage')
    .sort({ scheduledAt: 1, createdAt: -1 })

  res.json({ success: true, data: liveClasses })
})

// DELETE /api/v1/live-classes/:id/schedule - Remove a scheduled class
export const deleteSchedule = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id)
  if (!liveClass) {
    return res.status(404).json({ success: false, message: 'Scheduled class not found' })
  }

  if (liveClass.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this schedule' })
  }

  if (liveClass.status !== 'scheduled') {
    return res.status(400).json({ success: false, message: 'Only scheduled classes can be deleted this way' })
  }

  liveClass.isDeleted = true
  await liveClass.save()

  // liveClass.course is unpopulated ObjectId here — template literal coercion is correct
  getIO()?.to(`course:${liveClass.course}`).emit('live-class:deleted', { _id: liveClass._id })

  res.json({
    success: true,
    message: 'Schedule removed successfully',
    data: null,
  })
})