// server/src/validations/auth.validation.ts
import Joi from 'joi';

export const authValidation = {
  register: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        }),
      role: Joi.string().valid('student', 'teacher').default('student')
    })
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  },

  refresh: {
    body: Joi.object({
      refreshToken: Joi.string().required()
    })
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required()
    })
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
    })
  }
};
