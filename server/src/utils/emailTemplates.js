// ─── Base wrapper ─────────────────────────────────────────────────────────────
const wrap = (content, preheader = '') => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <title>TrySpeekly</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#eef2f7;line-height:1px">${preheader} ${'&zwnj;&nbsp;'.repeat(60)}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#eef2f7">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:580px">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9 0%,#7c3aed 50%,#4c1d95 100%);border-radius:20px 20px 0 0;padding:32px 40px;text-align:center">
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto">
                <tr>
                  <td style="background:rgba(255,255,255,0.18);border-radius:12px;width:42px;height:42px;text-align:center;vertical-align:middle">
                    <span style="font-size:22px;font-weight:900;color:#fff;line-height:42px;display:block;font-family:Georgia,serif">E</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle">
                    <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;display:block">TrySpeekly</span>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:2.5px;text-transform:uppercase">English Learning Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;line-height:1.7">© ${new Date().getFullYear()} TrySpeekly · All rights reserved</p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.7">This is an automated message — please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

// ─── Typography ───────────────────────────────────────────────────────────────
const h1 = (text) =>
  `<h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;line-height:1.25">${text}</h1>`

const para = (text) =>
  `<p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#475569">${text}</p>`

const note = (text) =>
  `<p style="margin:20px 0 0;font-size:13px;line-height:1.65;color:#94a3b8">${text}</p>`

const divider = () =>
  `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0"><tr><td style="border-top:1px solid #f1f5f9;height:1px;font-size:0;line-height:0">&nbsp;</td></tr></table>`

// ─── Icon circle ──────────────────────────────────────────────────────────────
const iconCircle = (emoji, bgColor) =>
  `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 22px">
    <tr>
      <td style="background:${bgColor};border-radius:18px;width:60px;height:60px;text-align:center;vertical-align:middle">
        <span style="font-size:28px;line-height:60px;display:block">${emoji}</span>
      </td>
    </tr>
  </table>`

// ─── Status badge ─────────────────────────────────────────────────────────────
const BADGES = {
  success: ['#dcfce7', '#15803d', '#16a34a'],
  warning: ['#fef9c3', '#a16207', '#ca8a04'],
  danger:  ['#fee2e2', '#dc2626', '#ef4444'],
  info:    ['#dbeafe', '#1d4ed8', '#2563eb'],
  purple:  ['#ede9fe', '#6d28d9', '#7c3aed'],
  live:    ['#ffe4e6', '#be123c', '#f43f5e'],
}

