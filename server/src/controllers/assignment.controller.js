import asyncHandler from '../utils/asyncHandler.js'
import Assignment from '../models/assignment.model.js'
import { uploadCourseMaterial, deleteFile, extractPublicId } from '../utils/cloudinary.js'

// POST /api/v1/assignments — teacher/admin: create assignment
export const createAssignment = asyncHandler(async (req, res) => {
  try {
    const { courseId, title, description, dueDate } = req.body
    if (!courseId || !title || !description || !dueDate) {
      return res.status(400).json({ success: false, error: { message: 'Course, title, description, and due date are required' } })
    }

    const assignment = await Assignment.create({ course: courseId, title, description, dueDate })
    res.status(201).json({ success: true, message: 'Assignment created', data: assignment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/assignments/course/:courseId — authenticated
export const getCourseAssignments = asyncHandler(async (req, res) => {
  try {
    const assignments = await Assignment.find({
      course: req.params.courseId,
      isDeleted: { $ne: true },
    })
      .sort({ dueDate: 1 })
      .lean()

    if (req.user.role === 'student') {
      const withMySubmission = assignments.map((a) => ({
        ...a,
        submissions: a.submissions.filter(
          (s) => s.student.toString() === req.user.id.toString()
        ),
      }))
      return res.json({ success: true, data: withMySubmission })
    }

    res.json({
      success: true,
      data: assignments.map((a) => ({ ...a, submissions: [] })),
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/assignments/:id — authenticated
export const getAssignment = asyncHandler(async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course', 'title')
    if (!assignment) return res.status(404).json({ success: false, error: { message: 'Assignment not found' } })

    // Students only see their own submission; teachers/admins see all
    if (req.user.role === 'student') {
      const mySubmission = assignment.submissions.find((s) => s.student.toString() === req.user.id.toString())
      const data = assignment.toObject()
      data.submissions = mySubmission ? [mySubmission] : []
      return res.json({ success: true, data })
    }

    res.json({ success: true, data: assignment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/assignments/:id/submit — student: submit assignment
export const submitAssignment = asyncHandler(async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'Submission file is required' } })

    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return res.status(404).json({ success: false, error: { message: 'Assignment not found' } })
    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({ success: false, error: { message: 'Submission deadline has passed' } })
    }

    const existingIdx = assignment.submissions.findIndex((s) => s.student.toString() === req.user.id.toString())
    if (existingIdx !== -1) {
      const old = assignment.submissions[existingIdx]
      if (old.fileUrl) {
        const publicId = extractPublicId(old.fileUrl)
        if (publicId) await deleteFile(publicId, 'raw')
      }
      assignment.submissions.splice(existingIdx, 1)
    }

    const result = await uploadCourseMaterial(req.file.buffer, `submission_${req.user.id}_${req.params.id}`)
    assignment.submissions.push({ enrollment: req.body.enrollmentId, student: req.user.id, fileUrl: result.secure_url })
    await assignment.save()

    const submission = assignment.submissions[assignment.submissions.length - 1]
    res.status(201).json({ success: true, message: 'Assignment submitted', data: submission })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/assignments/:id/submissions/:submissionId/grade — teacher/admin
export const gradeSubmission = asyncHandler(async (req, res) => {
  try {
    const { grade, feedback } = req.body
    if (grade === undefined || grade < 0 || grade > 100) {
      return res.status(400).json({ success: false, error: { message: 'Grade must be a number between 0 and 100' } })
    }

    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return res.status(404).json({ success: false, error: { message: 'Assignment not found' } })

    const submission = assignment.submissions.id(req.params.submissionId)
    if (!submission) return res.status(404).json({ success: false, error: { message: 'Submission not found' } })

    submission.grade = grade
    submission.feedback = feedback
    submission.status = 'graded'
    submission.gradedAt = new Date()
    await assignment.save()

    res.json({ success: true, message: 'Submission graded', data: submission })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/assignments/:id — teacher/admin (soft delete)
export const deleteAssignment = asyncHandler(async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return res.status(404).json({ success: false, error: { message: 'Assignment not found' } })

    assignment.isDeleted = true
    await assignment.save()

    res.json({ success: true, message: 'Assignment deleted' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/assignments/instructor/my — teacher/admin
export const getInstructorAssignments = asyncHandler(async (req, res) => {
  try {
    const Course = (await import('../models/course.model.js')).default
    const courses = await Course.find({ teacher: req.user.id })
      .select('_id')
      .lean()
    const courseIds = courses.map((c) => c._id)

    const assignments = await Assignment.find({
      course: { $in: courseIds },
      isDeleted: { $ne: true },
    })
      .populate('course', 'title')
      .populate('submissions.student', 'name profileImage')
      .sort({ dueDate: 1 })
      .lean()

    res.json({ success: true, data: assignments })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
