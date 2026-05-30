import mongoose from 'mongoose'

const campaignSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [300, 'Subject cannot exceed 300 characters'],
    },
    htmlBody: {
      type: String,
      required: [true, 'Content is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
      default: 'draft',
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    totalSent: {
      type: Number,
      default: 0,
    },
    totalFailed: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
)

campaignSchema.index({ createdAt: -1 })
campaignSchema.index({ status: 1, scheduledAt: 1 })

export default mongoose.models.NewsletterCampaign || mongoose.model('NewsletterCampaign', campaignSchema)
