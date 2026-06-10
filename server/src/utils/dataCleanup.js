import mongoose from 'mongoose'

import Assignment from '../models/assignment.model.js'
import Certificate from '../models/certificate.model.js'
import ChatSession from '../models/chat-session.model.js'
import Course from '../models/course.model.js'
import Enrollment from '../models/enrollment.model.js'
import FinancialAid from '../models/financial-aid.model.js'
import LiveClass from '../models/live-class.model.js'
import Message from '../models/message.model.js'
import MonthlyFee from '../models/monthly-fee.model.js'
import Notification from '../models/notification.model.js'
import Payment from '../models/payment.model.js'
import PayoutRequest from '../models/payout-request.model.js'
import ReferralReward from '../models/referral-reward.model.js'
import ReferralWallet from '../models/referral-wallet.model.js'
import Review from '../models/review.model.js'
import SalaryPackage from '../models/salary-package.model.js'
import SalaryPayment from '../models/salary-payment.model.js'
import SalaryRequest from '../models/salary-request.model.js'
import SupportTicket from '../models/support.model.js'
import TeamChat from '../models/team-chat.model.js'
import TeamNotification from '../models/team-notification.model.js'
import User from '../models/user.model.js'
import { invalidateKnowledge } from '../services/ai-knowledge.service.js'

const objectId = (id) => new mongoose.Types.ObjectId(id)

const count = (result) => result?.deletedCount ?? 0

export const hardDeleteCourseAndRelatedData = async (courseId) => {
  const _id = typeof courseId === 'string' ? objectId(courseId) : courseId

  const [
    course,
    enrollments,
    payments,
    certificates,
    reviews,
    assignments,
    liveClasses,
    financialAid,
    supportTickets,
    referralRewards,
  ] = await Promise.all([
    Course.collection.deleteOne({ _id }),
    Enrollment.deleteMany({ course: _id }),
    Payment.deleteMany({ course: _id }),
    Certificate.deleteMany({ course: _id }),
    Review.collection.deleteMany({ course: _id }),
    Assignment.collection.deleteMany({ course: _id }),
    LiveClass.collection.deleteMany({ course: _id }),
    FinancialAid.deleteMany({ course: _id }),
    SupportTicket.deleteMany({ course: _id }),
    ReferralReward.deleteMany({ course: _id }),
  ])

  invalidateKnowledge()

  return {
    courses: count(course),
    enrollments: count(enrollments),
    payments: count(payments),
    certificates: count(certificates),
    reviews: count(reviews),
    assignments: count(assignments),
    liveClasses: count(liveClasses),
    financialAid: count(financialAid),
    supportTickets: count(supportTickets),
    referralRewards: count(referralRewards),
  }
}

export const hardDeleteUserAndRelatedData = async (userId) => {
  const _id = typeof userId === 'string' ? objectId(userId) : userId
  const courseDocs = await Course.collection.find({ teacher: _id }).project({ _id: 1 }).toArray()

  const courseCounts = {}
  for (const course of courseDocs) {
    const counts = await hardDeleteCourseAndRelatedData(course._id)
    for (const [key, value] of Object.entries(counts)) {
      courseCounts[key] = (courseCounts[key] ?? 0) + value
    }
  }

  const walletDocs = await ReferralWallet.find({ student: _id }).select('_id').lean()
  const walletIds = walletDocs.map((wallet) => wallet._id)

  const [
    user,
    enrollments,
    payments,
    monthlyFees,
    certificates,
    reviews,
    financialAid,
    notifications,
    supportTickets,
    messages,
    chatSessions,
    referralRewards,
    referralWallets,
    payoutRequests,
    salaryPackages,
    salaryPayments,
    salaryRequests,
    teamChats,
    teamNotifications,
    courseStudentRefs,
    assignmentSubmissions,
  ] = await Promise.all([
    User.collection.deleteOne({ _id }),
    Enrollment.deleteMany({ $or: [{ student: _id }, { teacher: _id }] }),
    Payment.deleteMany({ $or: [{ student: _id }, { teacher: _id }] }),
    MonthlyFee.deleteMany({ student: _id }),
    Certificate.deleteMany({ student: _id }),
    Review.collection.deleteMany({ author: _id }),
    FinancialAid.deleteMany({ student: _id }),
    Notification.deleteMany({ recipient: _id }),
    SupportTicket.deleteMany({ $or: [{ student: _id }, { 'messages.senderId': _id }] }),
    Message.deleteMany({ $or: [{ sender: _id }, { receiver: _id }] }),
    ChatSession.deleteMany({ user: _id }),
    ReferralReward.deleteMany({ $or: [{ referrer: _id }, { referee: _id }] }),
    ReferralWallet.deleteMany({ student: _id }),
    PayoutRequest.deleteMany({ $or: [{ student: _id }, { wallet: { $in: walletIds } }] }),
    SalaryPackage.deleteMany({ teacher: _id }),
    SalaryPayment.deleteMany({ teacher: _id }),
    SalaryRequest.deleteMany({ teacher: _id }),
    TeamChat.deleteMany({ $or: [{ from: _id }, { to: _id }] }),
    TeamNotification.deleteMany({ recipient: _id }),
    Course.collection.updateMany({ enrolledStudents: _id }, { $pull: { enrolledStudents: _id } }),
    Assignment.collection.updateMany(
      { 'submissions.student': _id },
      { $pull: { submissions: { student: _id } } }
    ),
  ])

  invalidateKnowledge()

  return {
    ...courseCounts,
    users: count(user),
    enrollments: (courseCounts.enrollments ?? 0) + count(enrollments),
    payments: (courseCounts.payments ?? 0) + count(payments),
    monthlyFees: count(monthlyFees),
    certificates: (courseCounts.certificates ?? 0) + count(certificates),
    reviews: (courseCounts.reviews ?? 0) + count(reviews),
    financialAid: (courseCounts.financialAid ?? 0) + count(financialAid),
    notifications: count(notifications),
    supportTickets: (courseCounts.supportTickets ?? 0) + count(supportTickets),
    messages: count(messages),
    chatSessions: count(chatSessions),
    referralRewards: (courseCounts.referralRewards ?? 0) + count(referralRewards),
    referralWallets: count(referralWallets),
    payoutRequests: count(payoutRequests),
    salaryPackages: count(salaryPackages),
    salaryPayments: count(salaryPayments),
    salaryRequests: count(salaryRequests),
    teamChats: count(teamChats),
    teamNotifications: count(teamNotifications),
    courseStudentRefs: courseStudentRefs?.modifiedCount ?? 0,
    assignmentSubmissions: assignmentSubmissions?.modifiedCount ?? 0,
  }
}
