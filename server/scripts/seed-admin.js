import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import User from '../src/models/user.model.js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_PHONE = process.env.ADMIN_PHONE

async function seedAdmin() {
  await connectDB()

  const existing = await User.findOne({ email: ADMIN_EMAIL })
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`)
    await mongoose.disconnect()
    return
  }

  const admin = new User({
    name: 'Admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    phone: ADMIN_PHONE,
    role: 'admin',
    isVerified: true,
  })

  await admin.save()
  console.log(`✓ Admin account created: ${ADMIN_EMAIL}`)
  await mongoose.disconnect()
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
