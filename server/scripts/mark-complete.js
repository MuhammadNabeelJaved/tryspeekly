import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

await mongoose.connect(process.env.MONGO_URI)

const result = await mongoose.connection.db.collection('enrollments').updateOne(
  { _id: new mongoose.Types.ObjectId('6a0a485f3341fc9c43bdf265') },
  { $set: { 'progress.sessionsAttended': 15 } }
)

console.log('Updated:', result.modifiedCount, 'document(s)')
await mongoose.disconnect()
