const { asyncHandler } = require('../utils/asyncHandler')
const { BadRequestError, UnauthorizedError } = require('../utils/apiErrors')
const User = require('../models/user.model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
  })
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  })
  return { accessToken, refreshToken }
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body

  if (!name || !email || !phone || !password) {
    throw new BadRequestError('All fields are required')
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new BadRequestError('User already exists with this email')
  }

  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10)

  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: role || 'student'
  })

  const { accessToken, refreshToken } = generateTokens(user._id)

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }

  res
    .cookie('refreshToken', refreshToken, options)
    .status(201)
    .json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken
      }
    })
})

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new BadRequestError('Email and password are required')
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw new UnauthorizedError('Invalid credentials')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials')
  }

  const { accessToken, refreshToken } = generateTokens(user._id)

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }

  res
    .cookie('refreshToken', refreshToken, options)
    .json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken
      }
    })
})

exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken').json({
    success: true,
    message: 'Logged out successfully'
  })
})

exports.refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required')
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
  const user = await User.findById(decoded.userId)

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id)

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }

  res
    .cookie('refreshToken', newRefreshToken, options)
    .json({ success: true, data: { accessToken } })
})

exports.forgotPassword = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Password reset link sent to email' })
})

exports.resetPassword = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Password reset successfully' })
})

exports.verifyEmail = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Email verified successfully' })
})

exports.resendVerification = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Verification email sent' })
})