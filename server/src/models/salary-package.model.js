import mongoose from 'mongoose'

const { Schema, model } = mongoose

const salaryPackageSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
      unique: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: ['monthly', 'weekly', 'per_course', 'hourly', 'custom'],
      required: [true, 'Salary type is required'],
    },
    customType: {
      type: String,
      trim: true,
      maxlength: [100, 'Custom type cannot exceed 100 characters'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true, versionKey: false }
)

salaryPackageSchema.index({ teacher: 1 })

const SalaryPackage =
  mongoose.models.SalaryPackage || model('SalaryPackage', salaryPackageSchema)

export default SalaryPackage
