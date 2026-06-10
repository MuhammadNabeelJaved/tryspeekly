import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/user.model.js'
import Course from '../models/course.model.js'
import Payment from '../models/payment.model.js'
import Enrollment from '../models/enrollment.model.js'
import MonthlyFee from '../models/monthly-fee.model.js'
import FinancialAid from '../models/financial-aid.model.js'
import Certificate from '../models/certificate.model.js'
import Review from '../models/review.model.js'
import ReferralReward from '../models/referral-reward.model.js'
import ReferralWallet from '../models/referral-wallet.model.js'
import PayoutRequest from '../models/payout-request.model.js'
import Notification from '../models/notification.model.js'
import SupportTicket from '../models/support.model.js'

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
    pendingRevenueAgg,
    approvedPaymentsCount,
    monthlyFeeRevenueAgg,
    monthlyFeePendingAgg,
    monthlyFeePaidCount,
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
      .limit(20)
      .populate({ path: 'student', select: 'name country', match: { isDeleted: { $ne: true } } })
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
    Payment.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' } } },
    ]),
    Payment.countDocuments({ status: 'approved' }),
    MonthlyFee.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' } } },
    ]),
    MonthlyFee.aggregate([
      { $match: { status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: '$currency', total: { $sum: '$amount' } } },
    ]),
    MonthlyFee.countDocuments({ status: 'paid' }),
  ])

  const courseMap = { published: 0, pending: 0, draft: 0, rejected: 0, archived: 0 }
  coursesByStatusAgg.forEach(({ _id, count }) => {
    if (_id in courseMap) courseMap[_id] = count
  })

  const revenueMap = {}
  revenueAgg.forEach(({ _id, total }) => { revenueMap[_id] = total })

  const pendingRevenueMap = {}
  pendingRevenueAgg.forEach(({ _id, total }) => { pendingRevenueMap[_id] = total })

  const monthlyFeeRevenueMap = {}
  monthlyFeeRevenueAgg.forEach(({ _id, total }) => { monthlyFeeRevenueMap[_id] = total })

  const monthlyFeePendingMap = {}
  monthlyFeePendingAgg.forEach(({ _id, total }) => { monthlyFeePendingMap[_id] = total })

  const studentsByCountry = studentsByCountryAgg.map(({ _id, count }) => ({ country: _id, count }))
  const paymentsByMethod = paymentsByMethodAgg.map(({ _id, count }) => ({ method: _id, count }))

  // Skip enrollments whose student (deleted) or course (removed) no longer exists,
  // so stale records from deleted accounts don't surface on the dashboard.
  const recentEnrollmentsMapped = recentEnrollments
    .filter((e) => e.student && e.course)
    .slice(0, 5)
    .map((e) => ({
      _id: e._id,
      studentName: e.student.name,
      courseName: e.course.title,
      country: e.student.country ?? '',
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
      pendingRevenue: pendingRevenueMap,
      approvedPaymentsCount,
      monthlyFeeRevenue: monthlyFeeRevenueMap,
      monthlyFeePending: monthlyFeePendingMap,
      monthlyFeePaidCount,
    },
  })
})

// POST /api/v1/stats/admin/cleanup-deleted — admin: purge soft-deleted users and
// all orphaned data (records pointing at users/courses that no longer exist).
export const cleanupDeletedData = asyncHandler(async (req, res) => {
  // The User model has a pre-find hook forcing { isDeleted: false }, so reach
  // soft-deleted accounts through the raw collection.
  const deletedUserDocs = await User.collection.find({ isDeleted: true }).project({ _id: 1 }).toArray()
  const deletedUserIds = deletedUserDocs.map((d) => d._id)

  // All existing doc ids (incl. soft-deleted) to detect true orphans (hard-deleted refs).
  const [allUserDocs, allCourseDocs] = await Promise.all([
    User.collection.find({}).project({ _id: 1 }).toArray(),
    Course.collection.find({}).project({ _id: 1 }).toArray(),
  ])
  const liveUserIds = allUserDocs
    .filter((d) => !deletedUserIds.some((id) => id.equals(d._id)))
    .map((d) => d._id)
  const liveCourseIds = allCourseDocs.map((d) => d._id)

  const owned = { $in: deletedUserIds }
  const counts = {}

  // 1) Operational records owned by the soft-deleted users
  const [enr, pay, fee, cert, rev, refRew, refWal, payout, aid, notif, sup] = await Promise.all([
    Enrollment.deleteMany({ student: owned }),
    Payment.deleteMany({ student: owned }),
    MonthlyFee.deleteMany({ student: owned }),
    Certificate.deleteMany({ student: owned }),
    Review.deleteMany({ author: owned }),
    ReferralReward.deleteMany({ $or: [{ referrer: owned }, { referee: owned }] }),
    ReferralWallet.deleteMany({ student: owned }),
    PayoutRequest.deleteMany({ student: owned }),
    FinancialAid.deleteMany({ student: owned }),
    Notification.deleteMany({ recipient: owned }),
    SupportTicket.deleteMany({ student: owned }),
  ])
  counts.enrollments = enr.deletedCount
  counts.payments = pay.deletedCount
  counts.monthlyFees = fee.deletedCount
  counts.certificates = cert.deletedCount
  counts.reviews = rev.deletedCount
  counts.referralRewards = refRew.deletedCount
  counts.referralWallets = refWal.deletedCount
  counts.payoutRequests = payout.deletedCount
  counts.financialAid = aid.deletedCount
  counts.notifications = notif.deletedCount
  counts.supportTickets = sup.deletedCount

  // 2) Orphaned enrollments/payments/monthly-fees whose student or course no longer exists
  const orphanFilter = { $or: [{ student: { $nin: liveUserIds } }, { course: { $nin: liveCourseIds } }] }
  const studentOrphanFilter = { student: { $nin: liveUserIds } }
  const [orphanEnr, orphanPay, orphanFee] = await Promise.all([
    Enrollment.deleteMany(orphanFilter),
    Payment.deleteMany(orphanFilter),
    MonthlyFee.deleteMany(studentOrphanFilter),
  ])
  counts.enrollments += orphanEnr.deletedCount
  counts.payments += orphanPay.deletedCount
  counts.monthlyFees += orphanFee.deletedCount

  // 3) Hard-delete the soft-deleted user accounts themselves
  const removedUsers = await User.collection.deleteMany({ isDeleted: true })
  counts.users = removedUsers.deletedCount

  const totalRemoved = Object.values(counts).reduce((a, b) => a + b, 0)
  res.json({
    success: true,
    message: totalRemoved === 0 ? 'Nothing to clean up' : `Removed ${counts.users} deleted account(s) and ${totalRemoved - counts.users} related record(s)`,
    data: counts,
  })
})
