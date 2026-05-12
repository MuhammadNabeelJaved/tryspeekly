import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../utils/apiErrors.js'
import User from '../models/user.model.js'

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const authenticate = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.refreshToken) {
    token = req.cookies.refreshToken
  }

  if (!token) {
    throw new UnauthorizedError('Access denied. No token provided.')
  }

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_REFRESH_SECRET)
  const user = await User.findById(decoded.userId || decoded.id)

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  req.user = { userId: user._id, role: user.role }
  next()
})

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new UnauthorizedError('Access denied. Insufficient permissions.')
    }
    next()
  }
}