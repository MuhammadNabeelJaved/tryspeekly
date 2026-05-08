import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  enrolledAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  progress: {
    sessionsAttended: number;
    totalSessions: number;
    lastAttendedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payment: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  enrolledAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  progress: {
    sessionsAttended: { type: Number, default: 0 },
    totalSessions: { type: Number, required: true },
    lastAttendedAt: { type: Date },
  },
}, { timestamps: true });

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1, isActive: 1 });

export default mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
