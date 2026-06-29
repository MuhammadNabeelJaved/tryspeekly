import Certificate from '../models/certificate.model.js'
import Course from '../models/course.model.js'
import Payment from '../models/payment.model.js'
import User from '../models/user.model.js'
import FinancialAid from '../models/financial-aid.model.js'
import Enrollment from '../models/enrollment.model.js'

// ─── Role-aware account summary for the AI chatbot ──────────────────────────────
// Returns a compact text block describing the signed-in user's OWN dashboard data,
// scoped strictly to their role. Never includes another user's private data.

const studentContext = async (id) => {
  const [enrollments, certs, payments, aidRequests] = await Promise.all([
    Enrollment.find({ student: id })
      .populate('course', 'title status')
      .select('progress isActive course createdAt')
      .lean(),
    Certificate.find({ student: id })
      .populate('course', 'title')
      .select('certificateId status course createdAt')
      .lean(),
    Payment.find({ student: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status amount currency createdAt')
      .lean(),
    FinancialAid.find({ student: id })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('status createdAt')
      .lean(),
  ])

  const lines = ['Role: student.']

  if (enrollments.length) {
    const active = enrollments.filter((e) => e.isActive)
    const pending = enrollments.filter((e) => !e.isActive)
    lines.push(`Enrolments: ${enrollments.length} total (${active.length} active, ${pending.length} pending/inactive).`)
    for (const e of enrollments) {
      const p = e.progress || {}
      const title = e.course?.title || 'a removed course'
      const sessions = `${p.sessionsAttended ?? 0}/${p.totalSessions ?? '?'} sessions`
      const status = e.isActive ? 'active' : 'pending/inactive'
      lines.push(`- "${title}": ${sessions} attended — ${status}.`)
    }
  } else {
    lines.push('No enrolments yet.')
  }

  if (certs.length) {
    lines.push('Certificates:')
    for (const c of certs) {
      lines.push(`- ${c.certificateId} for "${c.course?.title || 'a course'}" (${c.status}).`)
    }
  } else {
    lines.push('No certificates yet.')
  }

  if (payments.length) {
    lines.push('Recent payments:')
    for (const p of payments) {
      lines.push(`- ${p.currency || ''} ${p.amount ?? ''} — ${p.status}.`)
    }
  } else {
    lines.push('No payment records found.')
  }

  if (aidRequests.length) {
    lines.push(`Financial aid: ${aidRequests.map((a) => a.status).join(', ')}.`)
  }

  return lines.join('\n')
}

const teacherContext = async (id) => {
  // Use Course.enrolledStudents[] (populated on payment approval) — accurate even with seeded data.
  const courses = await Course.find({ teacher: id })
    .select('title status enrolledStudents')
    .lean()

  const courseIds = courses.map((c) => c._id)
  const published = courses.filter((c) => c.status === 'published')
  const pending = courses.filter((c) => c.status === 'pending')
  const draft = courses.filter((c) => c.status === 'draft')
  const totalEnrolled = courses.reduce((n, c) => n + (c.enrolledStudents?.length ?? 0), 0)

  const certsIssued = courseIds.length
    ? await Certificate.countDocuments({ course: { $in: courseIds } })
    : 0

  const lines = [
    'Role: teacher/instructor.',
    `Courses: ${courses.length} total — ${published.length} published, ${pending.length} pending review, ${draft.length} draft.`,
    `Students enrolled across all your courses: ${totalEnrolled}.`,
    `Certificates issued to your students: ${certsIssued}.`,
  ]

  if (courses.length) {
    lines.push('Your course breakdown:')
    for (const c of courses) {
      const count = c.enrolledStudents?.length ?? 0
      lines.push(`- "${c.title}" [${c.status}] — ${count} student(s) enrolled.`)
    }
  } else {
    lines.push('You have not created any courses yet.')
  }

  return lines.join('\n')
}

const platformCounts = async () => {
  const [
    enrolledStudents,
    instructors,
    totalCourses,
    publishedCourses,
    pendingCourses,
    pendingPayments,
    approvedPayments,
    pendingAid,
    revenueAgg,
  ] = await Promise.all([
    // Only count students who have an actual payment record (real students, not seed data)
    Payment.distinct('student').then((r) => r.length),
    User.countDocuments({ role: 'teacher', isDeleted: { $ne: true } }),
    Course.countDocuments({ isDeleted: { $ne: true } }),
    Course.countDocuments({ status: 'published', isDeleted: { $ne: true } }),
    Course.countDocuments({ status: 'pending', isDeleted: { $ne: true } }),
    Payment.countDocuments({ status: 'pending' }),
    Payment.countDocuments({ status: 'approved' }),
    FinancialAid.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
    Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' } } },
    ]),
  ])

  const revenue = revenueAgg.length
    ? revenueAgg.map((r) => `${r._id} ${r.total}`).join(', ')
    : 'none yet'

  return {
    enrolledStudents,
    instructors,
    totalCourses,
    publishedCourses,
    pendingCourses,
    pendingPayments,
    approvedPayments,
    pendingAid,
    revenue,
  }
}

const adminContext = async () => {
  const s = await platformCounts()
  return [
    'Role: admin (full platform access).',
    `Students enrolled (with payments): ${s.enrolledStudents}. Instructors: ${s.instructors}.`,
    `Courses: ${s.totalCourses} total — ${s.publishedCourses} published, ${s.pendingCourses} pending review.`,
    `Payments: ${s.pendingPayments} pending approval, ${s.approvedPayments} approved.`,
    `Financial aid requests: ${s.pendingAid} pending/under review.`,
    `Revenue (approved payments): ${s.revenue}.`,
  ].join('\n')
}

const teamContext = async (permissions = []) => {
  const s = await platformCounts()
  const perms = permissions.length ? permissions.join(', ') : 'none assigned'
  return [
    'Role: team member (staff).',
    `Permitted sections: ${perms}.`,
    `Platform: ${s.enrolledStudents} enrolled students, ${s.instructors} instructors, ${s.totalCourses} courses.`,
    `Pending: ${s.pendingPayments} payment(s), ${s.pendingCourses} course approval(s), ${s.pendingAid} financial-aid request(s).`,
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
