import { Router } from 'express';
import { messagesController } from '../controllers/messages.controller';
import { validateJoi } from '../middleware/validateJoi';
import { messagesValidation } from '../validations/messages.validation';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send a message
router.post(
  '/',
  validateJoi(messagesValidation.sendMessage),
  messagesController.sendMessage
);

// Get all conversations
router.get(
  '/conversations',
  messagesController.getConversations
);

// Get conversation with a specific user
router.get(
  '/conversation/:userId',
  validateJoi(messagesValidation.getConversation),
  messagesController.getConversation
);

// Mark message as read
router.patch(
  '/:id/read',
  validateJoi(messagesValidation.markAsRead),
  messagesController.markAsRead
);

// Delete message
router.delete(
  '/:id',
  validateJoi(messagesValidation.deleteMessage),
  messagesController.deleteMessage
);

export default router;
