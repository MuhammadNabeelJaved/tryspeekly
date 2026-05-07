export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

export const COURSE_TYPES = {
  GROUP: 'group',
  ONE_TO_ONE: 'one-to-one',
  HYBRID: 'hybrid',
} as const;

export const COURSE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export const COURSE_FOCUS = {
  SPEAKING: 'speaking',
  GRAMMAR: 'grammar',
  IELTS: 'ielts',
  BUSINESS: 'business',
  GENERAL: 'general',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const PAYMENT_METHODS = {
  JAZZCASH: 'jazzcash',
  EASYPAISA: 'easypaisa',
  NAYAPAY: 'nayapay',
  SADAPAY: 'sadapay',
  ZINDIGI: 'zindigi',
  BANK_LOCAL: 'bank_local',
  BANK_INTERNATIONAL: 'bank_international',
} as const;

export const CURRENCIES = {
  PKR: 'PKR',
  USD: 'USD',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type CourseType = typeof COURSE_TYPES[keyof typeof COURSE_TYPES];
export type CourseLevel = typeof COURSE_LEVELS[keyof typeof COURSE_LEVELS];
export type CourseFocus = typeof COURSE_FOCUS[keyof typeof COURSE_FOCUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];
