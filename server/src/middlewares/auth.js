import jwt from 'jsonwebtoken'
import asyncHandler from '../utils/asyncHandler.js'
import { UnauthorizedError, ForbiddenError } from '../utils/apiErrors.js'
import User from '../models/user.model.js'

const extractToken = (req) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1]
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken
  }
  return null
}

// ─── authenticate ──────────────────────────────────────────────────────────────
// Verifies the JWT access token and attaches req.user = { id, role }
// Use on all protected routes.

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)

  if (!token) {
    throw new UnauthorizedError('Access denied. No token provided.')
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token expired. Please refresh your token.')
    }
    throw new UnauthorizedError('Invalid token.')
  }

  const user = await User.findById(decoded.id)

  if (!user) {
    throw new UnauthorizedError('User belonging to this token no longer exists.')
  }

  if (!user.isVerified) {
    throw new UnauthorizedError('Email not verified. Please verify your email to continue.')
  }

  if (user.isDeleted) {
    throw new UnauthorizedError('This account has been deactivated.')
  }

  req.user = { id: user._id, role: user.role }
  next()
})

// ─── optionalAuthenticate ──────────────────────────────────────────────────────
// Same as authenticate but does NOT throw if no token is present.
// Use on public routes that behave differently for logged-in users.

export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)

  if (!token) {
    req.user = null
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user = await User.findById(decoded.id)

    req.user = user && user.isVerified && !user.isDeleted
      ? { id: user._id, role: user.role }
      : null
  } catch {
    req.user = null
  }

  next()
})

// ─── authorize ─────────────────────────────────────────────────────────────────
// Role-based access control. Always use AFTER authenticate.
// Usage: router.delete('/:id', authenticate, authorize('admin'), handler)

export const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Access denied. Not authenticated.')
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`
      )
    }

    next()
  }
