const { asyncHandler } = require('../utils/asyncHandler')
const { UnauthorizedError } = require('../utils/apiErrors')
const User = require('../models/user.model')
const bcrypt = require('bcryptjs')

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?.userId).select('-password')
  if (!user) {
    throw new UnauthorizedError('User not found')
  }
  res.json({ success: true, data: { user } })
})

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, bio, country, city, timezone } = req.body
  const user = await User.findByIdAndUpdate(
    req.user?.userId,
    { name, phone, bio, country, city, timezone },
    { new: true, runValidators: true }
  ).select('-password')

  res.json({ success: true, data: { user } })
})

exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      error: { message: 'Current and new password are required' } 
    })
  }

  const user = await User.findById(req.user?.userId)
  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) {
    return res.status(400).json({ 
      success: false, 
      error: { message: 'Current password is incorrect' } 
    })
  }

  user.password = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10)
  await user.save()

  res.json({ success: true, message: 'Password updated successfully' })
})

exports.deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user?.userId)
  res.clearCookie('refreshToken').json({ 
    success: true, 
    message: 'Account deleted successfully' 
  })
})