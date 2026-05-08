import { Request, Response } from 'express';
import { messagesService } from '../services/messages.service';
import { asyncHandler } from '../utils/asyncHandler';

export const messagesController = {
  /**
   * POST /api/messages
   * Send a message to another user
   */
  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const senderId = req.user!.userId;
    const { receiverId, content } = req.body;
    const message = await messagesService.sendMessage(senderId, receiverId, content);

    res.status(201).json({
      success: true,
      data: message,
    });
  }),

  /**
   * GET /api/messages/conversations
   * Get all conversations for authenticated user
   */
  getConversations: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const conversations = await messagesService.getConversations(userId);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  }),

  /**
   * GET /api/messages/conversation/:userId
   * Get full conversation with another user
   */
  getConversation: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { userId: otherUserId } = req.params;
    const conversation = await messagesService.getConversation(userId, otherUserId);

    res.status(200).json({
      success: true,
      data: conversation,
    });
  }),

  /**
   * PATCH /api/messages/:id/read
   * Mark message as read (receiver only)
   */
  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const result = await messagesService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  /**
   * DELETE /api/messages/:id
   * Delete message (sender only, soft delete)
   */
  deleteMessage: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const result = await messagesService.deleteMessage(id, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),
};
