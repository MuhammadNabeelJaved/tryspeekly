import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import User from '../src/models/user.model.js'

const INSTRUCTOR_EMAIL = 'instructor@tryspeekly.com'
const INSTRUCTOR_PASSWORD = 'Instructor@123'
const INSTRUCTOR_PHONE = '03001234567'
const INSTRUCTOR_NAME = 'Sarah Johnson'

async function seedInstructor() {
  await connectDB()

  const existing = await User.findOne({ email: INSTRUCTOR_EMAIL })
  if (existing) {
    console.log(`Instructor already exists: ${INSTRUCTOR_EMAIL}`)
    await mongoose.disconnect()
    return
  }

  const instructor = new User({
    name: INSTRUCTOR_NAME,
    email: INSTRUCTOR_EMAIL,
    password: INSTRUCTOR_PASSWORD,
    phone: INSTRUCTOR_PHONE,
    role: 'teacher',
    isVerified: true,
    bio: 'Certified English language instructor with 8+ years of teaching experience.',
    country: 'Pakistan',
  })

  await instructor.save()
  console.log(`✓ Instructor account created`)
  console.log(`  Name    : ${INSTRUCTOR_NAME}`)
  console.log(`  Email   : ${INSTRUCTOR_EMAIL}`)
  console.log(`  Password: ${INSTRUCTOR_PASSWORD}`)
  console.log(`  Role    : teacher`)
  await mongoose.disconnect()
}

seedInstructor().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
