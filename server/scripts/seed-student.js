import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import User from '../src/models/user.model.js'

const STUDENT_EMAIL = 'student@tryspeekly.com'
const STUDENT_PASSWORD = 'Student@123'
const STUDENT_PHONE = '03009876543'
const STUDENT_NAME = 'Ali Hassan'

async function seedStudent() {
  await connectDB()

  const existing = await User.findOne({ email: STUDENT_EMAIL })
  if (existing) {
    console.log(`Student already exists: ${STUDENT_EMAIL}`)
    await mongoose.disconnect()
    return
  }

  const student = new User({
    name: STUDENT_NAME,
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
    phone: STUDENT_PHONE,
    role: 'student',
    isVerified: true,
    country: 'Pakistan',
  })

  await student.save()
  console.log(`✓ Student account created`)
  console.log(`  Name    : ${STUDENT_NAME}`)
  console.log(`  Email   : ${STUDENT_EMAIL}`)
  console.log(`  Password: ${STUDENT_PASSWORD}`)
  console.log(`  Role    : student`)
  await mongoose.disconnect()
}

seedStudent().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
