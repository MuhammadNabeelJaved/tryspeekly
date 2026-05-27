import mongoose from 'mongoose'

const { Schema, model } = mongoose

const paymentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['jazzcash', 'easypaisa', 'nayapay', 'sadapay', 'zindigi', 'bank_local', 'bank_international'],
    },
    transactionId: { type: String, trim: true },
    screenshotUrl: { type: String, trim: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount cannot be negative'] },
    currency: { type: String, enum: ['PKR', 'USD'], default: 'PKR' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    discountApplied: { type: Number, default: 0 },
    offerDiscountApplied: { type: Number, default: 0 },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
  },
  { timestamps: true, versionKey: false }
)

paymentSchema.index({ student: 1, status: 1 })
paymentSchema.index({ createdAt: -1 })

const Payment = mongoose.models.Payment || model('Payment', paymentSchema)

export default Payment
