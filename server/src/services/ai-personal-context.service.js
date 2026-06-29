import Enrollment from '../models/enrollment.model.js'
import Certificate from '../models/certificate.model.js'
import Course from '../models/course.model.js'
import Payment from '../models/payment.model.js'
import User from '../models/user.model.js'
import FinancialAid from '../models/financial-aid.model.js'

// ─── Role-aware account summary for the AI chatbot ──────────────────────────────
// Returns a compact text block describing the signed-in user's OWN dashboard data,
// scoped strictly to their role. Never includes another user's private data.

const studentContext = async (id) => {
  const [enrollments, certs, payments] = await Promise.all([
    Enrollment.find({ student: id }).populate('course', 'title').select('progress isActive course').lean(),
    Certificate.find({ student: id }).populate('course', 'title').select('certificateId status course').lean(),
    Payment.find({ student: id }).sort({ createdAt: -1 }).limit(5).select('status amount currency').lean(),
  ])

  const lines = ['Role: student.']
  if (enrollments.length) {
    lines.push('Enrolments:')
    for (const e of enrollments) {
      const p = e.progress || {}
      lines.push(
        `- "${e.course?.title || 'a removed course'}": ${p.sessionsAttended ?? 0}/${p.totalSessions ?? '?'} ` +
        `sessions attended, ${e.isActive ? 'active' : 'pending/inactive'}.`
      )
    }
  } else {
    lines.push('No enrolments yet.')
  }
  if (certs.length) {
    lines.push('Certificates:')
    for (const c of certs) lines.push(`- ${c.certificateId} for "${c.course?.title || 'a course'}" (${c.status}).`)
  } else {
    lines.push('No certificates yet.')
  }
  if (payments.length) {
    lines.push(
      'Recent payments: ' +
      payments.map((p) => `${p.currency || ''} ${p.amount ?? ''} (${p.status})`).join(', ') + '.'
    )
  }
  return lines.join('\n')
}

const teacherContext = async (id) => {
  const [courses, totalEnrolments, activeEnrolments] = await Promise.all([
    Course.find({ teacher: id }).select('title status enrolledStudents').lean(),
    Enrollment.countDocuments({ teacher: id }),
    Enrollment.countDocuments({ teacher: id, isActive: true }),
  ])
  const courseIds = courses.map((c) => c._id)
  const certsIssued = courseIds.length
    ? await Certificate.countDocuments({ course: { $in: courseIds } })
    : 0

  const lines = [
    'Role: teacher/instructor.',
    `Totals: ${courses.length} course(s), ${totalEnrolments} enrolment(s) ` +
    `(${activeEnrolments} active), ${certsIssued} certificate(s) issued.`,
  ]
  if (courses.length) {
    lines.push('Your courses:')
    for (const c of courses) lines.push(`- "${c.title}" [${c.status}] — ${c.enrolledStudents?.length ?? 0} enrolled.`)
  }
  return lines.join('\n')
}

const platformCounts = async () => {
  const [enrolledStudents, instructors, totalCourses, publishedCourses, pendingPayments, pendingCourseReviews, pendingAid, revenueAgg] =
    await Promise.all([
      Payment.distinct('student').then(r => r.length),
      User.countDocuments({ role: 'teacher', isDeleted: { $ne: true } }),
      Course.countDocuments({ isDeleted: { $ne: true } }),
      Course.countDocuments({ status: 'published', isDeleted: { $ne: true } }),
      Payment.countDocuments({ status: 'pending' }),
      Course.countDocuments({ status: 'pending', isDeleted: { $ne: true } }),
      FinancialAid.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
      Payment.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$currency', total: { $sum: '$amount' } } }]),
    ])
  const revenue = revenueAgg.length ? revenueAgg.map((r) => `${r._id} ${r.total}`).join(', ') : 'none yet'
  return { enrolledStudents, instructors, totalCourses, publishedCourses, pendingPayments, pendingCourseReviews, pendingAid, revenue }
}

const adminContext = async () => {
  const s = await platformCounts()
  return [
    'Role: admin (full platform overview).',
    `Enrolled students: ${s.enrolledStudents}. Instructors: ${s.instructors}.`,
    `Courses: ${s.totalCourses} total, ${s.publishedCourses} published.`,
    `Pending: ${s.pendingPayments} payment(s), ${s.pendingCourseReviews} course approval(s), ${s.pendingAid} financial-aid request(s).`,
    `Revenue (approved): ${s.revenue}.`,
  ].join('\n')
}

const teamContext = async (permissions = []) => {
  const s = await platformCounts()
  const perms = permissions.length ? permissions.join(', ') : 'none assigned'
  return [
    'Role: team member (staff).',
    `Your permitted sections: ${perms}.`,
    `Platform: ${s.enrolledStudents} enrolled students, ${s.instructors} instructors, ${s.totalCourses} courses.`,
    `Pending: ${s.pendingPayments} payment(s), ${s.pendingCourseReviews} course approval(s), ${s.pendingAid} financial-aid request(s).`,
  ].join('\n')
}

export const buildPersonalContext = async (user) => {
  if (!user) return null
  switch (user.role) {
    case 'student':
      return studentContext(user.id)
    case 'teacher':
      return teacherContext(user.id)
    case 'admin':
      return adminContext()
    case 'team_member':
      return teamContext(user.permissions)
    default:
      return null
  }
}
