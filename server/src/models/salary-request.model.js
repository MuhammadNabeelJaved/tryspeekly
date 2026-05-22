import mongoose from 'mongoose'

const { Schema, model } = mongoose

const salaryRequestSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryPackage',
      required: [true, 'Package ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    periodLabel: {
      type: String,
      trim: true,
      maxlength: [100, 'Period label cannot exceed 100 characters'],
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
    },
    periodEnd: {
      type: Date,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminReply: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin reply cannot exceed 500 characters'],
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
)

salaryRequestSchema.index({ teacher: 1 })
salaryRequestSchema.index({ status: 1 })
salaryRequestSchema.index({ createdAt: -1 })

const SalaryRequest =
  mongoose.models.SalaryRequest || model('SalaryRequest', salaryRequestSchema)

export default SalaryRequest
