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
    You received this because you subscribed to TrySpeekly newsletters. &nbsp;
    <a href="${url}" style="color:#7c3aed;text-decoration:underline">Unsubscribe</a>
  </p>
</div>`
}

// ─── Welcome Email ────────────────────────────────────────────────────────────
export const sendNewsletterWelcome = async ({ to, token }) => {
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL || 'TrySpeekly <onboarding@resend.dev>'
  const unsubscribeUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/unsubscribe?token=${token}`
  const subject = 'Welcome to TrySpeekly Newsletter! 🎉'

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7">
    <tr><td align="center" style="padding:40px 16px">
      <table cellpadding="0" cellspacing="0" style="width:100%;max-width:580px">
        <tr>
          <td style="background:linear-gradient(135deg,#6d28d9,#7c3aed,#4c1d95);border-radius:20px 20px 0 0;padding:32px 40px;text-align:center">
            <p style="margin:0;font-size:24px;font-weight:900;color:#fff">TrySpeekly</p>
            <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase">Newsletter</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:40px">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#1e293b">Welcome aboard! 🎉</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7">
              Thank you for subscribing to the <strong>TrySpeekly Newsletter</strong>. You're now part of a community of learners working towards English fluency.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
              Here's what to expect in your inbox:
            </p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px">
              <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#475569;font-size:14px">📚 &nbsp;<strong>New courses</strong> and learning resources every week</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#475569;font-size:14px">💡 &nbsp;<strong>English tips & tricks</strong> from expert instructors</td></tr>
              <tr><td style="padding:10px 0;color:#475569;font-size:14px">🎁 &nbsp;<strong>Exclusive offers</strong> for subscribers only</td></tr>
            </table>
            <p style="margin:0;font-size:14px;color:#94a3b8">— The TrySpeekly Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 20px 20px;padding:20px 40px;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">
              You subscribed with this email address. &nbsp;
              <a href="${unsubscribeUrl}" style="color:#7c3aed;text-decoration:underline">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  if (!resend) {
    console.log(`[DEV Newsletter] Welcome email → ${to}`)
    await EmailLog.create({ type: 'newsletter_welcome', to, toName: '', subject, status: 'skipped', metadata: {} }).catch(() => {})
    return
  }

  try {
    await resend.emails.send({ from, to, subject, html })
    await EmailLog.create({ type: 'newsletter_welcome', to, toName: '', subject, status: 'sent', metadata: {} })
  } catch (err) {
    console.error(`[Newsletter] Welcome email failed for ${to}:`, err.message)
    await EmailLog.create({ type: 'newsletter_welcome', to, toName: '', subject, status: 'failed', error: err.message, metadata: {} }).catch(() => {})
  }
}

// ─── Campaign Dispatch ────────────────────────────────────────────────────────
export const dispatchCampaign = async (campaignId) => {
  const campaign = await NewsletterCampaign.findById(campaignId).lean()
  if (!campaign || campaign.status !== 'sending') return

  const subscribers = await NewsletterSubscriber.find({ status: 'active' }).lean()
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL || 'TrySpeekly <onboarding@resend.dev>'

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
