import mongoose from 'mongoose'

const { Schema, model } = mongoose

const salaryPaymentSchema = new Schema(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryPackage',
      required: [true, 'Package ID is required'],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
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
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'pending',
    },
    paidDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    paymentMethod: {
      type: String,
      trim: true,
      maxlength: [100, 'Payment method cannot exceed 100 characters'],
    },
  },
  { timestamps: true, versionKey: false }
)

salaryPaymentSchema.index({ package: 1 })
salaryPaymentSchema.index({ teacher: 1 })
salaryPaymentSchema.index({ createdAt: -1 })

const SalaryPayment =
  mongoose.models.SalaryPayment || model('SalaryPayment', salaryPaymentSchema)

export default SalaryPayment
