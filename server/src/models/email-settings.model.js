import mongoose from 'mongoose'

const emailSettingsSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['auth', 'payments', 'courses', 'financial_aid', 'live_classes', 'assignments', 'salary', 'reviews', 'offers', 'contact'],
      default: 'auth',
    },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('EmailSettings', emailSettingsSchema)
