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
        values: ['student', 'instructor', 'admin'],
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.post('save', function (error, doc, next) {
  if (error.code === 11000) {
    next(new Error('Email already exists'))
  } else {
    next(error)
  }
})

// Generate JWT access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  })
}

// Generate JWT refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })
}

// Generate 6 digit OTP
userSchema.methods.generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

userSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: false })
  next()
})

const User = mongoose.models.User || model('User', userSchema)

export default User