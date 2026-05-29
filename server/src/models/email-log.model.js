import mongoose from 'mongoose'

const emailLogSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    to: { type: String, required: true },
    toName: { type: String, default: '' },
    subject: { type: String, default: '' },
    status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent', index: true },
    resendId: { type: String, default: '' },
    error: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

emailLogSchema.index({ createdAt: -1 })

export default mongoose.model('EmailLog', emailLogSchema)
