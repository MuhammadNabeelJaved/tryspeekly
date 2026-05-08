// server/src/validations/enrollments.validation.ts
import Joi from 'joi';

export const enrollmentsValidation = {
  enroll: {
    body: Joi.object({
      courseId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid course ID format'
        })
    })
  },

  getEnrollments: {
    query: Joi.object({
      status: Joi.string().valid('active', 'cancelled', 'completed').optional()
    })
  },

  getEnrollmentById: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid enrollment ID format'
        })
    })
  },

  cancelEnrollment: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid enrollment ID format'
        })
    })
  },

  completeSession: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid enrollment ID format'
        })
    }),
    body: Joi.object({
      sessionNumber: Joi.number().min(1).required()
    })
  },

  getStudents: {
    params: Joi.object({
      courseId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid course ID format'
        })
    })
  }
};
