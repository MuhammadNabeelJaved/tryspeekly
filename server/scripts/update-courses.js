import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import User from '../src/models/user.model.js'
import Course from '../src/models/course.model.js'
import LiveClass from '../src/models/live-class.model.js'

async function updateCourses() {
  await connectDB()

  const teacher = await User.findOne({ role: 'teacher' })
  if (!teacher) {
    console.log('No teacher found.')
    await mongoose.disconnect()
    return
  }

  console.log(`Teacher: ${teacher.name}`)

  // Update all courses to have 15 sessions
  const courses = await Course.find({ teacher: teacher._id })
  console.log(`Found ${courses.length} courses`)

  for (const course of courses) {
    course.totalSessions = 15
    await course.save()
    console.log(`✓ Updated ${course.title} to 15 sessions`)
  }

  // Delete all existing completed live classes
  await LiveClass.deleteMany({ teacher: teacher._id, status: 'completed' })
  console.log('✓ Deleted all completed live classes')

  // Create sample completed classes for some courses
  const sampleClasses = [
    { courseIndex: 0, classNumber: 1, daysAgo: 14, link: 'https://zoom.us/j/class001' },
    { courseIndex: 0, classNumber: 2, daysAgo: 12, link: 'https://zoom.us/j/class002' },
    { courseIndex: 0, classNumber: 3, daysAgo: 10, link: 'https://zoom.us/j/class003' },
    { courseIndex: 0, classNumber: 4, daysAgo: 8, link: 'https://zoom.us/j/class004' },
    { courseIndex: 0, classNumber: 5, daysAgo: 6, link: 'https://zoom.us/j/class005' },
    { courseIndex: 0, classNumber: 6, daysAgo: 4, link: 'https://zoom.us/j/class006' },
    { courseIndex: 0, classNumber: 7, daysAgo: 2, link: 'https://zoom.us/j/class007' },
    { courseIndex: 1, classNumber: 1, daysAgo: 13, link: 'https://zoom.us/j/spoken001' },
    { courseIndex: 1, classNumber: 2, daysAgo: 11, link: 'https://zoom.us/j/spoken002' },
    { courseIndex: 1, classNumber: 3, daysAgo: 9, link: 'https://zoom.us/j/spoken003' },
    { courseIndex: 1, classNumber: 4, daysAgo: 7, link: 'https://zoom.us/j/spoken004' },
    { courseIndex: 1, classNumber: 5, daysAgo: 5, link: 'https://zoom.us/j/spoken005' },
    { courseIndex: 2, classNumber: 1, daysAgo: 14, link: 'https://zoom.us/j/business001' },
    { courseIndex: 2, classNumber: 2, daysAgo: 12, link: 'https://zoom.us/j/business002' },
    { courseIndex: 2, classNumber: 3, daysAgo: 10, link: 'https://zoom.us/j/business003' },
    { courseIndex: 3, classNumber: 1, daysAgo: 7, link: 'https://zoom.us/j/grammar001' },
    { courseIndex: 3, classNumber: 2, daysAgo: 5, link: 'https://zoom.us/j/grammar002' },
    { courseIndex: 4, classNumber: 1, daysAgo: 10, link: 'https://zoom.us/j/beginner001' },
  ]

  let completedCount = 0

  for (const cls of sampleClasses) {
    if (courses[cls.courseIndex]) {
      const liveClass = new LiveClass({
        course: courses[cls.courseIndex]._id,
        teacher: teacher._id,
        meetingLink: cls.link,
        classNumber: cls.classNumber,
        status: 'completed',
        createdAt: new Date(Date.now() - cls.daysAgo * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - cls.daysAgo * 24 * 60 * 60 * 1000),
      })
      await liveClass.save()
      completedCount++
    }
  }

  console.log(`\n✓ Added ${completedCount} completed classes`)
  console.log('\n--- Summary ---')
  console.log(`Total Courses: ${courses.length}`)
  console.log(`Each course sessions: 15`)
  console.log(`Total completed classes: ${completedCount}`)

  // Show per course breakdown
  for (const course of courses) {
    const count = sampleClasses.filter(c => courses[c.courseIndex]?._id.toString() === course._id.toString()).length
    console.log(`  - ${course.title}: ${count}/15 completed`)
  }

  await mongoose.disconnect()
}

updateCourses().catch((err) => {
  console.error('Update failed:', err.message)
  process.exit(1)
})