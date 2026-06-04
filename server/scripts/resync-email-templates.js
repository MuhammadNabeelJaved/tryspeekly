/**
 * Re-sync the DB email templates from the code DEFAULT_TEMPLATES.
 *
 * Email bodies are stored in MongoDB and `seedEmailDefaults()` never overwrites
 * existing rows, so structural template changes in code (fonts, header markup,
 * logo) don't reach already-seeded rows. This script overwrites each template's
 * subject / htmlBody / name / variables with the current code version so the DB
 * matches the code exactly.
 *
 * Templates an admin has edited (isCustomized === true) are SKIPPED to preserve
 * their work.
 *
 *   Dry run (default):   node scripts/resync-email-templates.js
 *   Apply for real:      APPLY=true node scripts/resync-email-templates.js
 */
import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import EmailTemplate from '../src/models/email-template.model.js'
import { DEFAULT_TEMPLATES } from '../src/utils/emailTemplates.js'

const APPLY = process.env.APPLY === 'true'

async function run() {
  await connectDB()
  console.log(APPLY ? '⚙️  APPLY mode — writing changes\n' : '🔍 DRY RUN — no changes written (set APPLY=true to apply)\n')

  let updated = 0
  let created = 0
  let skippedCustom = 0
  let unchanged = 0

  for (const tpl of DEFAULT_TEMPLATES) {
    const existing = await EmailTemplate.findOne({ type: tpl.type })

    if (!existing) {
      console.log(`➕ ${tpl.type} — missing, will create`)
      created++
      if (APPLY) await EmailTemplate.create(tpl)
      continue
    }

    if (existing.isCustomized) {
      console.log(`⏭️  ${tpl.type} — SKIPPED (admin-customized)`)
      skippedCustom++
      continue
    }

    const changed = existing.subject !== tpl.subject || existing.htmlBody !== tpl.htmlBody
    if (!changed) {
      unchanged++
      continue
    }

    console.log(`🔄 ${tpl.type} — body/subject updated to match code`)
    updated++
    if (APPLY) {
      existing.subject = tpl.subject
      existing.htmlBody = tpl.htmlBody
      existing.name = tpl.name
      existing.variables = tpl.variables
      await existing.save()
    }
  }

  console.log(`\nSummary: ${updated} updated, ${created} created, ${unchanged} already in sync, ${skippedCustom} customized (skipped).`)
  console.log(APPLY ? '\n✅ Done — changes written.' : '\n✅ Dry run complete. Re-run with APPLY=true to write.')
  await mongoose.disconnect()
}

run().catch(async (err) => {
  console.error('Re-sync failed:', err.message)
  await mongoose.disconnect()
  process.exit(1)
})
