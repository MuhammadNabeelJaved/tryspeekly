import asyncHandler from '../utils/asyncHandler.js'
import Course from '../models/course.model.js'
import User from '../models/user.model.js'
import { uploadCourseThumbnail, deleteFile, extractPublicId } from '../utils/cloudinary.js'

// GET /api/v1/courses — public, with filters & pagination
export const getAllCourses = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 12, status = 'published', level, focus, type, search } = req.query
    const filter = { status }

    if (level) filter.level = level
    if (focus) filter.focus = focus
    if (type) filter.type = type
    if (search) filter.title = { $regex: search, $options: 'i' }

    const skip = (Number(page) - 1) * Number(limit)
    const [courses, total] = await Promise.all([
      Course.find(filter).populate('teacher', 'name profileImage').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Course.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: courses,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/courses/:id — public
export const getCourse = asyncHandler(async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'name profileImage bio')
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    res.json({ success: true, data: course })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/courses — teacher/admin
export const createCourse = asyncHandler(async (req, res) => {
  try {
    // Teachers always submit for review; admins can set their own status
    const status = req.user.role === 'admin' ? (req.body.status ?? 'draft') : 'pending'
    const course = await Course.create({ ...req.body, teacher: req.user.id, status })
    res.status(201).json({ success: true, message: 'Course submitted for review', data: course })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/courses/:id — teacher/admin
export const updateCourse = asyncHandler(async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })

    const isOwner = course.teacher.toString() === req.user.id.toString()
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Not authorized to update this course' } })
    }

    const disallowed = ['teacher', 'enrolledStudents']
    disallowed.forEach((f) => delete req.body[f])

    Object.assign(course, req.body)
    await course.save()

    res.json({ success: true, message: 'Course updated successfully', data: course })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/courses/:id/thumbnail — teacher/admin
export const updateCourseThumbnail = asyncHandler(async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No image file provided' } })

    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })

    if (course.thumbnail) {
      const publicId = extractPublicId(course.thumbnail)
      if (publicId) await deleteFile(publicId, 'image')
    }

    const result = await uploadCourseThumbnail(req.file.buffer, req.params.id)
    course.thumbnail = result.secure_url
    await course.save()

    res.json({ success: true, message: 'Thumbnail updated successfully', thumbnail: course.thumbnail })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/courses/:id — admin (soft delete)
export const deleteCourse = asyncHandler(async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })

    if (course.thumbnail) {
      const publicId = extractPublicId(course.thumbnail)
      if (publicId) await deleteFile(publicId, 'image')
    }

    course.isDeleted = true
    course.status = 'archived'
    await course.save()

    res.json({ success: true, message: 'Course deleted successfully' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/courses/teacher/my — teacher: own courses
export const getTeacherCourses = asyncHandler(async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user.id }).sort({ createdAt: -1 })
    res.json({ success: true, data: courses })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/courses/admin/all — admin: all courses any status
export const getAdminCourses = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query
    const filter = {}

    if (status && status !== 'all') filter.status = status
    if (search) filter.title = { $regex: search, $options: 'i' }

    const skip = (Number(page) - 1) * Number(limit)
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('teacher', 'name profileImage')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Course.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: courses,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/courses/:id/review — admin: approve or reject
export const reviewCourse = asyncHandler(async (req, res) => {
  try {
    const { action, reason } = req.body

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: { message: 'action must be "approve" or "reject"' } })
    }

    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    }
    if (course.status === 'published') {
      return res.status(400).json({ success: false, error: { message: 'Course is already published' } })
    }

    course.status = action === 'approve' ? 'published' : 'rejected'
    await course.save()

    // Push in-app notification to teacher
    const notificationType = action === 'approve' ? 'course_approved' : 'course_rejected'
    const notificationMessage = action === 'approve'
      ? `Your course "${course.title}" has been approved and is now live.`
      : `Your course "${course.title}" was rejected.${reason ? ` Reason: ${reason}` : ''}`

    await User.findByIdAndUpdate(course.teacher, {
      $push: {
        notifications: {
          type: notificationType,
          message: notificationMessage,
          read: false,
          createdAt: new Date(),
        },
      },
    })

    res.json({
      success: true,
      message: action === 'approve' ? 'Course approved and published' : 'Course rejected',
      data: course,
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
