/**
 * Seed script: Add sample enrolled students + approved reviews to all courses
 * taught by Mina Rahman Khan.
 *
 * Run: node --experimental-vm-modules scripts/seed-mina-data.js
 * Or:  node scripts/seed-mina-data.js   (works if package.json has "type":"module")
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// ─── Minimal inline schemas (avoid circular imports) ──────────────────────────

const courseSchema = new mongoose.Schema(
  { enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] },
  { strict: false, timestamps: true, versionKey: false }
)
courseSchema.pre(/^find/, function () { this.where({ isDeleted: false }) })
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema)

const userSchema = new mongoose.Schema({}, { strict: false, timestamps: true, versionKey: false })
const User = mongoose.models.User || mongoose.model('User', userSchema)

const enrollmentSchema = new mongoose.Schema(
  {
    student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrolledAt: { type: Date, default: Date.now },
    isActive:  { type: Boolean, default: true },
    progress:  { sessionsAttended: { type: Number, default: 0 }, totalSessions: { type: Number, required: true } },
  },
  { strict: false, timestamps: true, versionKey: false }
)
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true })
const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema)

const reviewSchema = new mongoose.Schema(
  {
    type:        { type: String, default: 'course' },
    author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    rating:      { type: Number, required: true },
    content:     { type: String, required: true },
    status:      { type: String, default: 'approved' },
    authorName:  { type: String },
    authorImage: { type: String },
    authorRole:  { type: String, default: 'student' },
    isDeleted:   { type: Boolean, default: false },
  },
  { strict: false, timestamps: true, versionKey: false }
)
reviewSchema.index({ author: 1, course: 1 }, { unique: true, partialFilterExpression: { type: 'course' } })
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema)

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_REVIEWS = [
  { name: 'Ayesha Malik',      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', rating: 5, content: 'Mina is an absolutely wonderful teacher! Her explanations are crystal clear and she always makes sure every student understands before moving on. My English improved significantly within just a few weeks.' },
  { name: 'Bilal Ahmed',       image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', rating: 5, content: 'I was very nervous about speaking English but Mina\'s patient and encouraging approach helped me gain real confidence. The sessions are well-structured and very interactive.' },
  { name: 'Sana Tariq',        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80', rating: 4, content: 'Excellent course! Mina covers everything thoroughly. I especially loved the speaking practice exercises. Would highly recommend to anyone wanting to improve their fluency.' },
  { name: 'Usman Chaudhry',    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80', rating: 5, content: 'One of the best English courses I have taken. Mina is very professional and knowledgeable. She identifies your weak points right away and works on them effectively.' },
  { name: 'Fatima Noor',       image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80', rating: 5, content: 'I enrolled for IELTS preparation and the results were amazing. Mina\'s tips and strategies are practical and directly applicable. I achieved my target band score!' },
  { name: 'Hassan Raza',       image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80', rating: 4, content: 'Very good course. The lessons are engaging and Mina is always available to answer questions. My business English has improved a lot and I feel much more confident in meetings.' },
  { name: 'Zara Hussain',      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80', rating: 5, content: 'Mina is genuinely passionate about teaching. She goes above and beyond to help her students succeed. The course material is well-organised and the pace is perfect.' },
  { name: 'Kamran Iqbal',      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80', rating: 5, content: 'Highly recommend this course to everyone! Mina breaks down complex grammar rules into simple, easy-to-remember concepts. My spoken English has improved dramatically.' },
  { name: 'Nadia Saeed',       image: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=100&q=80', rating: 4, content: 'Great experience overall. The interactive sessions kept me engaged throughout. Mina\'s feedback is always constructive and encouraging. Worth every penny!' },
  { name: 'Tariq Mehmood',     image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&q=80', rating: 5, content: 'I was struggling with grammar for years but Mina made it so easy to understand. Her teaching style is unique and very effective. Five stars without any hesitation.' },
  { name: 'Mariam Shahid',     image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80', rating: 5, content: 'Absolutely loved this course. Mina is very thorough and covers all aspects of the language. The progress I made in just two months is remarkable. Thank you Mina!' },
  { name: 'Adeel Farooq',      image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&q=80', rating: 4, content: 'Really solid course. The content is comprehensive and Mina delivers it in a very friendly and approachable manner. I now feel comfortable speaking English in professional settings.' },
]

const STUDENT_NAMES = [
  'Ayesha Malik', 'Bilal Ahmed', 'Sana Tariq', 'Usman Chaudhry', 'Fatima Noor',
  'Hassan Raza', 'Zara Hussain', 'Kamran Iqbal', 'Nadia Saeed', 'Tariq Mehmood',
  'Mariam Shahid', 'Adeel Farooq', 'Rabia Khan', 'Imran Butt', 'Shazia Anwar',
  'Faisal Nawaz', 'Hina Qureshi', 'Shahid Latif', 'Amna Riaz', 'Waqar Ali',
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const directUri = 'mongodb://nabeeljaved:nabeeljaved@cluster0-shard-00-00.gsbme.mongodb.net:27017,cluster0-shard-00-01.gsbme.mongodb.net:27017,cluster0-shard-00-02.gsbme.mongodb.net:27017/english?authSource=admin&tls=true&replicaSet=atlas-gsbme-shard-0'
  await mongoose.connect(directUri, {
    dbName: process.env.DB_NAME,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    tlsInsecure: false,
  })
  console.log('✅ Connected to MongoDB')

  // 1. Find Mina Rahman Khan
  const mina = await User.findOne({ name: { $regex: /mina/i } }).lean()
  if (!mina) {
    console.error('❌ Could not find user with name matching "mina". Check the spelling in the DB.')
    process.exit(1)
  }
  console.log(`👩‍🏫 Found instructor: ${mina.name} (${mina._id})`)

  // 2. Find all Mina's courses
  const courses = await Course.find({ teacher: mina._id }).lean()
  if (!courses.length) {
    console.error('❌ No courses found for this instructor.')
    process.exit(1)
  }
  console.log(`📚 Found ${courses.length} course(s):`)
  courses.forEach(c => console.log(`   • ${c.title} (${c._id})`))

  // 3. Find existing students (use real users as author IDs for reviews)
  const existingStudents = await User.find({ role: 'student' }).select('_id name').limit(20).lean()
  console.log(`👥 Found ${existingStudents.length} existing student(s) to use`)

  // 4. For each course — add enrolled students + reviews
  for (const course of courses) {
    console.log(`\n⚙️  Processing: "${course.title}"`)

    const existingEnrolledSet = new Set(course.enrolledStudents?.map(id => id.toString()) ?? [])

    // Pick how many students to add (between 8 and 15)
    const targetCount = 8 + Math.floor(Math.random() * 8)
    const studentsPool = existingStudents.length >= targetCount
      ? existingStudents.slice(0, targetCount)
      : existingStudents

    // ── Add enrollments ───────────────────────────────────────────────────────
    const newStudentIds = []
    for (const student of studentsPool) {
      if (existingEnrolledSet.has(student._id.toString())) continue

      try {
        await Enrollment.create({
          student: student._id,
          course: course._id,
          teacher: mina._id,
          isActive: true,
          progress: { sessionsAttended: 0, totalSessions: course.totalSessions ?? 12 },
        })
        newStudentIds.push(student._id)
      } catch (err) {
        if (err.code !== 11000) console.warn(`   ⚠️  Enrollment error for ${student._id}: ${err.message}`)
      }
    }

    if (newStudentIds.length) {
      await Course.updateOne(
        { _id: course._id },
        { $addToSet: { enrolledStudents: { $each: newStudentIds } } }
      )
      console.log(`   ✅ Added ${newStudentIds.length} enrolled students`)
    } else {
      console.log(`   ℹ️  Students already enrolled or none available`)
    }

    // ── Add reviews ───────────────────────────────────────────────────────────
    // Pick 4–6 reviews per course, rotating through SAMPLE_REVIEWS
    const reviewCount = 4 + Math.floor(Math.random() * 3)
    let added = 0

    for (let i = 0; i < Math.min(reviewCount, studentsPool.length, SAMPLE_REVIEWS.length); i++) {
      const student = studentsPool[i]
      const sample = SAMPLE_REVIEWS[i % SAMPLE_REVIEWS.length]

      try {
        await Review.create({
          type: 'course',
          author: student._id,
          course: course._id,
          rating: sample.rating,
          content: sample.content,
          status: 'approved',
          authorName: sample.name,
          authorImage: sample.image,
          authorRole: 'student',
        })
        added++
      } catch (err) {
        if (err.code !== 11000) console.warn(`   ⚠️  Review error: ${err.message}`)
      }
    }
    console.log(`   ✅ Added ${added} reviews`)
  }

  console.log('\n🎉 Done! All courses updated.')
  await mongoose.disconnect()
}

run().catch(err => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})
