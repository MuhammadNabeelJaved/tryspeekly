import asyncHandler from '../utils/asyncHandler.js'
import crypto from 'crypto'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import Course from '../models/course.model.js'
import Enrollment from '../models/enrollment.model.js'
import { uploadUserAvatar, deleteFile, extractPublicId } from '../utils/cloudinary.js'
import { hardDeleteUserAndRelatedData } from '../utils/dataCleanup.js'
import { sendForgotPasswordOtp, sendVerificationOtp, sendEmail } from '../utils/email.js'
import { emitToUser } from '../utils/socket.js'

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
  adminNotes: user.adminNotes,
  timezone: user.timezone,
  isVerified: user.isVerified,
  isOnboardingDone: user.isOnboardingDone,
  isBlocked: user.isBlocked,
  showOnHome: user.showOnHome,
  showOnCoursesPage: user.showOnCoursesPage,
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

// POST /api/v1/users  (admin only — manually create a student/user)
// Only name & email are required; everything else is optional. A random
// password is generated and the account is marked verified, so the person can
// sign in later via "forgot password" to set their own password.
export const adminCreateUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, country, city, role, adminNotes } = req.body

    if (!name || !email) {
      return res.status(400).json({ success: false, error: { message: 'Name and email are required' } })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Bypass the pre-find middleware to catch soft-deleted accounts too
    const existingUser = await User.collection.findOne({ email: normalizedEmail })
    if (existingUser) {
      if (existingUser.isDeleted) {
        await User.collection.deleteOne({ _id: existingUser._id })
      } else {
        return res.status(409).json({ success: false, error: { message: 'Email already in use' } })
      }
    }

    const user = new User({
      name,
      email: normalizedEmail,
      password: crypto.randomBytes(24).toString('hex'), // random; user resets to set their own
      phone: phone || undefined,
      country: country || undefined,
      city: city || undefined,
      adminNotes: adminNotes || undefined,
      role: role === 'teacher' || role === 'admin' || role === 'team_member' ? role : 'student',
      isVerified: true,
      isOnboardingDone: true,
    })

    await user.save()

    res.status(201).json({ success: true, message: 'User created', data: safeUser(user) })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/users/:id/set-password  (admin only — set a user's password)
export const adminSetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body
  if (!password || password.length < 8)
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })

  const user = await User.findById(req.params.id).select('+password')
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })

  user.password = password
  await user.save()
  res.json({ success: true, message: 'Password updated successfully' })
})

// PATCH /api/v1/users/:id  (admin only — update a user's profile details)
export const adminUpdateUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, country, city, adminNotes } = req.body

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase()
      if (normalizedEmail !== user.email) {
        const existing = await User.collection.findOne({ email: normalizedEmail, _id: { $ne: user._id } })
        if (existing) {
          return res.status(409).json({ success: false, error: { message: 'Email already in use' } })
        }
        user.email = normalizedEmail
      }
    }

    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone
    if (country !== undefined) user.country = country
    if (city !== undefined) user.city = city
    if (adminNotes !== undefined) user.adminNotes = adminNotes

    await user.save()
    res.json({ success: true, message: 'User updated successfully', data: safeUser(user) })
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

    if (user.isBlocked) {
      return res.status(403).json({ success: false, error: { message: 'Your account has been blocked. Please contact support.' } })
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
    const { page = 1, limit = 20, role, search, blocked } = req.query
    const filter = {}

    // Non-admins can only see students and teachers — but still honor a specific
    // role filter (e.g. the Instructors page requesting ?role=teacher) as long as
    // it stays within the allowed set.
    if (req.user.role !== 'admin') {
      const allowed = ['student', 'teacher']
      filter.role = role && allowed.includes(role) ? role : { $in: allowed }
    } else if (role) {
      filter.role = role
    }
    if (req.user.role === 'admin' && blocked === 'true') {
      filter.isBlocked = true
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

// PATCH /api/v1/users/:id/block — admin only
export const blockUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({ success: false, error: { message: 'You cannot block your own account' } })
    }

    user.isBlocked = !user.isBlocked
    user.blockedAt = user.isBlocked ? new Date() : undefined
    await user.save()

    // If blocking, kick the user out immediately if they are online
    if (user.isBlocked) {
      emitToUser(user._id, 'user:blocked', { message: 'Your account has been blocked by an administrator.' })
    }

    res.json({
      success: true,
      message: user.isBlocked ? 'User blocked.' : 'User unblocked.',
      data: safeUser(user),
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/users/:id/role — admin only
export const changeUserRole = asyncHandler(async (req, res) => {
  try {
    const { role } = req.body
    const VALID_ROLES = ['student', 'teacher', 'admin', 'team_member']
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: { message: 'Valid role is required' } })
    }

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({ success: false, error: { message: 'You cannot change your own role' } })
    }

    const oldRole = user.role
    user.role = role
    // Clear team_member permissions when moving away from that role
    if (oldRole === 'team_member' && role !== 'team_member') {
      user.permissions = []
    }
    await user.save()

    // Notify the user in real time if they are logged in
    emitToUser(user._id, 'user:role:changed', { role, oldRole })

    res.json({ success: true, message: `Role changed to ${role}`, data: safeUser(user) })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(403).json({ success: false, error: { message: 'You cannot delete your own account from admin.' } })
    }

    if (user.profileImage) {
      const publicId = extractPublicId(user.profileImage)
      if (publicId) await deleteFile(publicId, 'image')
    }

    const userId = user._id
    const counts = await hardDeleteUserAndRelatedData(userId)

    // Kick the user out immediately if they are online
    emitToUser(userId, 'user:deleted', { message: 'Your account has been deleted.' })

    res.json({ success: true, message: 'User permanently deleted successfully', data: { deleted: counts } })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/users/public-teachers — public: all active teachers for InstructorsPage
export const getPublicTeachers = asyncHandler(async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isBlocked: false, isDeleted: false })
      .select('name bio jobTitle profileImage country city showOnHome createdAt')
      .sort({ createdAt: -1 })
      .lean()

    if (teachers.length === 0) return res.json({ success: true, data: [] })

    const teacherIds = teachers.map(t => t._id)

    const [courseStats, studentStats, reviewStats] = await Promise.all([
      Course.aggregate([
        { $match: { teacher: { $in: teacherIds }, status: 'published' } },
        { $group: { _id: '$teacher', courseCount: { $sum: 1 } } },
      ]),
      Enrollment.aggregate([
        { $match: { teacher: { $in: teacherIds }, isActive: true } },
        { $group: { _id: '$teacher', students: { $addToSet: '$student' } } },
        { $project: { studentCount: { $size: '$students' } } },
      ]),
      Course.aggregate([
        { $match: { teacher: { $in: teacherIds }, status: 'published' } },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'course',
            pipeline: [{ $match: { type: 'course', status: 'approved' } }],
            as: 'reviews',
          },
        },
        { $group: { _id: '$teacher', reviewCount: { $sum: { $size: '$reviews' } } } },
      ]),
    ])

    const courseMap = Object.fromEntries(courseStats.map(c => [c._id.toString(), c.courseCount]))
    const studentMap = Object.fromEntries(studentStats.map(s => [s._id.toString(), s.studentCount]))
    const reviewMap = Object.fromEntries(reviewStats.map(r => [r._id.toString(), r.reviewCount]))

    const enriched = teachers.map(t => ({
      ...t,
      courseCount: courseMap[t._id.toString()] ?? 0,
      studentCount: studentMap[t._id.toString()] ?? 0,
      reviewCount: reviewMap[t._id.toString()] ?? 0,
    }))

    res.json({ success: true, data: enriched })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/users/home-instructors — public: teachers marked showOnHome=true
