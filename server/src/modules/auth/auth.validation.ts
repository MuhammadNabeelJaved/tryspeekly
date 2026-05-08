import { body } from 'express-validator';

export const authValidation = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('country').optional().trim(),
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  refresh: [
    body('refreshToken').notEmpty().withMessage('Refresh token required'),
  ],

  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  ],

  resetPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
};
