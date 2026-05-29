import asyncHandler from '../utils/asyncHandler.js'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import { uploadUserAvatar, deleteFile, extractPublicId } from '../utils/cloudinary.js'
import { sendForgotPasswordOtp, sendVerificationOtp, sendEmail } from '../utils/email.js'

// ─── Cookie helpers ────────────────────────────────────────────────────────────
const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...COOKIE_BASE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // mirrors JWT_ACCESS_EXPIRES_IN
  })
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_BASE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // mirrors JWT_REFRESH_EXPIRES_IN
  })
}

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken', COOKIE_BASE)
  res.clearCookie('refreshToken', COOKIE_BASE)
}

const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  profileImage: user.profileImage,
  bio: user.bio,
  country: user.country,
  city: user.city,
  timezone: user.timezone,
  isVerified: user.isVerified,
  isOnboardingDone: user.isOnboardingDone,
  permissions: user.permissions,
  jobTitle: user.jobTitle,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

// POST /api/v1/users/register
export const createUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ success: false, error: { message: 'All fields are required' } })
    }

    // Bypass the pre-find middleware (which filters isDeleted:false) to catch soft-deleted accounts too
    const existingUser = await User.collection.findOne({ email })
    if (existingUser) {
      if (existingUser.isDeleted) {
        await User.collection.deleteOne({ _id: existingUser._id })
      } else {
        return res.status(409).json({ success: false, error: { message: 'Email already in use' } })
      }
    }

    const user = new User({ name, email, password, phone, role, isOnboardingDone: false })
    const otp = user.generateVerificationToken()

    await user.save()

    await sendVerificationOtp({ to: email, otp, name })

    res.status(201).json({ success: true, message: 'Registration successful. Check your email for the OTP.' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/users/resend-verification
export const resendVerification = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ success: false, error: { message: 'Email is required' } })

    const user = await User.findOne({ email }).select('+verificationToken +verificationExpires')
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    if (user.isVerified) return res.status(400).json({ success: false, error: { message: 'Email is already verified' } })

    const otp = user.generateVerificationToken()
    await user.save()

    await sendVerificationOtp({ to: user.email, otp, name: user.name })
    res.json({ success: true, message: 'Verification code resent to your email' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/users/verify-email
export const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: { message: 'Email and OTP are required' } })
    }

    const user = await User.findOne({ email }).select('+verificationToken +verificationExpires')
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })

    if (!user.isVerificationTokenValid(otp)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid or expired OTP' } })
    }

    user.isVerified = true
    user.clearVerificationToken()
    await user.save()

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    setTokenCookies(res, accessToken, refreshToken)

    // Welcome email after verification
    sendEmail({
      type: 'account_verified_welcome',
      to: user.email,
      toName: user.name,
      variables: {
        name: user.name,
        role: user.role,
        dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/${user.role === 'admin' ? 'admin' : user.role === 'teacher' ? 'instructor' : 'dashboard'}`,
      },
      metadata: { userId: user._id },
    }).catch(() => {})

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: { user: safeUser(user), accessToken, refreshToken },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/users/login
export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Email and password are required' } })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })

    if (user.isDeleted) {
      return res.status(403).json({ success: false, error: { message: 'Account has been deactivated.' } })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } })
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    setTokenCookies(res, accessToken, refreshToken)

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: safeUser(user), accessToken, refreshToken },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/users/logout
export const logoutUser = asyncHandler(async (req, res) => {
  try {
    clearTokenCookies(res)
    res.json({ success: true, message: 'Logout successful' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/users/refresh-token
export const refreshToken = asyncHandler(async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken
    if (!token) {
      return res.status(400).json({ success: false, error: { message: 'Refresh token is required' } })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    } catch {
      return res.status(401).json({ success: false, error: { message: 'Invalid or expired refresh token' } })
    }

    const user = await User.findById(decoded.id)
    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, error: { message: 'User not found' } })
    }

    const accessToken = user.generateAccessToken()

    res.cookie('accessToken', accessToken, {
      ...COOKIE_BASE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ success: true, data: { accessToken } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/users/profile
export const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    res.json({ success: true, data: safeUser(user) })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/users — admin
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query
    const filter = {}

    // Non-admins can only see students and teachers
    if (req.user.role !== 'admin') {
      filter.role = { $in: ['student', 'teacher'] }
    }

    if (req.user.role === 'admin' && role) {
      filter.role = role
    }
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
    const skip = (Number(page) - 1) * Number(limit)

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: users.map(safeUser),
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/users/:id — admin
export const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    res.json({ success: true, data: safeUser(user) })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/users/profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const { name, phone, bio, country, city, timezone } = req.body

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })

    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone
    if (bio !== undefined) user.bio = bio
    if (country !== undefined) user.country = country
    if (city !== undefined) user.city = city
    if (timezone !== undefined) user.timezone = timezone

    await user.save()
    res.json({ success: true, message: 'Profile updated successfully', data: safeUser(user) })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: { message: 'Current and new password are required' } })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: { message: 'New password must be at least 8 characters' } })
    }

    const user = await User.findById(req.user.id).select('+password')
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) return res.status(401).json({ success: false, error: { message: 'Current password is incorrect' } })

    const isSame = await user.comparePassword(newPassword)
    if (isSame) return res.status(400).json({ success: false, error: { message: 'New password must differ from current password' } })

    user.password = newPassword
    await user.save()

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/users/forgot-password
export const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ success: false, error: { message: 'Email is required' } })

    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires')
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    if (!user.isVerified) return res.status(403).json({ success: false, error: { message: 'Email not verified' } })

    const otp = user.generateResetPasswordToken()
    await user.save()

    await sendForgotPasswordOtp({ to: email, otp, name: user.name })
    res.json({ success: true, message: 'Password reset OTP sent to your email' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/users/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, error: { message: 'All fields are required' } })
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: { message: 'Passwords do not match' } })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: { message: 'Password must be at least 8 characters' } })
    }

    const user = await User.findOne({ email }).select('+password +resetPasswordToken +resetPasswordExpires')
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    if (!user.isResetPasswordTokenValid(otp)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid or expired OTP' } })
    }

    const isSame = await user.comparePassword(newPassword)
    if (isSame) return res.status(400).json({ success: false, error: { message: 'New password must differ from current password' } })

    user.password = newPassword
    user.clearResetPasswordToken()
    await user.save()

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/users/profile/image
export const updateProfileImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No image file provided' } })

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })

    if (user.profileImage) {
      const publicId = extractPublicId(user.profileImage)
      if (publicId) await deleteFile(publicId, 'image')
    }

    const result = await uploadUserAvatar(req.file.buffer, user._id.toString())
    user.profileImage = result.secure_url
    await user.save()

    res.json({ success: true, message: 'Profile image updated successfully', data: { profileImage: user.profileImage } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/users/:id — admin (soft delete)
// PATCH /api/v1/users/onboarding-done
export const markOnboardingDone = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isOnboardingDone: true },
      { new: true }
    )
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    res.json({ success: true, message: 'Onboarding marked as done', data: { user: safeUser(user) } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })

    if (user.profileImage) {
      const publicId = extractPublicId(user.profileImage)
      if (publicId) await deleteFile(publicId, 'image')
    }

    user.isDeleted = true
    user.profileImage = undefined
    await user.save()

    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
