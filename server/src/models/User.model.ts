import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../config/constants';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  role: typeof USER_ROLES[keyof typeof USER_ROLES];
  bio?: string;
  photo?: string;
  specializations?: string[];
  isActive: boolean;
  refreshToken?: string;
  passwordResetOtp?: string;
  passwordResetExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone: { type: String },
  country: { type: String },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.STUDENT
  },
  bio: { type: String },
  photo: { type: String },
  specializations: [{ type: String }],
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  passwordResetOtp: { type: String, select: false },
  passwordResetExpiry: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