export const getHomeInstructors = asyncHandler(async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', showOnHome: true, isBlocked: false, isDeleted: false })
      .select('name bio profileImage photo country city createdAt')
      .sort({ createdAt: -1 })
    res.json({ success: true, data: teachers })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/users/:id/show-on-home — admin: toggle showOnHome for a teacher
export const toggleShowOnHome = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    if (user.role !== 'teacher') return res.status(400).json({ success: false, error: { message: 'Only teachers can be featured on home page' } })
    user.showOnHome = !user.showOnHome
    await user.save()
    res.json({ success: true, message: user.showOnHome ? 'Teacher will now appear on home page' : 'Teacher removed from home page', data: safeUser(user) })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/users/courses-instructors — public: teachers marked showOnCoursesPage=true
export const getCoursesPageInstructors = asyncHandler(async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', showOnCoursesPage: true, isBlocked: false, isDeleted: false })
      .select('name bio jobTitle profileImage country city createdAt')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, data: teachers })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/users/:id/show-on-courses — admin: toggle showOnCoursesPage for a teacher
export const toggleShowOnCoursesPage = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } })
    if (user.role !== 'teacher') return res.status(400).json({ success: false, error: { message: 'Only teachers can be featured on the courses page' } })
    user.showOnCoursesPage = !user.showOnCoursesPage
    await user.save()
    res.json({
      success: true,
      message: user.showOnCoursesPage ? 'Teacher will now appear on courses page' : 'Teacher removed from courses page',
      data: safeUser(user),
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/users/bulk — admin: soft-delete multiple users
export const bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: { message: 'ids must be a non-empty array' } })
  }
  if (ids.length > 100) {
    return res.status(400).json({ success: false, error: { message: 'Cannot delete more than 100 users at once' } })
  }

  const adminId = req.user.id.toString()
  const filteredIds = ids.filter(id => id !== adminId)
  const skipped = ids.length - filteredIds.length

  const aggregateCounts = {}
  const results = await Promise.allSettled(filteredIds.map(async (id) => {
    if (!mongoose.isValidObjectId(id)) return false
    const user = await User.findById(id)
    if (!user) return false
    if (user.profileImage) {
      const publicId = extractPublicId(user.profileImage)
      if (publicId) await deleteFile(publicId, 'image')
    }
    const counts = await hardDeleteUserAndRelatedData(user._id)
    for (const [key, value] of Object.entries(counts)) {
      aggregateCounts[key] = (aggregateCounts[key] ?? 0) + value
    }
    emitToUser(user._id, 'user:deleted', { message: 'Your account has been deleted.' })
    return counts.users > 0
  }))

  const deleted = results.filter(r => r.status === 'fulfilled' && r.value === true).length

  res.json({
    success: true,
    message: `${deleted} user${deleted !== 1 ? 's' : ''} permanently deleted`,
    data: { deleted, skipped, deletedRecords: aggregateCounts },
  })
})

