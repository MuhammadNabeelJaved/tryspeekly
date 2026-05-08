// server/src/validations/payments.validation.ts
import Joi from 'joi';

export const paymentsValidation = {
  createPayment: {
    body: Joi.object({
      courseId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid course ID format'
        }),
      amount: Joi.number().min(0).required(),
      currency: Joi.string().valid('PKR', 'USD').required(),
      paymentMethod: Joi.string()
        .valid('jazzcash', 'easypaisa', 'nayapay', 'sadapay', 'zindigi', 'bank_local', 'bank_international')
        .required()
    })
  },

  verifyPayment: {
    body: Joi.object({
      paymentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid payment ID format'
        }),
      transactionId: Joi.string().required(),
      screenshotUrl: Joi.string().uri().required()
    })
  },

  getPayments: {
    query: Joi.object({
      status: Joi.string().valid('pending', 'approved', 'rejected').optional()
    })
  },

  getPaymentById: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid payment ID format'
        })
    })
  },

  requestRefund: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid payment ID format'
        })
    }),
    body: Joi.object({
      reason: Joi.string().min(10).max(500).required()
    })
  },

  getEarnings: {
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional()
    })
  }
};
