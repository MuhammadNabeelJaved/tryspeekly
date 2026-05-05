export interface StudentUser {
  id: string
  name: string
  email: string
  avatar: string
  phone: string
  city: string
  country: string
  joinDate: string
}

export interface EnrolledCourse {
  id: string
  courseId: string
  title: string
  level: string
  instructorName: string
  schedule: string // e.g., "Mon, Wed, Fri • 7:00 PM PKT"
  nextClassTime: string // ISO date string for the upcoming class
  nextClassNumber: number // e.g., Class 12 of 24
  totalClasses: number
  meetingLink: string
  meetingId: string
  passcode: string
  attendance: number // Percentage 0-100
  attendedClasses: number
  status: 'active' | 'completed' | 'paused'
  materialsUrl: string
  certificateUrl?: string
  certificateId?: string
  issueDate?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  date: string
  type: 'info' | 'alert' | 'success'
}

export interface Assignment {
  id: string
  courseName: string
  title: string
  dueDate: string
  status: 'pending' | 'submitted' | 'graded'
}

export interface PaymentRecord {
  id: string
  amount: number
  currency: string
  method: string
  date: string
  status: 'completed' | 'pending' | 'failed'
  description: string
  receiptUrl?: string
}

export interface FinancialAidApp {
  id: string
  courseName: string
  appliedAt: string
  status: 'pending' | 'under_review' | 'accepted' | 'rejected'
  amountRequested: number
  message: string
}

export const MOCK_STUDENT: StudentUser = {
  id: 'st_123',
  name: 'Ahmed Ali',
  email: 'ahmed.ali@example.com',
  avatar: 'A',
  phone: '+92 300 1234567',
  city: 'Karachi',
  country: 'Pakistan',
  joinDate: '2026-01-15',
}

// Ensure the mock date is slightly in the future so the UI shows an upcoming class
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
tomorrow.setHours(19, 0, 0, 0)

const todayLater = new Date()
todayLater.setHours(todayLater.getHours() + 2)

export const MOCK_ENROLLED_COURSES: EnrolledCourse[] = [
  {
    id: 'enc_1',
    courseId: 'c_1',
    title: 'Spoken English Mastery',
    level: 'Intermediate',
    instructorName: 'Sarah Johnson',
    schedule: 'Mon, Wed, Fri • 7:00 PM PKT',
    nextClassTime: todayLater.toISOString(),
    nextClassNumber: 12,
    totalClasses: 24,
    meetingLink: 'https://zoom.us/j/123456789',
    meetingId: '123 456 789',
    passcode: 'ENGLISH',
    attendance: 92,
    attendedClasses: 11,
    status: 'active',
    materialsUrl: '/materials/c_1'
  },
  {
    id: 'enc_2',
    courseId: 'c_3',
    title: 'IELTS Preparation Masterclass',
    level: 'Advanced',
    instructorName: 'David Smith',
    schedule: 'Tue, Thu, Sat • 6:00 PM PKT',
    nextClassTime: tomorrow.toISOString(),
    nextClassNumber: 5,
    totalClasses: 18,
    meetingLink: 'https://zoom.us/j/987654321',
    meetingId: '987 654 321',
    passcode: 'IELTS9',
    attendance: 100,
    attendedClasses: 4,
    status: 'active',
    materialsUrl: '/materials/c_3'
  },
  {
    id: 'enc_3',
    courseId: 'c_2',
    title: 'Business English Basics',
    level: 'Beginner',
    instructorName: 'James Williams',
    schedule: 'Sat, Sun • 10:00 AM PKT',
    nextClassTime: '',
    nextClassNumber: 12,
    totalClasses: 12,
    meetingLink: '',
    meetingId: '',
    passcode: '',
    attendance: 85,
    attendedClasses: 10,
    status: 'completed',
    materialsUrl: '/materials/c_2',
    certificateUrl: '/certificates/cert_123.pdf',
    certificateId: 'EP-2026-0891X',
    issueDate: '2026-03-20T10:00:00Z'
  }
]

export const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay_1',
    amount: 15000,
    currency: 'PKR',
    method: 'Easypaisa',
    date: '2026-01-14T09:00:00Z',
    status: 'completed',
    description: 'Spoken English Mastery - Full Payment',
    receiptUrl: '/receipts/pay_1.pdf'
  },
  {
    id: 'pay_2',
    amount: 8000,
    currency: 'PKR',
    method: 'JazzCash',
    date: '2026-02-10T11:20:00Z',
    status: 'completed',
    description: 'Business English Basics - Full Payment',
    receiptUrl: '/receipts/pay_2.pdf'
  }
]

export const MOCK_FINANCIAL_AID: FinancialAidApp[] = [
  {
    id: 'fa_1',
    courseName: 'IELTS Preparation Masterclass',
    appliedAt: '2026-05-01T15:00:00Z',
    status: 'under_review',
    amountRequested: 10000,
    message: 'I am a university student and need this course to apply for a scholarship abroad.'
  }
]

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Eid Holidays Schedule',
    content: 'All live classes will be suspended from May 15th to May 18th for Eid holidays. Classes will resume on May 19th.',
    date: '2026-05-02T10:00:00Z',
    type: 'info'
  },
  {
    id: 'ann_2',
    title: 'Zoom Link Update',
    content: 'The Zoom link for "Spoken English Mastery" has been updated. Please use the new link provided in your dashboard.',
    date: '2026-05-01T08:30:00Z',
    type: 'alert'
  }
]

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'ass_1',
    courseName: 'Spoken English Mastery',
    title: 'Self Introduction Video Recording',
    dueDate: tomorrow.toISOString(),
    status: 'pending'
  },
  {
    id: 'ass_2',
    courseName: 'IELTS Preparation Masterclass',
    title: 'Reading Mock Test #2',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
    status: 'pending'
  }
]