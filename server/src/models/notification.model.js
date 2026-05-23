import mongoose from 'mongoose'

const { Schema, model } = mongoose

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    type: {
      type: String,
      enum: ['system', 'user', 'payment', 'security', 'course', 'message', 'financial_aid'],
      default: 'system',
    },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    relatedId: { type: Schema.Types.ObjectId },
    relatedType: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false }
)

notificationSchema.index({ recipient: 1, read: 1 })
notificationSchema.index({ createdAt: -1 })

const Notification = mongoose.models.Notification || model('Notification', notificationSchema)

export default Notification
