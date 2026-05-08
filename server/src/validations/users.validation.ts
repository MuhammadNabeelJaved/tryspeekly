// server/src/validations/users.validation.ts
import Joi from 'joi';

export const usersValidation = {
  getProfile: {
    // No validation needed - uses authenticated user
  },

  updateProfile: {
    body: Joi.object({
      name: Joi.string().min(2).max(100),
      bio: Joi.string().max(500),
      avatar: Joi.string().uri()
    }).min(1) // At least one field required
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        })
    })
  },

  getUserById: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid user ID format'
        })
    })
  },

  deleteAccount: {
    body: Joi.object({
      password: Joi.string().required()
    })
  }
};
