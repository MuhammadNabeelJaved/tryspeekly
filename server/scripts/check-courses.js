import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import Course from '../src/models/course.model.js'
import LiveClass from '../src/models/live-class.model.js'

async function checkCourses() {
  await connectDB()

  const teacher = await User.findOne({ role: 'teacher' })
  const courses = await Course.find({})
  console.log('\n=== All Courses ===')
  courses.forEach(c => console.log(c.title, '- status:', c.status, '- sessions:', c.totalSessions))

  const completedClasses = await LiveClass.find({ status: 'completed' })
  console.log('\n=== Completed Classes ===')
  console.log('Total:', completedClasses.length)

  for (const lc of completedClasses) {
    const course = courses.find(c => c._id.toString() === lc.course.toString())
    console.log(`  Class ${lc.classNumber} - ${course?.title || 'Unknown'}`)
  }

  await mongoose.disconnect()
}

import User from '../src/models/user.model.js'
checkCourses().catch(console.error)