import mongoose from 'mongoose'

const { Schema, model } = mongoose

const submissionSchema = new Schema(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
    fileUrl: { type: String, required: [true, 'Submission file is required'], trim: true },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    grade: { type: Number, min: 0, max: 100 },
    feedback: { type: String, trim: true },
    gradedAt: { type: Date },
  },
  { timestamps: true }
)

const assignmentSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    submissions: [submissionSchema],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
)

assignmentSchema.pre(/^find/, function () {
  this.where({ isDeleted: false })
})

const Assignment = mongoose.models.Assignment || model('Assignment', assignmentSchema)

export default Assignment
