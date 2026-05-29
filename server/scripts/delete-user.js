import mongoose from 'mongoose'
import 'dotenv/config'

const email = process.argv[2]
if (!email) { console.error('Usage: node scripts/delete-user.js <email>'); process.exit(1) }

await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })
const result = await mongoose.connection.db.collection('users').deleteOne({ email })
console.log(result.deletedCount ? `✓ Deleted user: ${email}` : `✗ User not found: ${email}`)
await mongoose.disconnect()
