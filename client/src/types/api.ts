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
  error: { message: string; code?: string };
  fields?: Array<{ field: string; message: string }>;
}

// ─── User Types ──────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  /** Alias kept for component compatibility */
  id?: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  country?: string;
  city?: string;
  timezone?: string;
  profileImage?: string;
  /** Alias kept for component compatibility */
  photo?: string;
  bio?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  country?: string;
  city?: string;
  timezone?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'student' | 'teacher';
}

export interface VerifyEmailDto {
  email: string;
  otp: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Course Types ─────────────────────────────────────────────────────────────

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
  teacher: { _id: string; name: string; profileImage?: string; bio?: string };
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
  totalSessions: number;
  sessionDuration: number;
  recurringSchedule?: { day: string; time: string }[];
  meetLink?: string;
  maxStudents?: number;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {
  status?: 'draft' | 'published' | 'archived';
}

export interface CourseListResponse {
  success: boolean;
  data: Course[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CourseSingleResponse {
  success: boolean;
  data: Course;
}

// ─── Enrollment Types ─────────────────────────────────────────────────────────

export interface Enrollment {
  _id: string;
  student: { _id: string; name: string; email: string; profileImage?: string };
  course: { _id: string; title: string; thumbnail?: string; totalSessions?: number };
  teacher: { _id: string; name: string; profileImage?: string };
  payment?: string;
  enrolledAt: string;
  attendance: Array<{ sessionNumber: number; duration?: number; date: string }>;
  progress: { sessionsAttended: number; totalSessions: number; lastAttendedAt?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentDto {
  courseId: string;
  paymentId?: string;
}

export interface EnrollmentListResponse {
  success: boolean;
  data: Enrollment[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

// ─── Payment Types ────────────────────────────────────────────────────────────

export type PaymentMethod =
  | 'jazzcash' | 'easypaisa' | 'nayapay' | 'sadapay'
  | 'zindigi' | 'bank_local' | 'bank_international';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  _id: string;
  student: { _id: string; name: string; email: string };
  course: { _id: string; title: string };
  teacher: { _id: string; name: string };
  method: PaymentMethod;
  transactionId?: string;
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
  teacherId: string;
  method: PaymentMethod;
  transactionId?: string;
  amount: number;
  currency?: 'PKR' | 'USD';
  screenshot: File;
}

// ─── Message Types ────────────────────────────────────────────────────────────

export interface Message {
  _id: string;
  sender: { _id: string; name: string; profileImage?: string };
  receiver: { _id: string; name: string; profileImage?: string };
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  _id: { s: string; r: string };
  lastMessage: Message;
  unreadCount: number;
}

export interface SendMessageDto {
  receiverId: string;
  content: string;
}

// ─── Blog Types ───────────────────────────────────────────────────────────────

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: { _id: string; name: string; profileImage?: string; bio?: string };
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
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateBlogDto extends Partial<CreateBlogDto> {}

export interface BlogListResponse {
  success: boolean;
  data: Blog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface BlogSingleResponse {
  success: boolean;
  data: Blog;
}

// ─── Certificate Types ────────────────────────────────────────────────────────

export interface Certificate {
  _id: string;
  certificateId: string;
  enrollment: string;
  student: { _id: string; name: string };
  course: { _id: string; title: string; thumbnail?: string };
  issueDate: string;
  credentialUrl?: string;
  status: 'issued' | 'revoked';
  revokedAt?: string;
  createdAt: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface Notification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: 'system' | 'user' | 'payment' | 'security' | 'course' | 'message';
  severity: 'low' | 'medium' | 'high';
  read: boolean;
  readAt?: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

// ─── Support Types ────────────────────────────────────────────────────────────

export interface SupportMessage {
  _id: string;
  sender: 'student' | 'admin';
  senderId: string;
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  _id: string;
  student: { _id: string; name: string; email: string; profileImage?: string };
  course?: { _id: string; title: string };
  subject: string;
  description: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  messages: SupportMessage[];
  lastMessageAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  courseId?: string;
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
}

// ─── Financial Aid Types ──────────────────────────────────────────────────────

export interface FinancialAid {
  _id: string;
  student: { _id: string; name: string; email: string };
  course?: { _id: string; title: string };
  name: string;
  email: string;
  phone?: string;
  reason: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  appliedAt: string;
  decidedAt?: string;
  notes?: string;
  approvedAmount?: number;
  createdAt: string;
}

export interface ApplyFinancialAidDto {
  courseId?: string;
  name: string;
  email: string;
  phone?: string;
  reason: string;
}

// ─── FAQ Types ────────────────────────────────────────────────────────────────

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Announcement Types ───────────────────────────────────────────────────────

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'alert' | 'success';
  visibleTo: ('student' | 'teacher' | 'admin')[];
  expiredAt?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Contact Types ────────────────────────────────────────────────────────────

export interface ContactDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ─── Site Settings Types ──────────────────────────────────────────────────────

export interface SiteSettings {
  _id: string;
  site: { name?: string; tagline?: string; logoText?: string; footerCopyright?: string };
  contact: { phone?: string; email?: string; whatsapp?: string; address?: string; workingHours?: string };
  social: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; youtube?: string };
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string };
  logoUrl?: string;
  bannerUrl?: string;
  updatedAt: string;
}

// ─── Assignment Types ─────────────────────────────────────────────────────────

export interface Submission {
  _id: string;
  enrollment: string;
  student: { _id: string; name: string };
  submittedAt: string;
  fileUrl: string;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  gradedAt?: string;
}

export interface Assignment {
  _id: string;
  course: { _id: string; title: string };
  title: string;
  description: string;
  dueDate: string;
  submissions: Submission[];
  createdAt: string;
}
