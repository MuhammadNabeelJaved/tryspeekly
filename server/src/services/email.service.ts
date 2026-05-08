import { Resend } from 'resend';
import logger from './logger.service';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'English LMS <noreply@yourdomain.com>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      ...(options.text && { text: options.text }),
    });

    if (error) {
      logger.error('Email send failed:', error);
      throw error;
    }

    logger.info(`Email sent successfully to ${options.to}`);
  } catch (error) {
    logger.error('Email service error:', error);
    throw error;
  }
};

export const emailTemplates = {
  enrollmentConfirmation: (studentName: string, courseName: string) => ({
    subject: 'Enrollment Confirmation',
    html: `
      <h2>Welcome to ${courseName}!</h2>
      <p>Hi ${studentName},</p>
      <p>Your payment has been approved and you're now enrolled in the course.</p>
      <p>You can access your course from your dashboard.</p>
    `,
  }),

  paymentApproved: (studentName: string, courseName: string, amount: number, currency: string) => ({
    subject: 'Payment Approved',
    html: `
      <h2>Payment Approved</h2>
      <p>Hi ${studentName},</p>
      <p>Your payment of ${amount} ${currency} for <strong>${courseName}</strong> has been approved.</p>
      <p>You can now access your course.</p>
    `,
  }),

  paymentRejected: (studentName: string, courseName: string, reason: string) => ({
    subject: 'Payment Verification Failed',
    html: `
      <h2>Payment Verification Failed</h2>
      <p>Hi ${studentName},</p>
      <p>Unfortunately, your payment for <strong>${courseName}</strong> could not be verified.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please submit a new payment or contact support.</p>
    `,
  }),

  teacherCredentials: (teacherName: string, email: string, password: string) => ({
    subject: 'Your Teacher Account Credentials',
    html: `
      <h2>Welcome to English LMS</h2>
      <p>Hi ${teacherName},</p>
      <p>An admin has created your teacher account. Here are your credentials:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please log in and change your password immediately.</p>
    `,
  }),

  passwordResetOtp: (userName: string, otp: string) => ({
    subject: 'Password Reset OTP',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  }),
};
