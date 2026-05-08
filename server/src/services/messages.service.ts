import Message from '../models/Message.model';
import User from '../models/User.model';
import Enrollment from '../models/Enrollment.model';
import { ApiError } from '../utils/ApiError';
import { emitToUser } from './socket.service';
import mongoose from 'mongoose';

export const messagesService = {
  /**
   * Send a message to another user
   * Users can only message if they share at least one active enrollment
   */
  async sendMessage(senderId: string, receiverId: string, content: string) {
    // Validation
    if (!content || content.trim().length === 0) {
      throw new ApiError(400, 'Message content cannot be empty', 'EMPTY_CONTENT');
    }

    if (content.length > 2000) {
      throw new ApiError(
        400,
        'Message content cannot exceed 2000 characters',
        'CONTENT_TOO_LONG'
      );
    }

    if (senderId === receiverId) {
      throw new ApiError(
        400,
        'Cannot send message to yourself',
        'CANNOT_MESSAGE_SELF'
      );
    }

    // Check if sender exists
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new ApiError(404, 'Sender not found', 'SENDER_NOT_FOUND');
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new ApiError(404, 'Receiver not found', 'RECEIVER_NOT_FOUND');
    }

    // Check if users are connected through enrollments
    const isConnected = await this.areUsersConnected(senderId, receiverId);
    if (!isConnected) {
      throw new ApiError(
        403,
        'You can only message users enrolled in the same courses',
        'USERS_NOT_CONNECTED'
      );
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      isRead: false,
      isDeleted: false,
    });

    // Emit socket event to receiver (ignore if socket not initialized, e.g., in tests)
    try {
      emitToUser(receiverId, 'new_message', {
        id: message._id.toString(),
        sender: {
          id: senderId,
          name: sender.name,
          photo: sender.photo,
        },
        content: message.content,
        createdAt: message.createdAt,
      });
    } catch {
      // Socket not initialized (e.g., in tests) - continue without emitting
    }

    return {
      id: message._id.toString(),
      sender: message.sender,
      receiver: message.receiver,
      content: message.content,
      isRead: message.isRead,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  },

  /**
   * Check if two users are connected through enrollments
   * Students can message each other if enrolled in same course
   * Teachers can message their students
   * Students can message their teachers
   */
  async areUsersConnected(userId1: string, userId2: string): Promise<boolean> {
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);

    if (!user1 || !user2) return false;

    // If one is teacher and other is student, check if they share a course
    if (user1.role === 'teacher' && user2.role === 'student') {
      const enrollment = await Enrollment.findOne({
        teacher: userId1,
        student: userId2,
        isActive: true,
      });
      return !!enrollment;
    }

    if (user1.role === 'student' && user2.role === 'teacher') {
      const enrollment = await Enrollment.findOne({
        teacher: userId2,
        student: userId1,
        isActive: true,
      });
      return !!enrollment;
    }

    // If both are students, check if they share a course
    if (user1.role === 'student' && user2.role === 'student') {
      const user1Enrollments = await Enrollment.find({
        student: userId1,
        isActive: true,
      }).select('course');

      const user1CourseIds = user1Enrollments.map((e) => e.course.toString());

      const sharedEnrollment = await Enrollment.findOne({
        student: userId2,
        course: { $in: user1CourseIds },
        isActive: true,
      });

      return !!sharedEnrollment;
    }

    // Teachers can't message each other (unless they share a course as students)
    return false;
  },

  /**
   * Get all conversations for a user
   * Returns list of users with last message and unread count
   */
  async getConversations(userId: string) {
    // Get all unique conversation partners
    const sentMessages = await Message.find({
      sender: userId,
      isDeleted: false,
    }).distinct('receiver');

    const receivedMessages = await Message.find({
      receiver: userId,
      isDeleted: false,
    }).distinct('sender');

    // Combine and deduplicate
    const conversationPartnerIds = [
      ...new Set([
        ...sentMessages.map((id) => id.toString()),
        ...receivedMessages.map((id) => id.toString()),
      ]),
    ];

    // Build conversation list
    const conversations = await Promise.all(
      conversationPartnerIds.map(async (partnerId) => {
        // Get last message
        const lastMessage = await Message.findOne({
          $or: [
            { sender: userId, receiver: partnerId },
            { sender: partnerId, receiver: userId },
          ],
          isDeleted: false,
        })
          .sort({ createdAt: -1 })
          .lean();

        // Get unread count (messages sent to me that I haven't read)
        const unreadCount = await Message.countDocuments({
          sender: partnerId,
          receiver: userId,
          isRead: false,
          isDeleted: false,
        });

        // Get partner details
        const partner = await User.findById(partnerId)
          .select('name email photo role')
          .lean();

        return {
          user: partner,
          lastMessage: lastMessage
            ? {
                id: lastMessage._id.toString(),
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                isRead: lastMessage.isRead,
                isSentByMe: lastMessage.sender.toString() === userId,
              }
            : null,
          unreadCount,
        };
      })
    );

    // Filter out conversations with no last message (shouldn't happen, but safety)
    const validConversations = conversations.filter((c) => c.lastMessage !== null);

    // Sort by most recent message
    validConversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || 0;
      const timeB = b.lastMessage?.createdAt || 0;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    return validConversations;
  },

  /**
   * Get full conversation thread with another user
   */
  async getConversation(userId: string, otherUserId: string) {
    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Get all messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
      isDeleted: false,
    })
      .populate('sender', 'name email photo role')
      .populate('receiver', 'name email photo role')
      .sort({ createdAt: 1 })
      .lean();

    return messages.map((msg) => ({
      id: msg._id.toString(),
      sender: msg.sender,
      receiver: msg.receiver,
      content: msg.content,
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));
  },

  /**
   * Mark message as read (receiver only)
   */
  async markAsRead(messageId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new ApiError(400, 'Invalid message ID', 'INVALID_MESSAGE_ID');
    }

    const message = await Message.findOne({
      _id: messageId,
      isDeleted: false,
    });

    if (!message) {
      throw new ApiError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
    }

    // Only receiver can mark as read
    if (message.receiver.toString() !== userId) {
      throw new ApiError(
        403,
        'Only the receiver can mark message as read',
        'UNAUTHORIZED'
      );
    }

    // Update message
    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    return {
      id: message._id.toString(),
      isRead: message.isRead,
      readAt: message.readAt,
    };
  },

  /**
   * Delete message (sender only, soft delete)
   */
  async deleteMessage(messageId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new ApiError(400, 'Invalid message ID', 'INVALID_MESSAGE_ID');
    }

    const message = await Message.findOne({
      _id: messageId,
      isDeleted: false,
    });

    if (!message) {
      throw new ApiError(404, 'Message not found', 'MESSAGE_NOT_FOUND');
    }

    // Only sender can delete
    if (message.sender.toString() !== userId) {
      throw new ApiError(
        403,
        'Only the sender can delete the message',
        'UNAUTHORIZED'
      );
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    return {
      id: message._id.toString(),
      isDeleted: message.isDeleted,
      message: 'Message deleted successfully',
    };
  },
};
