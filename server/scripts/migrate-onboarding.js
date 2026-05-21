import 'dotenv/config'
import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI
const DB_NAME   = process.env.DB_NAME || 'english'

async function run() {
  await mongoose.connect(`${MONGO_URI}/${DB_NAME}`)
  console.log('Connected to MongoDB')

  // Set isOnboardingDone: true for every user that doesn't have the field yet.
  // New users created after the feature was added already have false stored
  // explicitly, so { $exists: false } leaves them untouched.
  const result = await mongoose.connection.db
    .collection('users')
    .updateMany(
      { isOnboardingDone: { $exists: false } },
      { $set: { isOnboardingDone: true } }
    )

  console.log(`Migration complete: ${result.modifiedCount} users updated`)
  await mongoose.disconnect()
}

run().catch(err => { console.error(err); process.exit(1) })
