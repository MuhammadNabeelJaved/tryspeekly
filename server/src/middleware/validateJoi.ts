import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError';

interface ValidationSchema {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
}

export const validateJoi = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: Array<{ field: string; message: string }> = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        error.details.forEach(detail => {
          validationErrors.push({
            field: detail.path.join('.'),
            message: detail.message
          });
        });
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        error.details.forEach(detail => {
          validationErrors.push({
            field: detail.path.join('.'),
            message: detail.message
          });
        });
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        error.details.forEach(detail => {
          validationErrors.push({
            field: detail.path.join('.'),
            message: detail.message
          });
        });
      }
    }

    if (validationErrors.length > 0) {
      return next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validationErrors));
    }

    next();
  };
};
