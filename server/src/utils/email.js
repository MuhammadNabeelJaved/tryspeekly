import nodemailer from 'nodemailer'

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

const canSendEmail = () =>
  Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)

export const sendForgotPasswordOtp = async ({ to, otp }) => {
  if (!canSendEmail()) {
    console.log(`[DEV] Forgot-password OTP for ${to}: ${otp}`)
    return
  }

  const transporter = createTransporter()

  await transporter.sendMail({
    from: `"EnglishPro" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Reset Your Password — EnglishPro',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #e2e8f0">
        <h2 style="margin:0 0 8px;font-size:24px;color:#1e293b">Reset your password</h2>
        <p style="margin:0 0 24px;color:#64748b;font-size:15px">
          Use the code below to reset your EnglishPro password. It expires in <strong>15 minutes</strong>.
        </p>
        <div style="background:#f8fafc;border:2px dashed #7c3aed;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#7c3aed">${otp}</span>
        </div>
        <p style="margin:0;color:#94a3b8;font-size:13px">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export const sendVerificationOtp = async ({ to, otp }) => {
  if (!canSendEmail()) {
    console.log(`[DEV] Verification OTP for ${to}: ${otp}`)
    return
  }

  const transporter = createTransporter()

  await transporter.sendMail({
    from: `"EnglishPro" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Verify Your Email — EnglishPro',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #e2e8f0">
        <h2 style="margin:0 0 8px;font-size:24px;color:#1e293b">Verify your email</h2>
        <p style="margin:0 0 24px;color:#64748b;font-size:15px">
          Enter this code to verify your EnglishPro account. It expires in <strong>24 hours</strong>.
        </p>
        <div style="background:#f8fafc;border:2px dashed #059669;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#059669">${otp}</span>
        </div>
        <p style="margin:0;color:#94a3b8;font-size:13px">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}
