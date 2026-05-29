import mongoose from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const { Schema, model } = mongoose

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: 'Please provide a valid email address',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'teacher', 'admin', 'team_member'],
        message: 'Invalid user role',
      },
      default: 'student',
    },
    profileImage: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    permissions: {
      type: [
        {
          type: String,
          enum: [
            'overview', 'students', 'courses', 'instructors',
            'payments', 'financial-aid', 'salaries', 'certificates', 'referrals',
            'messages', 'support', 'contacts', 'email', 'reviews', 'notifications',
            'blog', 'seo', 'cms', 'geo-access',
          ],
        },
      ],
      default: [],
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters'],
    },
    timezone: {
      type: String,
      trim: true,
    },
    isOnboardingDone: {
      type: Boolean,
      default: true,
    },
    twoStepEnabled: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    notifications: [
      {
        type: {
          type: String,
          required: [true, 'Notification type is required'],
          trim: true,
          maxlength: [50, 'Notification type cannot exceed 50 characters'],
        },
        message: {
          type: String,
          required: [true, 'Notification message is required'],
          trim: true,
          maxlength: [500, 'Notification message cannot exceed 500 characters'],
        },
        read: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  delete user.verificationToken
  delete user.resetPasswordToken
  return user
}

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Generate JWT access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  })
}

// Generate JWT refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })
}

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

// Verification token methods
userSchema.methods.generateVerificationToken = function () {
  const otp = generateOTP()
  this.verificationToken = otp
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  return otp
}

userSchema.methods.isVerificationTokenValid = function (token) {
  return this.verificationToken === token && this.verificationExpires > new Date()
}

userSchema.methods.clearVerificationToken = function () {
  this.verificationToken = undefined
  this.verificationExpires = undefined
}

// Reset password token methods
userSchema.methods.generateResetPasswordToken = function () {
  const otp = generateOTP()
  this.resetPasswordToken = otp
  this.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  return otp
}

userSchema.methods.isResetPasswordTokenValid = function (token) {
  return this.resetPasswordToken === token && this.resetPasswordExpires > new Date()
}

userSchema.methods.clearResetPasswordToken = function () {
  this.resetPasswordToken = undefined
  this.resetPasswordExpires = undefined
}

userSchema.pre(/^find/, function () {
  this.where({ isDeleted: false })
})

const User = mongoose.models.User || model('User', userSchema)

export default User