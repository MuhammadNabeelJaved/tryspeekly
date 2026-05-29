import mongoose from 'mongoose'
import 'dotenv/config'
import { DEFAULT_TEMPLATES } from '../src/utils/emailTemplates.js'

await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })

let updated = 0
for (const t of DEFAULT_TEMPLATES) {
  const result = await mongoose.connection.db.collection('emailtemplates').updateOne(
    { type: t.type },
    { $set: { subject: t.subject, htmlBody: t.htmlBody, isCustomized: false } }
  )
  if (result.matchedCount) {
    updated++
    console.log(`✓ Reset: ${t.type}`)
  } else {
    console.log(`✗ Not found in DB: ${t.type}`)
  }
}

console.log(`\nDone — ${updated}/${DEFAULT_TEMPLATES.length} templates reset.`)
await mongoose.disconnect()
