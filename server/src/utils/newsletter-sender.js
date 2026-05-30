import { Resend } from 'resend'

import EmailLog from '../models/email-log.model.js'
import NewsletterCampaign from '../models/newsletter-campaign.model.js'
import NewsletterSubscriber from '../models/newsletter-subscriber.model.js'

// ─── Constants ────────────────────────────────────────────────────────────────
const BATCH_SIZE = 50
const BATCH_DELAY_MS = 200

// ─── Resend client (lazy-initialised) ─────────────────────────────────────────
let _resend = null
const getResend = () => {
  if (!_resend && process.env.RESEND_API_KEY) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const buildHtml = (htmlBody, token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/unsubscribe?token=${token}`
  return `${htmlBody}
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center">
  <p style="margin:0;font-size:12px;color:#94a3b8">
    You received this because you subscribed to EnglishPro newsletters. &nbsp;
    <a href="${url}" style="color:#7c3aed;text-decoration:underline">Unsubscribe</a>
  </p>
</div>`
}

// ─── Campaign Dispatch ────────────────────────────────────────────────────────
export const dispatchCampaign = async (campaignId) => {
  const campaign = await NewsletterCampaign.findById(campaignId).lean()
  if (!campaign || campaign.status !== 'sending') return

  const subscribers = await NewsletterSubscriber.find({ status: 'active' }).lean()
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL || 'EnglishPro <onboarding@resend.dev>'

  let totalSent = 0
  let totalSkipped = 0
  let totalFailed = 0

  console.log(`[Newsletter] Dispatching campaign ${campaignId} to ${subscribers.length} subscribers`)

  try {
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(
        batch.map(async (sub) => {
          const html = buildHtml(campaign.htmlBody, sub.token)
          try {
            if (resend) {
              await resend.emails.send({ from, to: sub.email, subject: campaign.subject, html })
              await EmailLog.create({
                type: 'newsletter_campaign',
                to: sub.email,
                toName: '',
                subject: campaign.subject,
                status: 'sent',
                metadata: { campaignId: String(campaignId) },
              })
              totalSent++
            } else {
              await EmailLog.create({
                type: 'newsletter_campaign',
                to: sub.email,
                toName: '',
                subject: campaign.subject,
                status: 'skipped',
                metadata: { campaignId: String(campaignId) },
              })
              totalSkipped++
            }
          } catch (err) {
            await EmailLog.create({
              type: 'newsletter_campaign',
              to: sub.email,
              toName: '',
              subject: campaign.subject,
              status: 'failed',
              error: err.message,
              metadata: { campaignId: String(campaignId) },
            }).catch(() => {})
            totalFailed++
          }
        })
      )

      if (i + BATCH_SIZE < subscribers.length) await sleep(BATCH_DELAY_MS)
    }

    await NewsletterCampaign.findByIdAndUpdate(campaignId, {
      status: 'sent',
      sentAt: new Date(),
      totalSent,
      totalFailed,
    })

    console.log(`[Newsletter] Campaign ${campaignId} complete — sent:${totalSent} failed:${totalFailed}`)
  } catch (err) {
    console.error(`[Newsletter] dispatchCampaign fatal error for campaign ${campaignId}:`, err.message)
    await NewsletterCampaign.findByIdAndUpdate(campaignId, { status: 'failed' }).catch(() => {})
    throw err
  }
}
