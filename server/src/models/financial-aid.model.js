import mongoose from 'mongoose'

const { Schema, model } = mongoose

const financialAidSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: { type: String, trim: true },
    reason: {
      type: String,
      required: [true, 'Reason for financial aid is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'accepted', 'rejected'],
      default: 'pending',
    },
    appliedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date },
    notes: { type: String, trim: true },
    approvedAmount: { type: Number, min: [0, 'Approved amount cannot be negative'] },
  },
  { timestamps: true, versionKey: false }
)

const FinancialAid = mongoose.models.FinancialAid || model('FinancialAid', financialAidSchema)

export default FinancialAid
