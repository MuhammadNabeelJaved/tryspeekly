import mongoose from 'mongoose'

const { Schema, model } = mongoose

const attendanceSchema = new Schema(
  {
    sessionNumber: { type: Number, required: true },
    attendedAt: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
  },
  { timestamps: false }
)

const enrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    financialAid: { type: Schema.Types.ObjectId, ref: 'FinancialAid' },
    enrolledAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: false },
    progress: {
      sessionsAttended: { type: Number, default: 0 },
      totalSessions: { type: Number, required: true },
      lastAttendedAt: { type: Date },
    },
    attendance: [attendanceSchema],
  },
  { timestamps: true, versionKey: false }
)

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true })

const Enrollment = mongoose.models.Enrollment || model('Enrollment', enrollmentSchema)

export default Enrollment
