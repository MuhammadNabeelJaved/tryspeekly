// server/src/validations/courses.validation.ts
import Joi from 'joi';

export const coursesValidation = {
  create: {
    body: Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().min(10).required(),
      price: Joi.number().min(0).required(),
      currency: Joi.string().valid('PKR', 'USD').required(),
      type: Joi.string().valid('one-on-one', 'group').required(),
      level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
      focus: Joi.string().valid('grammar', 'speaking', 'writing', 'listening', 'reading', 'vocabulary').required(),
      totalSessions: Joi.number().min(1).required(),
      sessionDuration: Joi.number().min(30).required(),
      thumbnail: Joi.string().uri().optional()
    })
  },

  update: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object({
      title: Joi.string().min(3).max(200),
      description: Joi.string().min(10),
      price: Joi.number().min(0),
      type: Joi.string().valid('one-on-one', 'group'),
      level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      focus: Joi.string().valid('grammar', 'speaking', 'writing', 'listening', 'reading', 'vocabulary'),
      totalSessions: Joi.number().min(1),
      sessionDuration: Joi.number().min(30),
      thumbnail: Joi.string().uri()
    }).min(1)
  },

  getById: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  },

  list: {
    query: Joi.object({
      level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      type: Joi.string().valid('one-on-one', 'group'),
      focus: Joi.string().valid('grammar', 'speaking', 'writing', 'listening', 'reading', 'vocabulary'),
      minPrice: Joi.number().min(0),
      maxPrice: Joi.number().min(0),
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(20)
    })
  },

  delete: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  },

  publish: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  },

  archive: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  }
};
