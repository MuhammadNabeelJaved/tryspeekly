import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import User from '../src/models/user.model.js'
import Course from '../src/models/course.model.js'

const COURSES = [
  {
    title: 'IELTS Academic Prep',
    description: 'Comprehensive IELTS preparation covering all four modules: Reading, Writing, Speaking, and Listening. Perfect for students aiming for band 7+.',
    price: 25000,
    currency: 'PKR',
    type: 'group',
    level: 'advanced',
    focus: 'ielts',
    totalSessions: 24,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 30,
    recurringSchedule: [
      { day: 'monday', time: '18:00' },
      { day: 'wednesday', time: '18:00' },
    ],
    meetLink: 'https://zoom.us/j/123456789',
  },
  {
    title: 'Spoken English Mastery',
    description: 'Transform your spoken English with focus on pronunciation, fluency, and confidence. Includes real-world conversations and practice.',
    price: 18000,
    currency: 'PKR',
    type: 'group',
    level: 'intermediate',
    focus: 'speaking',
    totalSessions: 20,
    sessionDuration: 45,
    status: 'published',
    maxStudents: 25,
    recurringSchedule: [
      { day: 'tuesday', time: '19:00' },
      { day: 'thursday', time: '19:00' },
      { day: 'saturday', time: '10:00' },
    ],
    meetLink: 'https://zoom.us/j/987654321',
  },
  {
    title: 'Business English Basics',
    description: 'Learn professional English for the workplace. Cover emails, presentations, meetings, and business vocabulary.',
    price: 22000,
    currency: 'PKR',
    type: 'hybrid',
    level: 'intermediate',
    focus: 'business',
    totalSessions: 16,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 20,
    recurringSchedule: [
      { day: 'monday', time: '20:00' },
      { day: 'friday', time: '20:00' },
    ],
    meetLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    title: 'Advanced Grammar Excellence',
    description: 'Master complex grammatical structures including conditionals, reported speech, passive voice, and more.',
    price: 15000,
    currency: 'PKR',
    type: 'group',
    level: 'advanced',
    focus: 'grammar',
    totalSessions: 12,
    sessionDuration: 45,
    status: 'published',
    maxStudents: 25,
    recurringSchedule: [
      { day: 'wednesday', time: '17:00' },
      { day: 'sunday', time: '11:00' },
    ],
    meetLink: 'https://zoom.us/j/456123789',
  },
  {
    title: 'Conversational English for Beginners',
    description: 'Perfect for beginners. Start from scratch and build confidence in everyday conversations.',
    price: 12000,
    currency: 'PKR',
    type: 'group',
    level: 'beginner',
    focus: 'speaking',
    totalSessions: 24,
    sessionDuration: 45,
    status: 'published',
    maxStudents: 30,
    recurringSchedule: [
      { day: 'tuesday', time: '16:00' },
      { day: 'thursday', time: '16:00' },
      { day: 'saturday', time: '09:00' },
    ],
    meetLink: 'https://zoom.us/j/789123456',
  },
  {
    title: 'IELTS Speaking Special',
    description: 'Focus exclusively on IELTS Speaking module with practice tests, cue cards, and examiner tips.',
    price: 20000,
    currency: 'PKR',
    type: 'one-to-one',
    level: 'intermediate',
    focus: 'ielts',
    totalSessions: 10,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 1,
    recurringSchedule: [
      { day: 'monday', time: '14:00' },
      { day: 'wednesday', time: '14:00' },
    ],
    meetLink: 'https://zoom.us/j/111222333',
  },
  {
    title: 'Professional Email Writing',
    description: 'Learn to write professional emails that get results. Cover formal letters, proposals, and business correspondence.',
    price: 10000,
    currency: 'PKR',
    type: 'group',
    level: 'intermediate',
    focus: 'business',
    totalSessions: 8,
    sessionDuration: 45,
    status: 'published',
    maxStudents: 20,
    recurringSchedule: [
      { day: 'saturday', time: '14:00' },
    ],
    meetLink: 'https://meet.google.com/xyz-uvwx-yz',
  },
  {
    title: 'English for Job Interviews',
    description: 'Prepare for job interviews with confidence. Learn common questions, answers, and interview techniques.',
    price: 8000,
    currency: 'PKR',
    type: 'group',
    level: 'beginner',
    focus: 'speaking',
    totalSessions: 6,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 15,
    recurringSchedule: [
      { day: 'sunday', time: '15:00' },
    ],
    meetLink: 'https://zoom.us/j/444555666',
  },
  {
    title: 'Daily Vocabulary Builder',
    description: 'Expand your vocabulary with 500+ essential words. Learn usage, pronunciation, and context through daily practice.',
    price: 6000,
    currency: 'PKR',
    type: 'group',
    level: 'beginner',
    focus: 'general',
    totalSessions: 30,
    sessionDuration: 30,
    status: 'published',
    maxStudents: 50,
    recurringSchedule: [
      { day: 'monday', time: '08:00' },
      { day: 'wednesday', time: '08:00' },
      { day: 'friday', time: '08:00' },
    ],
    meetLink: 'https://zoom.us/j/777888999',
  },
  {
    title: 'Public Speaking & Presentation Skills',
    description: 'Overcome stage fear and learn to deliver compelling presentations. Perfect for professionals and students.',
    price: 16000,
    currency: 'PKR',
    type: 'group',
    level: 'advanced',
    focus: 'speaking',
    totalSessions: 12,
    sessionDuration: 60,
    status: 'published',
    maxStudents: 20,
    recurringSchedule: [
      { day: 'tuesday', time: '20:00' },
      { day: 'saturday', time: '16:00' },
    ],
    meetLink: 'https://zoom.us/j/101010101',
  },
]

async function seedCourses() {
  await connectDB()

  // Find teacher
  const teacher = await User.findOne({ role: 'teacher' })
  if (!teacher) {
    console.log('No teacher found. Please run seed-instructor.js first.')
    await mongoose.disconnect()
    return
  }

  console.log(`Found teacher: ${teacher.name} (${teacher._id})`)

  // Check existing courses
  const existingCount = await Course.countDocuments({ teacher: teacher._id })
  if (existingCount > 0) {
    console.log(`Teacher already has ${existingCount} courses. Adding more...`)
  }

  // Create courses
  const createdCourses = []
  for (const courseData of COURSES) {
    const course = new Course({
      ...courseData,
      teacher: teacher._id,
    })
    await course.save()
    createdCourses.push(course)
    console.log(`✓ Created: ${courseData.title}`)
  }

  console.log(`\n✓ Successfully created ${createdCourses.length} courses`)
  await mongoose.disconnect()
}

seedCourses().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})