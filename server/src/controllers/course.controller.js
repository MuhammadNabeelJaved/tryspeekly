import asyncHandler from '../utils/asyncHandler.js'
import Course from '../models/course.model.js'
import User from '../models/user.model.js'
import { uploadCourseThumbnail, uploadCourseVideoPreview, deleteFile, extractPublicId } from '../utils/cloudinary.js'

// GET /api/v1/courses — public, with filters & pagination
export const getAllCourses = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 12, level, focus, type, search } = req.query
    const filter = { status: 'published' }

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

    // Non-published courses only visible to admin or the course's own teacher
    const isAdmin = req.user?.role === 'admin'
    const isOwner = course.teacher?._id?.toString() === req.user?.id?.toString()
    if (course.status !== 'published' && !isAdmin && !isOwner) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    }

    res.json({ success: true, data: course })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/courses — teacher/admin
export const createCourse = asyncHandler(async (req, res) => {
  try {
    const status = req.user.role === 'admin' ? (req.body.status ?? 'draft') : 'pending'
    // Teachers cannot set price or currency — admin controls pricing
    if (req.user.role !== 'admin') {
      delete req.body.price
      delete req.body.currency
    }
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
    if (req.user.role !== 'admin') disallowed.push('status', 'price', 'currency')
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

// PATCH /api/v1/courses/:id/video-preview — teacher/admin
export const updateCourseVideoPreview = asyncHandler(async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No video file provided' } })

    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })

    if (course.videoPreview) {
      const publicId = extractPublicId(course.videoPreview)
      if (publicId) await deleteFile(publicId, 'video').catch(() => {})
    }

    const result = await uploadCourseVideoPreview(req.file.buffer, req.params.id)
    course.videoPreview = result.secure_url
    await course.save()

    res.json({ success: true, message: 'Video preview updated successfully', videoPreview: course.videoPreview })
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

// PATCH /api/v1/courses/:id/submit — teacher: re-submit a rejected course for review
export const submitCourseForReview = asyncHandler(async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } })

    const isOwner = course.teacher.toString() === req.user.id.toString()
    if (!isOwner) return res.status(403).json({ success: false, error: { message: 'Not authorized' } })

    if (course.status !== 'rejected') {
      return res.status(400).json({ success: false, error: { message: 'Only rejected courses can be resubmitted' } })
    }

    course.status = 'pending'
    await course.save()

    res.json({ success: true, message: 'Course resubmitted for review', data: course })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/courses/:id/review — admin: approve or reject
export const reviewCourse = asyncHandler(async (req, res) => {
  try {
    const { action, reason, price, currency } = req.body

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: { message: 'action must be "approve" or "reject"' } })
    }

    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } })
    }
    if (course.status !== 'pending') {
      return res.status(400).json({ success: false, error: { message: 'Only pending courses can be reviewed' } })
    }

    course.status = action === 'approve' ? 'published' : 'rejected'
    // Admin sets price and currency at approval time
    if (action === 'approve') {
      if (price !== undefined && price >= 0) course.price = price
      if (currency && ['PKR', 'USD'].includes(currency)) course.currency = currency
    }
    await course.save()

    // Push in-app notification to teacher (fire-and-forget — notification failure must not roll back status change)
    const notificationType = action === 'approve' ? 'course_approved' : 'course_rejected'
    const notificationMessage = action === 'approve'
      ? `Your course "${course.title}" has been approved and is now live.`
      : `Your course "${course.title}" was rejected.${reason ? ` Reason: ${reason}` : ''}`

    User.findByIdAndUpdate(course.teacher, {
      $push: {
        notifications: {
          type: notificationType,
          message: notificationMessage,
          read: false,
          createdAt: new Date(),
        },
      },
    }).catch(err => console.error('[reviewCourse] notification push failed:', err))

    res.json({
      success: true,
      message: action === 'approve' ? 'Course approved and published' : 'Course rejected',
      data: course,
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// ─── Materials ────────────────────────────────────────────────────────────────

// GET /api/v1/courses/:id/materials
export const getMaterials = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).select('materials teacher')
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  res.json({ success: true, data: course.materials })
})

// POST /api/v1/courses/:id/materials
export const addMaterial = asyncHandler(async (req, res) => {
  const { title, link } = req.body
  if (!title || !link) return res.status(400).json({ success: false, message: 'title and link are required' })

  const course = await Course.findById(req.params.id).select('materials teacher')
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  if (course.teacher.toString() !== req.user.id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized' })

  course.materials.push({ title, link })
  await course.save()
  const added = course.materials[course.materials.length - 1]
  res.status(201).json({ success: true, message: 'Material shared successfully', data: added })
})

// PATCH /api/v1/courses/:id/materials/:materialId
export const updateMaterial = asyncHandler(async (req, res) => {
  const { title, link } = req.body
  const course = await Course.findById(req.params.id).select('materials teacher')
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  if (course.teacher.toString() !== req.user.id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized' })

  const material = course.materials.id(req.params.materialId)
  if (!material) return res.status(404).json({ success: false, message: 'Material not found' })

  if (title) material.title = title
  if (link) material.link = link
  await course.save()
  res.json({ success: true, message: 'Material updated', data: material })
})

// DELETE /api/v1/courses/:id/materials/:materialId
export const deleteMaterial = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).select('materials teacher')
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  if (course.teacher.toString() !== req.user.id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized' })

  const material = course.materials.id(req.params.materialId)
  if (!material) return res.status(404).json({ success: false, message: 'Material not found' })

  material.deleteOne()
  await course.save()
  res.json({ success: true, message: 'Material deleted' })
})

// ─── Syllabus ─────────────────────────────────────────────────────────────────

// GET /api/v1/courses/:id/syllabus
export const getSyllabus = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).select('syllabus teacher')
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  res.json({ success: true, data: course.syllabus.sort((a, b) => a.week - b.week) })
})

// POST /api/v1/courses/:id/syllabus
export const addSyllabusTopic = asyncHandler(async (req, res) => {
  const { week, title, description, status } = req.body
  if (!week || !title) return res.status(400).json({ success: false, message: 'week and title are required' })

  const course = await Course.findById(req.params.id).select('syllabus teacher')
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  if (course.teacher.toString() !== req.user.id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized' })

  course.syllabus.push({ week, title, description: description || '', status: status || 'pending' })
  await course.save()
  const added = course.syllabus[course.syllabus.length - 1]
  res.status(201).json({ success: true, message: 'Syllabus topic added', data: added })
})

// PATCH /api/v1/courses/:id/syllabus/:topicId
export const updateSyllabusTopic = asyncHandler(async (req, res) => {
  const { week, title, description, status } = req.body
  const course = await Course.findById(req.params.id).select('syllabus teacher')
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  if (course.teacher.toString() !== req.user.id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized' })

  const topic = course.syllabus.id(req.params.topicId)
  if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' })

  if (week !== undefined) topic.week = week
  if (title) topic.title = title
  if (description !== undefined) topic.description = description
  if (status) topic.status = status
  await course.save()
  res.json({ success: true, message: 'Topic updated', data: topic })
})

// DELETE /api/v1/courses/:id/syllabus/:topicId
export const deleteSyllabusTopic = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).select('syllabus teacher')
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  if (course.teacher.toString() !== req.user.id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized' })

  const topic = course.syllabus.id(req.params.topicId)
  if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' })

  topic.deleteOne()
  await course.save()
  res.json({ success: true, message: 'Topic deleted' })
})
