import asyncHandler from '../utils/asyncHandler.js'
import User from '../models/user.model.js'


// Create a new user
export const createUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ success: false, error: { message: 'All fields are required' } })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, error: { message: 'Email already in use' } })
    }


    const user = new User({ name, email, password, phone, role })
    user.generateVerificationToken()

    await user.save()
    // TODO: send OTP to user.email via your email service

    res.status(201).json({ success: true, message: 'Registration successful. OTP sent to email.' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Verification of user email using otp
export const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: { message: 'Email and OTP are required' } })
    }

    const user = await User.findOne({ email }).select('+verificationToken +verificationExpires')
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } })
    }

    if (!user.isVerificationTokenValid(otp)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid or expired OTP' } })
    }

    user.isVerified = true
    user.clearVerificationToken()
    await user.save()

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    if (!accessToken || !refreshToken) {
      return res.status(500).json({ success: false, error: { message: 'Failed to generate tokens' } })
    }

    res.json({ success: true, message: 'Email verified successfully', accessToken, refreshToken })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Login user
export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, error: { message: 'Email and password are required' } })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } })
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, error: { message: 'Email not verified' } })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } })
    }

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    if (!accessToken || !refreshToken) {
      return res.status(500).json({ success: false, error: { message: 'Failed to generate tokens' } })
    }

    res.json({ success: true, message: 'Login successful', accessToken, refreshToken })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Logout user
export const logoutUser = asyncHandler(async (req, res) => {
  try {
    // Invalidate the refresh token (implementation depends on how you store tokens)
    // For example, you can maintain a blacklist of tokens or use a token versioning system

    res.json({ success: true, message: 'Logout successful' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Refresh access token
export const refreshToken = asyncHandler(async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ success: false, error: { message: 'Refresh token is required' } })
    }

    // Verify the refresh token and generate a new access token
    // Implementation depends on how you store and manage refresh tokens

    res.json({ success: true, message: 'Token refreshed successfully', accessToken: 'newAccessToken' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Get user profile
export const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } })
    }
    res.json(user)
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Get all users (admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const { name, phone, profileImage, bio, country, city, timezone } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } })
    }

    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone
    if (profileImage !== undefined) user.profileImage = profileImage
    if (bio !== undefined) user.bio = bio
    if (country !== undefined) user.country = country
    if (city !== undefined) user.city = city
    if (timezone !== undefined) user.timezone = timezone

    await user.save()

    res.json({ success: true, message: 'Profile updated successfully', user })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Password reset request
export const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email is required' } })
    }

    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires')
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } })
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, error: { message: 'Email not verified' } })
    }

    const otp = user.generateResetPasswordToken()
    await user.save()

    // TODO: send OTP to user.email via your email service

    res.json({ success: true, message: 'Password reset OTP sent to email' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Reset password using OTP
export const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email, OTP, new password, and confirm password are required' },
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Passwords do not match' },
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 8 characters long' },
      })
    }

    const user = await User.findOne({ email }).select('+password +resetPasswordToken +resetPasswordExpires')
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } })
    }

    if (!user.isResetPasswordTokenValid(otp)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired OTP' },
      })
    }

    const isSamePassword = await user.comparePassword(newPassword)
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'New password must be different from the current password' },
      })
    }

    user.password = newPassword
    user.clearResetPasswordToken()
    await user.save()

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// Delete user (admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } })
    }

    user.isDeleted = true
    await user.save()

    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

