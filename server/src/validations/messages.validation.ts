// server/src/validations/messages.validation.ts
import Joi from 'joi';

export const messagesValidation = {
  sendMessage: {
    body: Joi.object({
      receiverId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid receiver ID format'
        }),
      content: Joi.string().min(1).max(2000).required()
        .messages({
          'string.min': 'Message content cannot be empty',
          'string.max': 'Message content cannot exceed 2000 characters'
        })
    })
  },

  getConversations: {
    // No params needed - returns all user's conversations
  },

  getConversation: {
    params: Joi.object({
      userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid user ID format'
        })
    })
  },

  markAsRead: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid message ID format'
        })
    })
  },

  deleteMessage: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid message ID format'
        })
    })
  }
};
