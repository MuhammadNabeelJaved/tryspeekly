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
  role: 'student' | 'teacher' | 'admin' | 'team_member';
  phone?: string;
  country?: string;
  city?: string;
  timezone?: string;
  profileImage?: string;
  /** Alias kept for component compatibility */
  photo?: string;
  bio?: string;
  isVerified?: boolean;
  isOnboardingDone?: boolean;
  jobTitle?: string;
  permissions?: string[];
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

export interface CourseMaterial {
  _id: string;
  title: string;
  link: string;
  sharedAt: string;
}

export interface SyllabusTopic {
  _id: string;
  week: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  priceUSD?: number;
  currency: 'PKR' | 'USD';
  pricingType?: 'monthly' | 'full_course' | 'per_session';
  type: 'group' | 'one-to-one' | 'hybrid';
  level: 'beginner' | 'intermediate' | 'advanced';
  focus: 'speaking' | 'grammar' | 'ielts' | 'business' | 'general';
  thumbnail?: string;
  totalSessions: number;
  sessionDuration: number;
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  teacher: { _id: string; name: string; profileImage?: string; bio?: string };
  enrolledStudents: string[];
  recurringSchedule?: { day: string; time: string }[];
  meetLink?: string;
  maxStudents?: number;
  materials?: CourseMaterial[];
  syllabus?: SyllabusTopic[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  price?: number;
  priceUSD?: number;
  currency?: 'PKR' | 'USD';
  pricingType?: 'monthly' | 'full_course' | 'per_session';
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

export interface EnrolledPayment {
  _id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  currency: 'PKR' | 'USD';
  screenshotUrl?: string;
  transactionId?: string;
  rejectionReason?: string;
  adminNote?: string;
  createdAt: string;
}

export interface Enrollment {
  _id: string;
  student: { _id: string; name: string; email: string; profileImage?: string };
  course: {
    _id: string;
    title: string;
    thumbnail?: string;
    totalSessions?: number;
    level?: string;
    type?: string;
    sessionDuration?: number;
    recurringSchedule?: Array<{ day: string; time: string }>;
    price?: number;
    priceUSD?: number;
    currency?: 'PKR' | 'USD';
    pricingType?: 'monthly' | 'full_course' | 'per_session';
  };
  teacher: { _id: string; name: string; profileImage?: string };
  payment?: EnrolledPayment | null;
  financialAid?: { _id: string; status: string; name: string } | null;
  isActive: boolean;
  enrolledAt: string;
  attendance: Array<{ sessionNumber: number; duration?: number; date: string }>;
  progress: { sessionsAttended: number; totalSessions: number; lastAttendedAt?: string };
  createdAt: string;
  updatedAt: string;
  coupon?: string | null;
  discountApplied?: number;
  offer?: string | null;
  offerDiscountApplied?: number;
}

export interface CreateEnrollmentDto {
  courseId: string;
  paymentId?: string;
  couponCode?: string;
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
  course: { _id: string; title: string; price?: number; priceUSD?: number; currency?: 'PKR' | 'USD'; pricingType?: 'monthly' | 'full_course' | 'per_session' };
  teacher: { _id: string; name: string };
  method: PaymentMethod;
  transactionId?: string;
  screenshotUrl: string;
  amount: number;
  currency: 'PKR' | 'USD';
  status: PaymentStatus;
  adminNote?: string;
  rejectionReason?: string;
  coupon?: { _id: string; code: string; source: string };
  discountApplied?: number;
  offerDiscountApplied?: number;
  enrollmentActive?: boolean;
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
  couponCode?: string;
}

export interface AdminCreatePaymentDto {
  studentId: string;
  courseId: string;
  teacherId: string;
  method: PaymentMethod;
  transactionId?: string;
  amount: number;
  currency?: 'PKR' | 'USD';
  adminNote?: string;
}

export interface DirectApprovePaymentDto {
  enrollmentId: string;
  method: PaymentMethod;
  transactionId?: string;
  amount: number;
  currency?: 'PKR' | 'USD';
  adminNote?: string;
}

export interface UnpaidEnrollment {
  _id: string;
  student: { _id: string; name: string; email: string; profileImage?: string };
  course: { _id: string; title: string; level?: string; price?: number; priceUSD?: number; currency?: 'PKR' | 'USD'; pricingType?: 'monthly' | 'full_course' | 'per_session' };
  teacher: { _id: string; name: string };
  enrolledAt: string;
  isActive: boolean;
  discountApplied?: number;
  offerDiscountApplied?: number;
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
  user: {
    _id: string;
    name: string;
    profileImage?: string;
    role: 'student' | 'teacher' | 'admin';
  };
  lastMessage: Message | null;
  unreadCount: number;
}

export interface Contact {
  _id: string;
  name: string;
  profileImage?: string;
  role: 'student' | 'teacher' | 'admin';
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
  author: { _id: string; name: string; profileImage?: string; bio?: string; role?: string; jobTitle?: string };
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  readTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  _id: string;
  blog: string | { _id: string; title: string; slug: string; status?: string };
  author: { _id: string; name: string; email?: string; profileImage?: string; role?: string };
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  moderatedBy?: string;
  moderatedAt?: string;
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
  slug?: string;
  readTime?: string;
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

export type BlogCommentListResponse = ApiResponse<BlogComment[]>;
export type BlogCommentSingleResponse = ApiResponse<BlogComment>;

// ─── Certificate Types ────────────────────────────────────────────────────────

export interface Certificate {
  _id: string;
  certificateId: string;
  enrollment: string | { _id: string; teacher?: { _id: string; name: string } };
  student: { _id: string; name: string };
  course: { _id: string; title: string; thumbnail?: string; level?: string };
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
  type: 'system' | 'user' | 'payment' | 'security' | 'course' | 'message' | 'financial_aid';
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
  student?: { _id: string; name: string; email: string };
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
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  status: 'new' | 'in_progress' | 'resolved' | 'spam';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Site Settings Types ──────────────────────────────────────────────────────

export interface SiteSettings {
  _id: string;
  site: { name?: string; tagline?: string; logoText?: string; footerCopyright?: string; footerDescription?: string };
  contact: { phone?: string; email?: string; whatsapp?: string; address?: string; workingHours?: string };
  social: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; youtube?: string };
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string };
  homepage?: {
    blogCount?: number;
    courseCount?: number;
    featuredCourseIds?: string[];
    featuredBlogIds?: string[];
  };
  logoUrl?: string;
  bannerUrl?: string;
  paymentsSetup?: Record<string, unknown>;
  blockedCountries?: string[];
  updatedAt: string;
}

export interface AdminStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  revenue: Record<string, number>;
  pendingPayments: number;
  failedPayments: number;
  pendingCourseReviews: number;
  pendingFinancialAid: number;
  coursesByStatus: {
    published: number;
    pending: number;
    draft: number;
    rejected: number;
    archived: number;
  };
  studentsByCountry: Array<{ country: string; count: number }>;
  paymentsByMethod: Array<{ method: string; count: number }>;
  recentEnrollments: Array<{
    _id: string;
    studentName: string;
    courseName: string;
    country: string;
    paymentStatus: string;
    enrolledAt: string;
  }>;
  enrollmentsByCourse: Array<{ title: string; count: number }>;
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

// ─── Review Types ─────────────────────────────────────────────────────────────

export interface Review {
  _id: string;
  type: 'platform' | 'course' | 'team';
  author: {
    _id: string;
    name: string;
    profileImage?: string;
    role: 'student' | 'teacher' | 'admin' | 'team_member';
    email?: string;
  } | null;
  course?: {
    _id: string;
    title: string;
  };
  jobTitle?: string;
  rating: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  featuredOnHome: boolean;
  adminNote?: string;
  /** Admin-set display overrides (merged into `author` by the API when present). */
  authorName?: string;
  authorImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitReviewDto {
  type: 'platform' | 'course' | 'team';
  courseId?: string;
  rating: number;
  content: string;
}

export interface UpdateReviewDto {
  rating?: number;
  content?: string;
}

export interface AdminUpdateReviewStatusDto {
  status: 'approved' | 'rejected';
  adminNote?: string;
}

export interface AdminCreateReviewDto {
  type: 'platform' | 'course';
  courseId?: string;
  rating: number;
  content: string;
  status?: 'pending' | 'approved';
  featuredOnHome?: boolean;
  /** Optional custom display name shown instead of the admin's own name. */
  authorName?: string;
  /** Optional avatar URL (pasted). Ignored if authorImageFile is provided. */
  authorImage?: string;
  /** Optional avatar file upload. Takes priority over authorImage. */
  authorImageFile?: File | null;
  /** Display role for the review; defaults to student. */
  authorRole?: 'student' | 'teacher' | 'admin';
}

export type ReviewListResponse = ApiPaginatedResponse<Review>;
export type ReviewSingleResponse = ApiResponse<Review>;

// ─── Salary Types ─────────────────────────────────────────────────────────────

export type SalaryType = 'monthly' | 'weekly' | 'per_course' | 'hourly' | 'custom';
export type SalaryPackageStatus = 'active' | 'inactive';
export type SalaryPaymentStatus = 'paid' | 'pending' | 'overdue';

export interface SalaryPackage {
  _id: string;
  teacher: Pick<User, '_id' | 'name' | 'email' | 'profileImage'>;
  amount: number;
  type: SalaryType;
  customType?: string;
  startDate: string;
  endDate?: string;
  status: SalaryPackageStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryPayment {
  _id: string;
  package: string;
  teacher: string;
  amount: number;
  periodLabel?: string;
  periodStart: string;
  periodEnd?: string;
  status: SalaryPaymentStatus;
  paidDate?: string;
  notes?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryPackageDto {
  teacher: string;
  amount: number;
  type: SalaryType;
  customType?: string;
  startDate: string;
  endDate?: string;
  status?: SalaryPackageStatus;
  notes?: string;
}

export interface UpdateSalaryPackageDto {
  amount?: number;
  type?: SalaryType;
  customType?: string;
  startDate?: string;
  endDate?: string;
  status?: SalaryPackageStatus;
  notes?: string;
}

export interface CreateSalaryPaymentDto {
  amount: number;
  periodLabel?: string;
  periodStart: string;
  periodEnd?: string;
  status?: SalaryPaymentStatus;
  paidDate?: string;
  notes?: string;
  paymentMethod?: string;
}

export interface UpdateSalaryPaymentDto {
  amount?: number;
  periodLabel?: string;
  periodStart?: string;
  periodEnd?: string;
  status?: SalaryPaymentStatus;
  paidDate?: string;
  notes?: string;
  paymentMethod?: string;
}

// ─── Salary Requests ──────────────────────────────────────────────────────────

export type SalaryRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SalaryRequest {
  _id: string;
  teacher: string;
  package: string;
  amount: number;
  periodLabel?: string;
  periodStart: string;
  periodEnd?: string;
  note?: string;
  status: SalaryRequestStatus;
  adminReply?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryRequestDto {
  amount: number;
  periodStart: string;
  periodLabel?: string;
  periodEnd?: string;
  note?: string;
}

export interface AdminResolveSalaryRequestDto {
  adminReply?: string;
}

// ─── Team Management Types ────────────────────────────────────────────────────

export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  jobTitle?: string;
  permissions: string[];
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamChatMessage {
  _id: string;
  from: { _id: string; name: string; profileImage?: string; role: string };
  to: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CreateTeamMemberDto {
  name: string;
  email: string;
  password: string;
  jobTitle?: string;
  permissions: string[];
}

export interface UpdateTeamMemberDto {
  name?: string;
  email?: string;
  jobTitle?: string;
  permissions?: string[];
}