const badge = (text, type = 'purple') => {
  const [bg, color, dot] = BADGES[type] || BADGES.purple
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px">
    <tr>
      <td style="background:${bg};border-radius:99px;padding:6px 16px">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="background:${dot};border-radius:50%;width:7px;height:7px;vertical-align:middle"></td>
            <td style="padding-left:8px;font-size:12px;font-weight:700;color:${color};letter-spacing:0.6px;text-transform:uppercase;vertical-align:middle;white-space:nowrap">${text}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

// ─── Info table ───────────────────────────────────────────────────────────────
const infoRow = (label, value) =>
  `<tr>
    <td style="padding:11px 16px;font-size:13px;font-weight:600;color:#64748b;border-bottom:1px solid #f1f5f9;white-space:nowrap;width:38%;vertical-align:top">${label}</td>
    <td style="padding:11px 16px;font-size:13px;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9;vertical-align:top">${value}</td>
  </tr>`

const infoTable = (rows) =>
  `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:0 0 20px">
    ${rows}
  </table>`

// ─── OTP box ──────────────────────────────────────────────────────────────────
const otpBox = (otp, color = '#7c3aed') =>
  `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0">
    <tr>
      <td align="center" style="background:linear-gradient(135deg,${color}0d,${color}18);border:2px solid ${color}35;border-radius:16px;padding:30px 24px">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${color};letter-spacing:2.5px;text-transform:uppercase">Your Verification Code</p>
        <p style="margin:0;font-size:44px;font-weight:900;letter-spacing:14px;color:${color};font-family:'Courier New',Courier,monospace;padding-left:14px">${otp}</p>
      </td>
    </tr>
  </table>`

// ─── CTA Button ───────────────────────────────────────────────────────────────
const btn = (text, url, color = '#7c3aed') =>
  `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 8px">
    <tr>
      <td align="center">
        <a href="${url}" style="display:inline-block;padding:15px 44px;background:${color};color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:-0.2px;line-height:1">${text}</a>
      </td>
    </tr>
  </table>`

// ─── Highlight / promo box ────────────────────────────────────────────────────
const promoBox = (bigText, smallText, color = '#7c3aed') =>
  `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0">
    <tr>
      <td align="center" style="background:linear-gradient(135deg,${color}12,${color}06);border:2px solid ${color}28;border-radius:16px;padding:28px 24px">
        <p style="margin:0 0 6px;font-size:40px;font-weight:900;color:${color};letter-spacing:-1px;line-height:1">${bigText}</p>
        <p style="margin:0;font-size:14px;color:#64748b;font-weight:500">${smallText}</p>
      </td>
    </tr>
  </table>`

// ─── Alert box ────────────────────────────────────────────────────────────────
const alertBox = (text, type = 'warning') => {
  const styles = {
    warning: ['#fffbeb', '#92400e', '#fde68a'],
    danger:  ['#fff1f2', '#9f1239', '#fecdd3'],
    info:    ['#eff6ff', '#1e40af', '#bfdbfe'],
    success: ['#f0fdf4', '#166534', '#bbf7d0'],
  }
  const [bg, color, border] = styles[type] || styles.info
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px">
    <tr>
      <td style="background:${bg};border-left:4px solid ${border};border-radius:0 8px 8px 0;padding:14px 16px;font-size:14px;color:${color};line-height:1.6;font-weight:500">${text}</td>
    </tr>
  </table>`
}

// ─── Default templates ────────────────────────────────────────────────────────

export const DEFAULT_TEMPLATES = [

  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    type: 'otp_verification',
    name: 'Email Verification OTP',
    subject: 'Verify Your Email — TrySpeekly',
    variables: ['name', 'otp'],
    htmlBody: wrap(`
      ${iconCircle('✉️', '#ecfdf5')}
      ${h1('Verify your email address')}
      ${para('Hi <strong>{{name}}</strong>, welcome to TrySpeekly! To get started, please enter the 6-digit verification code below. The code expires in <strong>24 hours</strong>.')}
      ${otpBox('{{otp}}', '#059669')}
      ${divider()}
      ${note('If you didn\'t create an TrySpeekly account, you can safely ignore this email. No action is needed.')}
    `, 'Your TrySpeekly verification code is ready'),
  },

  {
    type: 'otp_forgot_password',
    name: 'Forgot Password OTP',
    subject: 'Reset Your Password — TrySpeekly',
    variables: ['name', 'otp'],
    htmlBody: wrap(`
      ${iconCircle('🔐', '#faf5ff')}
      ${h1('Reset your password')}
      ${para('Hi <strong>{{name}}</strong>, we received a request to reset your TrySpeekly password. Use the code below — it expires in <strong>15 minutes</strong>.')}
      ${otpBox('{{otp}}', '#7c3aed')}
      ${alertBox('This code is valid for 15 minutes only. Do not share it with anyone.', 'warning')}
      ${note('If you didn\'t request a password reset, please ignore this email. Your account is safe.')}
    `, 'Your password reset code is ready'),
  },

  {
    type: 'account_verified_welcome',
    name: 'Welcome After Verification',
    subject: 'Welcome to TrySpeekly! Your account is verified',
    variables: ['name', 'role', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('🎉', '#ecfdf5')}
      ${badge('Account Verified', 'success')}
      ${h1('Welcome to TrySpeekly!')}
      ${para('Hi <strong>{{name}}</strong>, your email address has been successfully verified. You\'re all set to begin your English learning journey!')}
      ${infoTable(
        infoRow('Account Status', '✓ Verified &amp; Active') +
        infoRow('Account Role', '{{role}}')
      )}
      ${para('Your dashboard gives you access to courses, assignments, progress tracking, and much more.')}
      ${btn('Go to My Dashboard', '{{dashboardUrl}}')}
      ${note('Have a question? Contact our support team — we\'re happy to help.')}
    `, 'Your TrySpeekly account is now active and ready'),
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  {
    type: 'contact_form_submitted',
    name: 'Contact Form Confirmation',
    subject: 'We received your message — TrySpeekly',
    variables: ['name', 'subject', 'message'],
    htmlBody: wrap(`
      ${iconCircle('💬', '#eff6ff')}
      ${h1('We got your message!')}
      ${para('Hi <strong>{{name}}</strong>, thank you for reaching out. Our team has received your message and will get back to you as soon as possible.')}
      ${infoTable(
        infoRow('Subject', '{{subject}}') +
        infoRow('Message', '{{message}}') +
        infoRow('Response Time', '1 – 2 business days')
      )}
      ${divider()}
      ${note('Please do not submit duplicate requests — we have your message on file and will respond shortly.')}
    `, 'Thanks for contacting TrySpeekly — we\'ll be in touch soon'),
  },

  // ── Enrollments ───────────────────────────────────────────────────────────
  {
    type: 'enrollment_confirmed',
    name: 'Enrollment Confirmation (Student)',
    subject: 'You\'re enrolled in {{courseName}} — TrySpeekly',
    variables: ['studentName', 'courseName', 'teacherName', 'courseLevel', 'courseType'],
    htmlBody: wrap(`
      ${iconCircle('📚', '#faf5ff')}
      ${badge('Enrollment Confirmed', 'purple')}
      ${h1('You\'re enrolled!')}
      ${para('Hi <strong>{{studentName}}</strong>, congratulations! You have successfully enrolled in the course below.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Instructor', '{{teacherName}}') +
        infoRow('Level', '{{courseLevel}}') +
        infoRow('Type', '{{courseType}}') +
        infoRow('Payment Status', 'Pending Confirmation')
      )}
      ${alertBox('Your enrollment is pending payment confirmation. Once your payment is approved by the admin team, you\'ll have full access to the course.', 'info')}
      ${note('Head to your Student Dashboard to submit your payment proof and get started.')}
    `, 'Your enrollment in {{courseName}} is confirmed'),
  },

  {
    type: 'enrollment_teacher_notification',
    name: 'New Student Enrolled (Teacher)',
    subject: 'New student enrolled in {{courseName}}',
    variables: ['teacherName', 'studentName', 'studentEmail', 'courseName'],
    htmlBody: wrap(`
      ${iconCircle('👋', '#faf5ff')}
      ${badge('New Enrollment', 'purple')}
      ${h1('A new student joined!')}
      ${para('Hi <strong>{{teacherName}}</strong>, a new student has enrolled in your course. Here are their details:')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Student Name', '{{studentName}}') +
        infoRow('Student Email', '{{studentEmail}}')
      )}
      ${note('Log in to your Instructor Dashboard to view and manage all enrolled students.')}
    `, 'A new student enrolled in your course'),
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  {
    type: 'payment_submitted',
    name: 'Payment Submitted (Student)',
    subject: 'Payment proof received for {{courseName}} — TrySpeekly',
    variables: ['studentName', 'courseName', 'amount', 'currency', 'method'],
    htmlBody: wrap(`
      ${iconCircle('🧾', '#fffbeb')}
      ${badge('Under Review', 'warning')}
      ${h1('Payment Received')}
      ${para('Hi <strong>{{studentName}}</strong>, we have received your payment proof for the course below. Our admin team will review it shortly.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Amount', '{{currency}} {{amount}}') +
        infoRow('Payment Method', '{{method}}') +
        infoRow('Review Status', 'Under Review')
      )}
      ${note('You will receive an email as soon as your payment has been approved or if any action is required.')}
    `, 'Your payment proof is being reviewed'),
  },

  {
    type: 'payment_approved',
    name: 'Payment Approved (Student)',
    subject: 'Payment Approved — Access granted for {{courseName}}',
    variables: ['studentName', 'courseName', 'amount', 'currency', 'adminNote', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('✅', '#ecfdf5')}
      ${badge('Payment Approved', 'success')}
      ${h1('Payment Approved!')}
      ${para('Hi <strong>{{studentName}}</strong>, great news! Your payment has been verified and you now have full access to your course.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Amount', '{{currency}} {{amount}}') +
        infoRow('Status', '✓ Approved') +
        infoRow('Note from Admin', '{{adminNote}}')
      )}
      ${btn('Access My Course', '{{dashboardUrl}}', '#059669')}
      ${note('Your course materials, assignments, and live classes are now available from your dashboard.')}
    `, 'Your payment is approved — access your course now'),
  },

  {
    type: 'payment_rejected',
    name: 'Payment Rejected (Student)',
    subject: 'Action Required: Payment update for {{courseName}}',
    variables: ['studentName', 'courseName', 'rejectionReason', 'adminNote', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('⚠️', '#fff1f2')}
      ${badge('Payment Rejected', 'danger')}
      ${h1('Payment Needs Attention')}
      ${para('Hi <strong>{{studentName}}</strong>, unfortunately we were unable to verify your payment proof for the course below.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Rejection Reason', '{{rejectionReason}}') +
        infoRow('Admin Note', '{{adminNote}}')
      )}
      ${alertBox('Please resubmit a clear, valid payment screenshot from your Student Dashboard to proceed.', 'danger')}
      ${btn('Resubmit Payment', '{{dashboardUrl}}', '#dc2626')}
    `, 'Your payment could not be verified — action required'),
  },

  {
    type: 'payment_resubmitted',
    name: 'Payment Resubmitted (Student)',
    subject: 'Resubmitted payment received for {{courseName}} — TrySpeekly',
    variables: ['studentName', 'courseName', 'amount', 'currency', 'method'],
    htmlBody: wrap(`
      ${iconCircle('🔄', '#fffbeb')}
      ${badge('Under Review', 'warning')}
      ${h1('Payment Resubmitted')}
      ${para('Hi <strong>{{studentName}}</strong>, your resubmitted payment proof has been received and is now back under review.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Amount', '{{currency}} {{amount}}') +
        infoRow('Payment Method', '{{method}}') +
        infoRow('Status', 'Under Review')
      )}
      ${note('You will receive another email once your payment has been reviewed by our team.')}
    `, 'Your resubmitted payment is being reviewed'),
  },

  // ── Financial Aid ─────────────────────────────────────────────────────────
  {
    type: 'financial_aid_applied',
    name: 'Financial Aid Application Submitted',
    subject: 'Financial Aid Application Received — TrySpeekly',
    variables: ['studentName', 'courseName'],
    htmlBody: wrap(`
      ${iconCircle('🤝', '#fffbeb')}
      ${badge('Application Received', 'warning')}
      ${h1('Financial Aid Application Submitted')}
      ${para('Hi <strong>{{studentName}}</strong>, your financial aid application has been successfully submitted. Our team will carefully review it and notify you of the decision.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Status', 'Pending Review') +
        infoRow('Review Time', '2 – 5 business days')
      )}
      ${note('You can track your application status from the Student Dashboard under the Financial Aid section.')}
    `, 'Your financial aid application has been received'),
  },

  {
    type: 'financial_aid_approved',
    name: 'Financial Aid Approved',
    subject: 'Financial Aid Approved! — TrySpeekly',
    variables: ['studentName', 'courseName', 'notes', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('🎉', '#ecfdf5')}
      ${badge('Aid Approved', 'success')}
      ${h1('Financial Aid Approved!')}
      ${para('Hi <strong>{{studentName}}</strong>, we are pleased to inform you that your financial aid application has been <strong>accepted</strong>. You can now proceed with your enrollment.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Decision', '✓ Approved') +
        infoRow('Notes', '{{notes}}')
      )}
      ${btn('Go to My Dashboard', '{{dashboardUrl}}', '#059669')}
    `, 'Your financial aid application has been approved'),
  },

  {
    type: 'financial_aid_rejected',
    name: 'Financial Aid Rejected',
    subject: 'Financial Aid Application Update — TrySpeekly',
    variables: ['studentName', 'courseName', 'notes'],
    htmlBody: wrap(`
      ${iconCircle('📋', '#fff1f2')}
      ${badge('Application Rejected', 'danger')}
      ${h1('Financial Aid Update')}
      ${para('Hi <strong>{{studentName}}</strong>, we regret to inform you that your financial aid application for the course below was not approved at this time.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Decision', 'Not Approved') +
        infoRow('Reason', '{{notes}}')
      )}
      ${divider()}
      ${note('You may still enroll in the course by submitting a regular payment. If you have any questions, please contact our support team.')}
    `, 'An update regarding your financial aid application'),
  },

  // ── Courses ───────────────────────────────────────────────────────────────
  {
    type: 'course_created_pending',
    name: 'Course Created (Pending Review)',
    subject: 'Your course is under review — TrySpeekly',
    variables: ['teacherName', 'courseName'],
    htmlBody: wrap(`
      ${iconCircle('🕐', '#fffbeb')}
      ${badge('Pending Review', 'warning')}
      ${h1('Course Submitted for Review')}
      ${para('Hi <strong>{{teacherName}}</strong>, your course has been submitted and is now awaiting admin review before it goes live on the platform.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Status', 'Pending Review') +
        infoRow('Review Time', '1 – 3 business days')
      )}
      ${note('You\'ll receive an email notification as soon as our team makes a decision. Thank you for your patience!')}
    `, 'Your course submission is under review'),
  },

  {
    type: 'course_approved',
    name: 'Course Approved',
    subject: 'Your course is approved and live! — TrySpeekly',
    variables: ['teacherName', 'courseName', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('🚀', '#ecfdf5')}
      ${badge('Published', 'success')}
      ${h1('Course Approved & Live!')}
      ${para('Hi <strong>{{teacherName}}</strong>, congratulations! Your course has been reviewed, approved, and is now live on TrySpeekly for students to discover and enroll.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Status', '✓ Published & Live')
      )}
      ${btn('View My Course', '{{dashboardUrl}}', '#059669')}
      ${note('Share your course with your network to attract more students!')}
    `, 'Your course is approved and now live on TrySpeekly'),
  },

  {
    type: 'course_rejected',
    name: 'Course Rejected',
    subject: 'Your course needs revision — TrySpeekly',
    variables: ['teacherName', 'courseName', 'reason', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('✏️', '#fff1f2')}
      ${badge('Revision Required', 'danger')}
      ${h1('Course Needs Revision')}
      ${para('Hi <strong>{{teacherName}}</strong>, your course could not be approved at this time. Please review the feedback below and make the necessary changes before resubmitting.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Status', 'Rejected') +
        infoRow('Feedback', '{{reason}}')
      )}
      ${btn('Edit My Course', '{{dashboardUrl}}', '#7c3aed')}
      ${note('Once you have made the required changes, resubmit your course for review from the Instructor Dashboard.')}
    `, 'Your course requires some revisions before approval'),
  },

  // ── Live Classes ──────────────────────────────────────────────────────────
  {
    type: 'live_class_started_teacher',
    name: 'Live Class Started (Teacher)',
    subject: 'Your live class is now active — TrySpeekly',
    variables: ['teacherName', 'courseName', 'meetingLink', 'classNumber'],
    htmlBody: wrap(`
      ${iconCircle('🔴', '#fff1f2')}
      ${badge('Live Now', 'live')}
      ${h1('Live Class is Active!')}
      ${para('Hi <strong>{{teacherName}}</strong>, your live class has been started successfully. Your students have been notified.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Class Number', '#{{classNumber}}') +
        infoRow('Meeting Link', '<a href="{{meetingLink}}" style="color:#7c3aed;text-decoration:none;font-weight:600">Join Meeting</a>')
      )}
      ${note('Students will join shortly. Make sure your audio and video are set up before the class begins.')}
    `, 'Your live class is active — students are being notified'),
  },

  {
    type: 'live_class_started_student',
    name: 'Live Class Started (Student)',
    subject: '🔴 {{courseName}} is LIVE — Join now!',
    variables: ['studentName', 'courseName', 'teacherName', 'meetingLink', 'classNumber'],
    htmlBody: wrap(`
      ${iconCircle('🔴', '#fff1f2')}
      ${badge('Live Now', 'live')}
      ${h1('Your Class is Live!')}
      ${para('Hi <strong>{{studentName}}</strong>, your instructor has started a live class. Join now so you don\'t miss out!')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Instructor', '{{teacherName}}') +
        infoRow('Class Number', '#{{classNumber}}')
      )}
      ${btn('Join Class Now', '{{meetingLink}}', '#f43f5e')}
      ${note('Make sure your internet connection is stable before joining the live session.')}
    `, 'Your live class has started — join now!'),
  },

  // ── Assignments ───────────────────────────────────────────────────────────
  {
    type: 'assignment_created',
    name: 'New Assignment (Student)',
    subject: 'New assignment posted for {{courseName}} — TrySpeekly',
    variables: ['studentName', 'courseName', 'assignmentTitle', 'dueDate', 'description', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('📝', '#eff6ff')}
      ${badge('New Assignment', 'info')}
      ${h1('New Assignment Posted')}
      ${para('Hi <strong>{{studentName}}</strong>, your instructor has posted a new assignment for your course. Make sure to complete it before the due date.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Assignment', '{{assignmentTitle}}') +
        infoRow('Due Date', '{{dueDate}}') +
        infoRow('Description', '{{description}}')
      )}
      ${btn('View Assignment', '{{dashboardUrl}}', '#2563eb')}
      ${note('Submit your assignment from the Student Dashboard before the due date to avoid missing credit.')}
    `, 'A new assignment has been posted for your course'),
  },

  // ── Salary ────────────────────────────────────────────────────────────────
  {
    type: 'salary_processed',
    name: 'Salary Processed (Teacher)',
    subject: 'Salary Payment Processed — TrySpeekly',
    variables: ['teacherName', 'amount', 'currency', 'period', 'paymentMethod', 'notes'],
    htmlBody: wrap(`
      ${iconCircle('💰', '#ecfdf5')}
      ${badge('Payment Sent', 'success')}
      ${h1('Salary Processed')}
      ${para('Hi <strong>{{teacherName}}</strong>, your salary payment for the period below has been processed successfully. Please allow 1–2 business days for funds to reflect.')}
      ${infoTable(
        infoRow('Pay Period', '{{period}}') +
        infoRow('Amount', '{{currency}} {{amount}}') +
        infoRow('Payment Method', '{{paymentMethod}}') +
        infoRow('Notes', '{{notes}}')
      )}
      ${note('Contact the admin team if you have any questions or discrepancies regarding this payment.')}
    `, 'Your salary for {{period}} has been processed'),
  },

  {
    type: 'salary_requested',
    name: 'Salary Request Submitted (Teacher)',
    subject: 'Salary Request Received — TrySpeekly',
    variables: ['teacherName', 'amount', 'period'],
    htmlBody: wrap(`
      ${iconCircle('📤', '#fffbeb')}
      ${badge('Request Received', 'warning')}
      ${h1('Salary Request Submitted')}
      ${para('Hi <strong>{{teacherName}}</strong>, your salary request has been submitted and is now pending admin review. You will be notified once it has been processed.')}
      ${infoTable(
        infoRow('Requested Amount', '{{amount}}') +
        infoRow('Pay Period', '{{period}}') +
        infoRow('Status', 'Pending Review')
      )}
      ${note('Processing typically takes 1–3 business days. Please ensure your payment details are up to date in your profile.')}
    `, 'Your salary request has been received'),
  },

  // ── Reviews ───────────────────────────────────────────────────────────────
  {
    type: 'review_submitted',
    name: 'Review Submitted (User)',
    subject: 'Your review has been submitted — TrySpeekly',
    variables: ['reviewerName', 'reviewType', 'courseName', 'rating'],
    htmlBody: wrap(`
      ${iconCircle('⭐', '#fffbeb')}
      ${badge('Review Pending', 'warning')}
      ${h1('Thank You for Your Review!')}
      ${para('Hi <strong>{{reviewerName}}</strong>, thank you for sharing your feedback. Your review will be visible on the platform once it has been approved by our team.')}
      ${infoTable(
        infoRow('Review Type', '{{reviewType}}') +
        infoRow('Course', '{{courseName}}') +
        infoRow('Your Rating', '{{rating}} / 5 ⭐')
      )}
      ${note('Reviews are typically approved within 24 hours. Thank you for helping the TrySpeekly community!')}
    `, 'Your review is being reviewed by our team'),
  },

  {
    type: 'review_approved',
    name: 'Review Approved (User)',
    subject: 'Your review is now live — TrySpeekly',
    variables: ['reviewerName', 'reviewType', 'courseName'],
    htmlBody: wrap(`
      ${iconCircle('✅', '#ecfdf5')}
      ${badge('Review Published', 'success')}
      ${h1('Your Review is Live!')}
      ${para('Hi <strong>{{reviewerName}}</strong>, your review has been approved and is now visible on the platform for everyone to see.')}
      ${infoTable(
        infoRow('Review Type', '{{reviewType}}') +
        infoRow('Course', '{{courseName}}') +
        infoRow('Status', '✓ Published')
      )}
      ${note('Thank you for contributing valuable feedback to the TrySpeekly community. Your review helps other students make informed decisions.')}
    `, 'Your review is now live on TrySpeekly'),
  },

  // ── Team Member ───────────────────────────────────────────────────────────
  {
    type: 'team_member_welcome',
    name: 'Team Member Welcome',
    subject: 'Welcome to the TrySpeekly Team',
    variables: ['name', 'email', 'jobTitle', 'loginUrl'],
    htmlBody: wrap(`
      ${iconCircle('👋', '#eff6ff')}
      ${badge('Team Member Account', 'info')}
      ${h1('Welcome to the TrySpeekly Team!')}
      ${para('Hi <strong>{{name}}</strong>, your team member account has been created for TrySpeekly. We\'re excited to have you on board!')}
      ${infoTable(
        infoRow('Full Name', '{{name}}') +
        infoRow('Email', '{{email}}') +
        infoRow('Role', '{{jobTitle}}')
      )}
      ${alertBox('Please log in and change your password after your first login to keep your account secure.', 'info')}
      ${btn('Log In to Your Account', '{{loginUrl}}')}
      ${note('Contact your admin if you have any questions or need assistance getting started.')}
    `, 'Your TrySpeekly team account is ready'),
  },

  // ── Offers ────────────────────────────────────────────────────────────────
  {
    type: 'offer_created',
    name: 'New Offer/Discount (Enrolled Students)',
    subject: '🎁 {{discountPercent}}% off on {{courseName}} — Limited Time!',
    variables: ['userName', 'offerTitle', 'courseName', 'discountPercent', 'offerDescription', 'endsAt', 'courseUrl'],
    htmlBody: wrap(`
      ${iconCircle('🎁', '#faf5ff')}
      ${badge('Limited Time Offer', 'live')}
      ${h1('Special Offer Just for You!')}
      ${para('Hi <strong>{{userName}}</strong>, we have an exclusive deal that we think you\'ll love. Don\'t miss out — this offer is only available for a limited time.')}
      ${promoBox('{{discountPercent}}% OFF', 'on {{courseName}}', '#7c3aed')}
      ${infoTable(
        infoRow('Offer Title', '{{offerTitle}}') +
        infoRow('Course', '{{courseName}}') +
        infoRow('Discount', '{{discountPercent}}% Off') +
        infoRow('Offer Expires', '{{endsAt}}')
      )}
      ${para('{{offerDescription}}')}
      ${btn('Claim This Offer', '{{courseUrl}}')}
      ${note('This is a time-limited offer. Act quickly before it expires and the price goes back to normal.')}
    `, 'Exclusive {{discountPercent}}% discount offer just for you'),
  },

  // ── Certificates ──────────────────────────────────────────────────────────
  {
    type: 'certificate_issued',
    name: 'Certificate Issued (Student)',
    subject: '🎓 Your certificate for {{courseName}} is ready!',
    variables: ['studentName', 'courseName', 'certificateId', 'certificateUrl'],
    htmlBody: wrap(`
      ${iconCircle('🎓', '#faf5ff')}
      ${badge('Certificate Earned', 'success')}
      ${h1('Congratulations, {{studentName}}!')}
      ${para('You have successfully completed <strong>{{courseName}}</strong> and earned your certificate of completion. We\'re proud of your dedication and progress.')}
      ${infoTable(
        infoRow('Course', '{{courseName}}') +
        infoRow('Credential ID', '{{certificateId}}') +
        infoRow('Status', '✓ Issued')
      )}
      ${btn('View & Download Certificate', '{{certificateUrl}}', '#7c3aed')}
      ${note('You can share this certificate on LinkedIn or download it as a PDF anytime from your dashboard.')}
    `, 'Your certificate for {{courseName}} is ready to download'),
  },

  // ── Referral payouts ──────────────────────────────────────────────────────
  {
    type: 'payout_approved',
    name: 'Payout Approved (Student)',
    subject: '💸 Your payout of {{currency}} {{amount}} has been approved',
    variables: ['studentName', 'amount', 'currency', 'walletBalance', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('💸', '#ecfdf5')}
      ${badge('Payout Approved', 'success')}
      ${h1('Your Payout is on the Way!')}
      ${para('Hi <strong>{{studentName}}</strong>, good news — your referral payout request has been approved and processed.')}
      ${infoTable(
        infoRow('Payout Amount', '{{currency}} {{amount}}') +
        infoRow('Remaining Wallet Balance', '{{currency}} {{walletBalance}}') +
        infoRow('Status', '✓ Approved')
      )}
      ${btn('View My Wallet', '{{dashboardUrl}}', '#059669')}
      ${note('Thank you for spreading the word about TrySpeekly. Keep sharing your referral link to earn more rewards!')}
    `, 'Your referral payout has been approved'),
  },
  {
    type: 'payout_rejected',
    name: 'Payout Rejected (Student)',
    subject: 'Update on your payout request — TrySpeekly',
    variables: ['studentName', 'amount', 'currency', 'reason', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('📋', '#fef2f2')}
      ${badge('Payout Not Approved', 'danger')}
      ${h1('About Your Payout Request')}
      ${para('Hi <strong>{{studentName}}</strong>, we\'ve reviewed your referral payout request of <strong>{{currency}} {{amount}}</strong> and it could not be approved at this time.')}
      ${infoTable(
        infoRow('Requested Amount', '{{currency}} {{amount}}') +
        infoRow('Status', '✗ Not Approved') +
        infoRow('Reason', '{{reason}}')
      )}
      ${btn('View My Wallet', '{{dashboardUrl}}', '#7c3aed')}
      ${note('Your referral balance remains intact. If you have any questions, please reach out to our support team.')}
    `, 'Update on your referral payout request'),
  },

  // ── Support ───────────────────────────────────────────────────────────────
  {
    type: 'support_reply',
    name: 'Support Ticket Reply (Student)',
    subject: 'New reply to your support ticket — TrySpeekly',
    variables: ['studentName', 'subject', 'replyPreview', 'dashboardUrl'],
    htmlBody: wrap(`
      ${iconCircle('💬', '#eff6ff')}
      ${badge('New Reply', 'info')}
      ${h1('Our Team Replied to You')}
      ${para('Hi <strong>{{studentName}}</strong>, our support team has responded to your ticket: <strong>{{subject}}</strong>.')}
      ${infoTable(
        infoRow('Ticket', '{{subject}}') +
        infoRow('Reply', '{{replyPreview}}')
      )}
      ${btn('View Conversation', '{{dashboardUrl}}', '#2563eb')}
      ${note('Open your support page to read the full reply and continue the conversation.')}
    `, 'Our support team replied to your ticket'),
  },
]

