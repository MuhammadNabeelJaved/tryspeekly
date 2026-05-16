import mongoose from 'mongoose'

const { Schema, model } = mongoose

const liveClassSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    meetingLink: {
      type: String,
      required: [true, 'Meeting link is required'],
      trim: true,
    },
    classNumber: {
      type: Number,
      required: [true, 'Class number is required'],
      min: [1, 'Class number must be at least 1'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
)

liveClassSchema.pre(/^find/, function () {
  this.where({ isDeleted: false })
})

const LiveClass = mongoose.models.LiveClass || model('LiveClass', liveClassSchema)

export default LiveClass