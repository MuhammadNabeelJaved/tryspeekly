import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/user.model.js'
import Course from '../models/course.model.js'
import Payment from '../models/payment.model.js'

// GET /api/v1/stats/admin
export const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalInstructors,
    coursesByStatus,
    revenueAgg,
    pendingPayments,
    pendingCourseReviews,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isDeleted: { $ne: true } }),
    User.countDocuments({ role: 'teacher', isDeleted: { $ne: true } }),
    Course.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.countDocuments({ status: 'pending' }),
    Course.countDocuments({ status: 'pending' }),
  ])

  const courseMap = {
    published: 0,
    pending: 0,
    draft: 0,
    rejected: 0,
    archived: 0,
  }
  coursesByStatus.forEach(({ _id, count }) => {
    if (_id in courseMap) courseMap[_id] = count
  })

  res.json({
    success: true,
    data: {
      totalStudents,
      totalInstructors,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      pendingPayments,
      pendingCourseReviews,
      coursesByStatus: courseMap,
    },
  })
})