// ─── Default settings ─────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = [
  // Auth
  { type: 'otp_verification',            name: 'Email Verification OTP',              description: 'OTP sent when user registers and needs to verify their email',            category: 'auth',         enabled: true },
  { type: 'otp_forgot_password',         name: 'Forgot Password OTP',                 description: 'OTP sent when user requests a password reset',                           category: 'auth',         enabled: true },
  { type: 'account_verified_welcome',    name: 'Welcome Email (After Verification)',   description: 'Sent once after user verifies their email — includes onboarding info',   category: 'auth',         enabled: true },
  // Contact
  { type: 'contact_form_submitted',      name: 'Contact Form Confirmation',            description: 'Confirmation email to user after they submit the contact form',           category: 'contact',      enabled: true },
  // Enrollments
  { type: 'enrollment_confirmed',        name: 'Enrollment Confirmed (Student)',        description: 'Sent to student when they enroll in a course with full course details',  category: 'courses',      enabled: true },
  { type: 'enrollment_teacher_notification', name: 'New Student Notification (Teacher)', description: 'Sent to teacher when a student enrolls in their course',               category: 'courses',      enabled: true },
  // Payments
  { type: 'payment_submitted',           name: 'Payment Submitted (Student)',           description: 'Sent when student submits their payment proof',                          category: 'payments',     enabled: true },
  { type: 'payment_approved',            name: 'Payment Approved (Student)',            description: 'Sent when admin approves a student payment',                            category: 'payments',     enabled: true },
  { type: 'payment_rejected',            name: 'Payment Rejected (Student)',            description: 'Sent when admin rejects a student payment',                             category: 'payments',     enabled: true },
  { type: 'payment_resubmitted',         name: 'Payment Resubmitted (Student)',         description: 'Sent when student resubmits a previously rejected payment',             category: 'payments',     enabled: true },
  // Financial Aid
  { type: 'financial_aid_applied',       name: 'Financial Aid Application Submitted',  description: 'Confirmation email when student applies for financial aid',              category: 'financial_aid', enabled: true },
  { type: 'financial_aid_approved',      name: 'Financial Aid Approved',               description: 'Sent when admin approves a financial aid application',                  category: 'financial_aid', enabled: true },
  { type: 'financial_aid_rejected',      name: 'Financial Aid Rejected',               description: 'Sent when admin rejects a financial aid application',                   category: 'financial_aid', enabled: true },
  // Courses
  { type: 'course_created_pending',      name: 'Course Submitted for Review (Teacher)', description: 'Sent to teacher when they create a new course awaiting admin review',  category: 'courses',      enabled: true },
  { type: 'course_approved',             name: 'Course Approved (Teacher)',             description: 'Sent to teacher when admin approves their course',                      category: 'courses',      enabled: true },
  { type: 'course_rejected',             name: 'Course Rejected (Teacher)',             description: 'Sent to teacher when admin rejects their course',                       category: 'courses',      enabled: true },
  // Live Classes
  { type: 'live_class_started_teacher',  name: 'Live Class Started (Teacher)',          description: 'Sent to teacher when they start a live class',                          category: 'live_classes', enabled: true },
  { type: 'live_class_started_student',  name: 'Live Class Started (Student)',          description: 'Sent to all enrolled students when teacher starts a live class',        category: 'live_classes', enabled: true },
  // Assignments
  { type: 'assignment_created',          name: 'New Assignment (Student)',              description: 'Sent to enrolled students when teacher creates an assignment',           category: 'assignments',  enabled: true },
  // Salary
  { type: 'salary_processed',            name: 'Salary Processed (Teacher)',            description: 'Sent to teacher when admin processes their salary payment',             category: 'salary',       enabled: true },
  { type: 'salary_requested',            name: 'Salary Request Confirmation (Teacher)', description: 'Confirmation sent to teacher when they submit a salary request',        category: 'salary',       enabled: true },
  // Reviews
  { type: 'review_submitted',            name: 'Review Submitted (User)',               description: 'Confirmation when user submits a platform or course review',            category: 'reviews',      enabled: true },
  { type: 'review_approved',             name: 'Review Approved (User)',                description: 'Sent when admin approves a user review',                               category: 'reviews',      enabled: true },
  // Offers
  { type: 'offer_created',               name: 'New Offer/Discount (Students)',         description: 'Sent to relevant enrolled students when admin creates a new offer',     category: 'offers',       enabled: true },
  // Team Members
  { type: 'team_member_welcome',         name: 'Team Member Welcome',                   description: 'Sent to a new team member when their account is created by admin',     category: 'team',         enabled: true },
  // Certificates
  { type: 'certificate_issued',          name: 'Certificate Issued (Student)',          description: 'Sent to student when a certificate is issued or claimed',               category: 'courses',      enabled: true },
  // Referral Payouts
  { type: 'payout_approved',             name: 'Payout Approved (Student)',             description: 'Sent to student when admin approves their referral payout request',    category: 'referrals',    enabled: true },
  { type: 'payout_rejected',             name: 'Payout Rejected (Student)',             description: 'Sent to student when admin rejects their referral payout request',     category: 'referrals',    enabled: true },
  // Support
  { type: 'support_reply',               name: 'Support Ticket Reply (Student)',        description: 'Sent to student when support staff replies to their ticket',           category: 'support',      enabled: true },
]
