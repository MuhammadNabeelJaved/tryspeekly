import mongoose, { Schema, Document } from 'mongoose';
import { COURSE_TYPES, COURSE_LEVELS, COURSE_FOCUS, CURRENCIES } from '../config/constants';

interface IAvailableSlot {
  date: Date;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedBy?: mongoose.Types.ObjectId;
}

interface IRecurringSchedule {
  day: string;
  time: string;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  price: number;
  currency: typeof CURRENCIES[keyof typeof CURRENCIES];
  type: typeof COURSE_TYPES[keyof typeof COURSE_TYPES];
  level: typeof COURSE_LEVELS[keyof typeof COURSE_LEVELS];
  focus: typeof COURSE_FOCUS[keyof typeof COURSE_FOCUS];
  thumbnail?: string;
  totalSessions: number;
  sessionDuration: number;
  status: 'draft' | 'published' | 'archived';
  teacher: mongoose.Types.ObjectId;
  enrolledStudents: mongoose.Types.ObjectId[];
  recurringSchedule?: IRecurringSchedule[];
  availableSlots?: IAvailableSlot[];
  meetLink?: string;
  maxStudents?: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  currency: {
    type: String,
    enum: Object.values(CURRENCIES),
    default: CURRENCIES.PKR
  },
  type: {
    type: String,
    enum: Object.values(COURSE_TYPES),
    required: true
  },
  level: {
    type: String,
    enum: Object.values(COURSE_LEVELS),
    required: true
  },
  focus: {
    type: String,
    enum: Object.values(COURSE_FOCUS),
    required: true
  },
  thumbnail: { type: String },
  totalSessions: { type: Number, required: true, min: 1 },
  sessionDuration: { type: Number, required: true, min: 30 },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledStudents: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  recurringSchedule: [{
    day: { type: String },
    time: { type: String },
  }],
  availableSlots: [{
    date: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  }],
  meetLink: { type: String },
  maxStudents: { type: Number },
}, { timestamps: true });

courseSchema.index({ status: 1, type: 1, level: 1, focus: 1 });
courseSchema.index({ teacher: 1 });

export default mongoose.model<ICourse>('Course', courseSchema);
