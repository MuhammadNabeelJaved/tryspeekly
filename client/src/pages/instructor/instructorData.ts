export const MOCK_INSTRUCTOR = {
  id: 'inst1',
  name: 'Sarah Johnson',
  email: 'sarah.j@tryspeekly.com',
  avatar: 'SJ',
  role: 'Senior IELTS Instructor',
  rating: 4.9,
  studentsCount: 145,
  coursesCount: 4,
  earnings: 2450.00,
}

export const INSTRUCTOR_COURSES = [
  { id: 'c1', title: 'IELTS Academic Prep', students: 45, status: 'active', nextClass: 'Today, 6:00 PM', progress: 65, totalClasses: 20, maxStudents: 50, level: 'Advanced', duration: '10 Weeks', category: 'Live Class', price: '$199', startDate: 'Oct 15, 2025', image: 'https://images.unsplash.com/photo-1544650030-3c51ad04fe0b?q=80&w=800&auto=format&fit=crop', description: 'Intensive preparation for the IELTS Academic exam with live practice sessions.' },
  { id: 'c2', title: 'Business English Basics', students: 30, status: 'active', nextClass: 'Tomorrow, 4:00 PM', progress: 40, totalClasses: 15, maxStudents: 40, level: 'Intermediate', duration: '8 Weeks', category: 'Hybrid', price: '$149', startDate: 'Nov 01, 2025', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop', description: 'Learn essential vocabulary and communication skills for the modern workplace.' },
  { id: 'c3', title: 'Advanced Grammar', students: 25, status: 'upcoming', nextClass: 'Mon, 10:00 AM', progress: 0, totalClasses: 12, maxStudents: 30, level: 'Advanced', duration: '6 Weeks', category: 'Recorded Course', price: '$99', startDate: 'Dec 10, 2025', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop', description: 'Master complex grammatical structures to speak and write like a native.' },
  { id: 'c4', title: 'Conversational English', students: 45, status: 'active', nextClass: 'Wed, 7:00 PM', progress: 80, totalClasses: 24, maxStudents: 50, level: 'Beginner', duration: '12 Weeks', category: 'Live Class', price: '$249', startDate: 'Sep 05, 2025', image: 'https://images.unsplash.com/photo-1529156069898-49953eb1f5ff?q=80&w=800&auto=format&fit=crop', description: 'Overcome your fear of speaking with daily conversation practice in small groups.' },
]

export const INSTRUCTOR_STUDENTS = [
  { id: 's1', name: 'Ali Khan', course: 'IELTS Academic Prep', status: 'excellent', attendance: 95, attendedClasses: 19, totalClasses: 20 },
  { id: 's2', name: 'Ayesha Tariq', course: 'Business English Basics', status: 'good', attendance: 85, attendedClasses: 17, totalClasses: 20 },
  { id: 's3', name: 'Bilal Ahmed', course: 'Advanced Grammar', status: 'needs_attention', attendance: 60, attendedClasses: 12, totalClasses: 20 },
  { id: 's4', name: 'Fatima Noor', course: 'IELTS Academic Prep', status: 'good', attendance: 90, attendedClasses: 18, totalClasses: 20 },
  { id: 's5', name: 'Zainab Rehman', course: 'Conversational English', status: 'excellent', attendance: 100, attendedClasses: 20, totalClasses: 20 },
]

export const RECENT_ASSIGNMENTS = [
  { id: 'a1', title: 'Speaking Task 2 Practice', course: 'IELTS Academic Prep', submitted: 40, total: 45, dueDate: '2026-05-05' },
  { id: 'a2', title: 'Email Writing Exercise', course: 'Business English Basics', submitted: 28, total: 30, dueDate: '2026-05-06' },
  { id: 'a3', title: 'Conditionals Quiz', course: 'Advanced Grammar', submitted: 0, total: 25, dueDate: '2026-05-10' },
]
