/**
 * One-time DB brand migration: replace any stale "EnglishPro" / "Speekly" branding
 * with "TrySpeekly" in the email templates (and site settings) that are stored in
 * MongoDB. The CODE defaults are already correct, but `seedEmailDefaults()` only
 * inserts new rows ($setOnInsert) and never overwrites existing ones — so templates
 * seeded before the rebrand keep the old name at runtime. This fixes those rows.
 *
 * Customisations are preserved: it only string-replaces brand tokens, nothing else.
 *
 *   Dry run (default — shows what WOULD change, writes nothing):
 *     node scripts/fix-email-brand.js
 *
 *   Apply for real:
 *     APPLY=true node scripts/fix-email-brand.js
 */
import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import connectDB from '../src/database/db.js'
import EmailTemplate from '../src/models/email-template.model.js'
import SiteSettings from '../src/models/site-settings.model.js'

const APPLY = process.env.APPLY === 'true'

// Replace brand tokens. Order matters; (?<!Try) keeps already-correct "TrySpeekly" intact.
const fixBrand = (s) =>
  typeof s !== 'string'
    ? s
    : s
        .replace(/englishpro\.com/gi, 'tryspeekly.com')
        .replace(/EnglishPro/g, 'TrySpeekly')
        .replace(/englishpro/gi, 'tryspeekly')
        .replace(/(?<!Try)Speekly Academy/g, 'TrySpeekly')
        .replace(/(?<!Try)Speekly/g, 'TrySpeekly')

async function run() {
  await connectDB()
  console.log(APPLY ? '⚙️  APPLY mode — writing changes\n' : '🔍 DRY RUN — no changes will be written (set APPLY=true to apply)\n')

  // ── Email templates ──────────────────────────────────────────────────────────
  const templates = await EmailTemplate.find({})
  let tplChanged = 0
  for (const t of templates) {
    const newSubject = fixBrand(t.subject)
    const newBody = fixBrand(t.htmlBody)
    if (newSubject !== t.subject || newBody !== t.htmlBody) {
      tplChanged++
      console.log(`📧 ${t.type}`)
      if (newSubject !== t.subject) console.log(`   subject: "${t.subject}" → "${newSubject}"`)
      if (newBody !== t.htmlBody) console.log(`   body: branding updated (${t.htmlBody.length} chars)`)
      if (APPLY) {
        t.subject = newSubject
        t.htmlBody = newBody
        await t.save()
      }
    }
  }
  console.log(`\nEmail templates: ${tplChanged} of ${templates.length} need branding fixes.`)

  // ── Site settings (footer/contact/social brand strings) ──────────────────────
  const settings = await SiteSettings.findOne()
  let settingsChanged = 0
  if (settings) {
    for (const section of ['site', 'contact', 'social', 'seo']) {
      const sub = settings[section]
      if (!sub) continue
      for (const key of Object.keys(sub.toObject ? sub.toObject() : sub)) {
        const fixed = fixBrand(sub[key])
        if (fixed !== sub[key]) {
          settingsChanged++
          console.log(`⚙️  site-settings.${section}.${key}: "${sub[key]}" → "${fixed}"`)
          if (APPLY) sub[key] = fixed
        }
      }
      if (APPLY) settings.markModified(section)
    }
    if (APPLY && settingsChanged > 0) await settings.save()
  }
  console.log(`Site settings: ${settingsChanged} field(s) need branding fixes.`)

  console.log(APPLY ? '\n✅ Done — changes written.' : '\n✅ Dry run complete. Re-run with APPLY=true to write.')
  await mongoose.disconnect()
}

run().catch(async (err) => {
  console.error('Migration failed:', err.message)
  await mongoose.disconnect()
  process.exit(1)
})
