// ─── Generic Response Wrappers ───────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  fields?: Array<{ field: string; message: string }>;
}

// ─── User Types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  country?: string;
  photo?: string;
  bio?: string;
  specializations?: string[];
  createdAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  country?: string;
  photo?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  role: 'student' | 'teacher';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

// ─── Course Types ───────────────────────────────────────────────────────────

export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  currency: 'PKR' | 'USD';
  type: 'group' | 'one-to-one' | 'hybrid';
  level: 'beginner' | 'intermediate' | 'advanced';
  focus: 'speaking' | 'grammar' | 'ielts' | 'business' | 'general';
  thumbnail?: string;
  totalSessions: number;
  sessionDuration: number;
  status: 'draft' | 'published' | 'archived';
  teacher: {
    _id: string;
    name: string;
    email: string;
    photo?: string;
  };
  enrolledStudents: string[];
  recurringSchedule?: { day: string; time: string }[];
  meetLink?: string;
  maxStudents?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  price: number;
  currency?: 'PKR' | 'USD';
  type: 'group' | 'one-to-one' | 'hybrid';
  level: 'beginner' | 'intermediate' | 'advanced';
  focus: 'speaking' | 'grammar' | 'ielts' | 'business' | 'general';
  thumbnail?: string;
  totalSessions: number;
  sessionDuration: number;
  recurringSchedule?: { day: string; time: string }[];
  meetLink?: string;
  maxStudents?: number;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {}

export interface CourseListResponse {
  success: boolean;
  data: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CourseSingleResponse {
  success: boolean;
  data: Course;
}

// ─── Enrollment Types ───────────────────────────────────────────────────────

export interface Enrollment {
  _id: string;
  student: { _id: string; name: string; email: string; photo?: string };
  course: { _id: string; title: string; thumbnail?: string };
  teacher: { _id: string; name: string; email: string };
  payment: string;
  enrolledAt: string;
  expiresAt?: string;
  isActive: boolean;
  progress: {
    sessionsAttended: number;
    totalSessions: number;
    lastAttendedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentDto {
  courseId: string;
  paymentId: string;
}

export interface EnrollmentListResponse {
  success: boolean;
  data: Enrollment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Payment Types ──────────────────────────────────────────────────────────

export type PaymentMethod = 'jazzcash' | 'easypaisa' | 'nayapay' | 'sadapay' | 'zindigi' | 'bank_local' | 'bank_international';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  _id: string;
  student: { _id: string; name: string; email: string };
  course: { _id: string; title: string };
  teacher: { _id: string; name: string };
  method: PaymentMethod;
  transactionId: string;
  screenshotUrl: string;
  amount: number;
  currency: 'PKR' | 'USD';
  status: PaymentStatus;
  adminNote?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  courseId: string;
  method: PaymentMethod;
  amount: number;
  currency: 'PKR' | 'USD';
}

export interface VerifyPaymentDto {
  paymentId: string;
  transactionId: string;
  screenshotUrl?: string;
}

// ─── Message Types ──────────────────────────────────────────────────────────

export interface Message {
  _id: string;
  sender: { _id: string; name: string; photo?: string };
  receiver: { _id: string; name: string; photo?: string };
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  user: { _id: string; name: string; photo?: string; role: string };
  lastMessage: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export interface SendMessageDto {
  receiverId: string;
  content: string;
}

// ─── Blog Types ─────────────────────────────────────────────────────────────

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: {
    _id: string;
    name: string;
    photo?: string;
  };
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogDto {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateBlogDto extends Partial<CreateBlogDto> {}

export interface BlogListResponse {
  success: boolean;
  data: Blog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BlogSingleResponse {
  success: boolean;
  data: Blog;
}

// ─── Contact Types ──────────────────────────────────────────────────────────

export interface ContactDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}