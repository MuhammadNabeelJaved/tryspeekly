import mongoose from 'mongoose'

const { Schema, model } = mongoose

const payoutRequestSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'ReferralWallet',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
)

payoutRequestSchema.index({ student: 1, status: 1 })
payoutRequestSchema.index({ status: 1, createdAt: -1 })

const PayoutRequest =
  mongoose.models.PayoutRequest ||
  model('PayoutRequest', payoutRequestSchema)

export default PayoutRequest
