import mongoose from 'mongoose'

const { Schema, model } = mongoose

const transactionSchema = new Schema(
  {
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: true }
)

const referralWalletSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalPaidOut: { type: Number, default: 0 },
    transactions: [transactionSchema],
  },
  { timestamps: true, versionKey: false }
)

const ReferralWallet =
  mongoose.models.ReferralWallet ||
  model('ReferralWallet', referralWalletSchema)

export default ReferralWallet
