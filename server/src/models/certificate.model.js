import mongoose from 'mongoose'

const { Schema, model } = mongoose

const certificateSchema = new Schema(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    certificateId: { type: String, unique: true, trim: true },
    issueDate: { type: Date, default: Date.now },
    credentialUrl: { type: String, trim: true },
    status: { type: String, enum: ['issued', 'revoked'], default: 'issued' },
    revokedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
)

certificateSchema.pre('save', function () {
  if (!this.certificateId) {
    const year = new Date().getFullYear()
    const random = Math.random().toString(36).substring(2, 9).toUpperCase()
    this.certificateId = `EP-${year}-${random}`
  }
})

const Certificate = mongoose.models.Certificate || model('Certificate', certificateSchema)

export default Certificate
