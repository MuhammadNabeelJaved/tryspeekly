import mongoose from 'mongoose'
const { Schema, model } = mongoose

const monthlyFeeSchema = new Schema(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: [true, 'Enrollment is required'] },
    student:    { type: Schema.Types.ObjectId, ref: 'User',       required: [true, 'Student is required']    },
    course:     { type: Schema.Types.ObjectId, ref: 'Course',     required: [true, 'Course is required']     },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be 1–12'],
      max: [12, 'Month must be 1–12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2020, 'Year must be 2020 or later'],
    },
    amount:   { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount cannot be negative'] },
    currency: { type: String, enum: ['PKR', 'USD'], default: 'PKR' },
    method: {
      type: String,
      enum: ['jazzcash', 'easypaisa', 'nayapay', 'sadapay', 'zindigi', 'bank_local', 'bank_international'],
    },
    status:    { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
    dueDate:   { type: Date },
    paidDate:  { type: Date },
    adminNote: { type: String, trim: true, maxlength: [500, 'Note cannot exceed 500 characters'] },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false }
)

// One record per enrollment per month+year
monthlyFeeSchema.index({ enrollment: 1, month: 1, year: 1 }, { unique: true })
monthlyFeeSchema.index({ student: 1, year: -1, month: -1 })
monthlyFeeSchema.index({ status: 1 })

const MonthlyFee = mongoose.models.MonthlyFee || model('MonthlyFee', monthlyFeeSchema)
export default MonthlyFee
