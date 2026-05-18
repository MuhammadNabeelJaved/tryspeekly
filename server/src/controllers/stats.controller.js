import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/user.model.js'
import Course from '../models/course.model.js'
import Payment from '../models/payment.model.js'
import Enrollment from '../models/enrollment.model.js'
import FinancialAid from '../models/financial-aid.model.js'

// GET /api/v1/stats/admin
export const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalInstructors,
    coursesByStatusAgg,
    totalCourses,
    revenueAgg,
    pendingPayments,
    failedPayments,
    pendingCourseReviews,
    pendingFinancialAid,
    studentsByCountryAgg,
    paymentsByMethodAgg,
    recentEnrollments,
    enrollmentsByCourseAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isDeleted: { $ne: true } }),
    User.countDocuments({ role: 'teacher', isDeleted: { $ne: true } }),
    Course.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Course.countDocuments({ isDeleted: { $ne: true } }),
    Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' } } },
    ]),
    Payment.countDocuments({ status: 'pending' }),
    Payment.countDocuments({ status: 'rejected' }),
    Course.countDocuments({ status: 'pending', isDeleted: { $ne: true } }),
    FinancialAid.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
    User.aggregate([
      { $match: { role: 'student', isDeleted: { $ne: true }, country: { $exists: true, $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Payment.aggregate([
      { $group: { _id: '$method', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Enrollment.find()
      .sort({ enrolledAt: -1 })
      .limit(5)
      .populate('student', 'name country')
      .populate('course', 'title')
      .populate('payment', 'status')
      .lean(),
    Enrollment.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'courseData' } },
      { $unwind: '$courseData' },
      { $project: { _id: 0, title: '$courseData.title', count: 1 } },
    ]),
  ])

  const courseMap = { published: 0, pending: 0, draft: 0, rejected: 0, archived: 0 }
  coursesByStatusAgg.forEach(({ _id, count }) => {
    if (_id in courseMap) courseMap[_id] = count
  })

  const revenueMap = {}
  revenueAgg.forEach(({ _id, total }) => { revenueMap[_id] = total })

  const studentsByCountry = studentsByCountryAgg.map(({ _id, count }) => ({ country: _id, count }))
  const paymentsByMethod = paymentsByMethodAgg.map(({ _id, count }) => ({ method: _id, count }))

  const recentEnrollmentsMapped = recentEnrollments.map((e) => ({
    _id: e._id,
    studentName: e.student?.name ?? 'Unknown',
    courseName: e.course?.title ?? 'Unknown',
    country: e.student?.country ?? '',
    paymentStatus: e.payment?.status ?? 'pending',
    enrolledAt: e.enrolledAt,
  }))

  res.json({
    success: true,
    message: 'Stats retrieved',
    data: {
      totalStudents,
      totalInstructors,
      totalCourses,
      revenue: revenueMap,
      pendingPayments,
      failedPayments,
      pendingCourseReviews,
      pendingFinancialAid,
      coursesByStatus: courseMap,
      studentsByCountry,
      paymentsByMethod,
      recentEnrollments: recentEnrollmentsMapped,
      enrollmentsByCourse: enrollmentsByCourseAgg,
    },
  })
})
