import mongoose from 'mongoose'

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
)

subscriberSchema.index({ email: 1 })
subscriberSchema.index({ token: 1 })
subscriberSchema.index({ status: 1 })

export default mongoose.model('NewsletterSubscriber', subscriberSchema)
