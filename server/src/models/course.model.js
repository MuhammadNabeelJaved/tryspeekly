import mongoose from 'mongoose'

const { Schema, model } = mongoose

const recurringScheduleSchema = new Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    time: { type: String, required: true },
  },
  { _id: false }
)

const materialSchema = new Schema(
  {
    title: { type: String, required: [true, 'Material title is required'], trim: true },
    link: { type: String, required: [true, 'Material link is required'], trim: true },
    sharedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

const syllabusTopicSchema = new Schema(
  {
    week: { type: Number, required: [true, 'Week number is required'], min: [1, 'Week must be at least 1'] },
    title: { type: String, required: [true, 'Topic title is required'], trim: true },
    description: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: false }
)

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    currency: { type: String, enum: ['PKR', 'USD'], default: 'PKR' },
    type: {
      type: String,
      required: [true, 'Course type is required'],
      enum: ['group', 'one-to-one', 'hybrid'],
    },
    level: {
      type: String,
      required: [true, 'Course level is required'],
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    focus: {
      type: String,
      required: [true, 'Course focus is required'],
      enum: ['speaking', 'grammar', 'ielts', 'business', 'general'],
    },
    thumbnail: { type: String, trim: true },
    videoPreview: { type: String, trim: true },
    totalSessions: {
      type: Number,
      required: [true, 'Total sessions is required'],
      min: [1, 'Must have at least 1 session'],
    },
    sessionDuration: {
      type: Number,
      required: [true, 'Session duration is required'],
      min: [15, 'Session must be at least 15 minutes'],
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected', 'archived'],
      default: 'draft',
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    maxStudents: { type: Number, min: [1, 'Max students must be at least 1'] },
    recurringSchedule: [recurringScheduleSchema],
    meetLink: { type: String, trim: true },
    materials: [materialSchema],
    syllabus: [syllabusTopicSchema],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
)

courseSchema.pre(/^find/, function () {
  this.where({ isDeleted: false })
})

const Course = mongoose.models.Course || model('Course', courseSchema)

export default Course
