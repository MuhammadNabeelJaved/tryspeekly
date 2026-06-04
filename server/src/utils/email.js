import { Resend } from 'resend'

import EmailLog from '../models/email-log.model.js'
import EmailSettings from '../models/email-settings.model.js'
import EmailTemplate from '../models/email-template.model.js'
import { DEFAULT_TEMPLATES, DEFAULT_SETTINGS } from './emailTemplates.js'

// ─── Resend client (lazy-initialised) ─────────────────────────────────────────
let _resend = null
const getResend = () => {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// ─── Template variable renderer ───────────────────────────────────────────────
const render = (str, vars) =>
  str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : ''
  )

// ─── Seed defaults on first boot ──────────────────────────────────────────────
let _seeded = false
export const seedEmailDefaults = async () => {
  if (_seeded) return
  _seeded = true
  try {
    for (const tpl of DEFAULT_TEMPLATES) {
      await EmailTemplate.findOneAndUpdate(
        { type: tpl.type },
        { $setOnInsert: tpl },
        { upsert: true, new: false }
      )
    }
    for (const s of DEFAULT_SETTINGS) {
      await EmailSettings.findOneAndUpdate(
        { type: s.type },
        { $setOnInsert: s },
        { upsert: true, new: false }
      )
    }
  } catch (err) {
    console.warn('[Email] Seed error:', err.message)
  }
}

// ─── Core send function ───────────────────────────────────────────────────────
export const sendEmail = async ({ type, to, toName = '', variables = {}, metadata = {} }) => {
  let subject = type
  try {
    // 1. Check enabled status
    const setting = await EmailSettings.findOne({ type }).lean()
    if (setting && !setting.enabled) {
      await EmailLog.create({ type, to, toName, subject: 'skipped', status: 'skipped', metadata })
      return
    }

    // 2. Get template
    const template = await EmailTemplate.findOne({ type }).lean()
    if (!template) {
      console.warn(`[Email] No template for type: ${type}`)
      return
    }

    subject = render(template.subject, variables)
    const html = render(template.htmlBody, variables)

    const resend = getResend()
    if (!resend) {
      console.log(`[DEV Email] type=${type} to=${to} subject="${subject}"`)
      await EmailLog.create({ type, to, toName, subject, status: 'skipped', metadata, error: 'No RESEND_API_KEY' })
      return
    }

    // 3. Send via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'TrySpeekly <onboarding@resend.dev>'
    const result = await resend.emails.send({ from: fromEmail, to, subject, html })

    await EmailLog.create({
      type, to, toName, subject, status: 'sent',
      resendId: result?.data?.id ?? '',
      metadata,
    })
  } catch (err) {
    console.error(`[Email] Failed: type=${type} to=${to}`, err.message)
    try {
      await EmailLog.create({ type, to, toName, subject, status: 'failed', metadata, error: err.message })
    } catch { /* ignore log errors */ }
  }
}

// ─── Convenience wrappers (backward-compatible OTP functions) ─────────────────
export const sendVerificationOtp = ({ to, otp, name = '' }) =>
  sendEmail({ type: 'otp_verification', to, toName: name, variables: { name: name || to, otp }, metadata: { otp } })

export const sendForgotPasswordOtp = ({ to, otp, name = '' }) =>
  sendEmail({ type: 'otp_forgot_password', to, toName: name, variables: { name: name || to, otp }, metadata: { otp } })
