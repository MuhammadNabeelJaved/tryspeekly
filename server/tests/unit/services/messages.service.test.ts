import { messagesService } from '../../../src/services/messages.service';
import User from '../../../src/models/User.model';
import Course from '../../../src/models/Course.model';
import Enrollment from '../../../src/models/Enrollment.model';
import Payment from '../../../src/models/Payment.model';
import Message from '../../../src/models/Message.model';
import { ApiError } from '../../../src/utils/ApiError';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/testDb';
import mongoose from 'mongoose';
import * as socketService from '../../../src/services/socket.service';

// Mock socket service
jest.mock('../../../src/services/socket.service', () => ({
  emitToUser: jest.fn(),
}));

describe('messagesService', () => {
  let student1Id: string;
  let student2Id: string;
  let teacherId: string;
  let courseId: string;
  let enrollment1Id: string;
  let enrollment2Id: string;

  beforeAll(async () => {
    await connectTestDB();
  }, 120000);

  afterAll(async () => {
    await disconnectTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();
    jest.clearAllMocks();

    // Create teacher
    const teacher = await User.create({
      name: 'Test Teacher',
      email: 'teacher@example.com',
      password: 'Password123!',
      role: 'teacher',
    });
    teacherId = teacher._id.toString();

    // Create two students
    const student1 = await User.create({
      name: 'Student One',
      email: 'student1@example.com',
      password: 'Password123!',
      role: 'student',
    });
    student1Id = student1._id.toString();

    const student2 = await User.create({
      name: 'Student Two',
      email: 'student2@example.com',
      password: 'Password123!',
      role: 'student',
    });
    student2Id = student2._id.toString();

    // Create course
    const course = await Course.create({
      title: 'English Grammar',
      description: 'Learn grammar',
      price: 5000,
      currency: 'PKR',
      type: 'one-to-one',
      level: 'beginner',
      focus: 'grammar',
      totalSessions: 10,
      sessionDuration: 60,
      teacher: teacherId,
      status: 'published',
    });
    courseId = course._id.toString();

    // Create payments
    const payment1 = await Payment.create({
      student: student1Id,
      course: courseId,
      teacher: teacherId,
      method: 'jazzcash',
      transactionId: 'TXN001',
      screenshotUrl: 'https://example.com/screenshot1.jpg',
      amount: 5000,
      currency: 'PKR',
      status: 'approved',
      verifiedBy: teacherId,
      verifiedAt: new Date(),
    });

    const payment2 = await Payment.create({
      student: student2Id,
      course: courseId,
      teacher: teacherId,
      method: 'jazzcash',
      transactionId: 'TXN002',
      screenshotUrl: 'https://example.com/screenshot2.jpg',
      amount: 5000,
      currency: 'PKR',
      status: 'approved',
      verifiedBy: teacherId,
      verifiedAt: new Date(),
    });

    // Create enrollments (both students enrolled in same course)
    const enrollment1 = await Enrollment.create({
      student: student1Id,
      course: courseId,
      teacher: teacherId,
      payment: payment1._id,
      isActive: true,
      progress: {
        sessionsAttended: 0,
        totalSessions: 10,
      },
    });
    enrollment1Id = enrollment1._id.toString();

    const enrollment2 = await Enrollment.create({
      student: student2Id,
      course: courseId,
      teacher: teacherId,
      payment: payment2._id,
      isActive: true,
      progress: {
        sessionsAttended: 0,
        totalSessions: 10,
      },
    });
    enrollment2Id = enrollment2._id.toString();
  });

  describe('sendMessage', () => {
    it('should send message between enrolled students successfully', async () => {
      const result = await messagesService.sendMessage(
        student1Id,
        student2Id,
        'Hello, how are you?'
      );

      expect(result).toHaveProperty('id');
      expect(result.sender.toString()).toBe(student1Id);
      expect(result.receiver.toString()).toBe(student2Id);
      expect(result.content).toBe('Hello, how are you?');
      expect(result.isRead).toBe(false);
      expect(result.isDeleted).toBe(false);

      // Verify socket event was emitted
      expect(socketService.emitToUser).toHaveBeenCalledWith(
        student2Id,
        'new_message',
        expect.objectContaining({
          id: result.id,
          content: 'Hello, how are you?',
        })
      );
    });

    it('should allow teacher to message enrolled student', async () => {
      const result = await messagesService.sendMessage(
        teacherId,
        student1Id,
        'Welcome to the course!'
      );

      expect(result.sender.toString()).toBe(teacherId);
      expect(result.receiver.toString()).toBe(student1Id);
      expect(result.content).toBe('Welcome to the course!');
    });

    it('should allow student to message their teacher', async () => {
      const result = await messagesService.sendMessage(
        student1Id,
        teacherId,
        'I have a question about grammar'
      );

      expect(result.sender.toString()).toBe(student1Id);
      expect(result.receiver.toString()).toBe(teacherId);
      expect(result.content).toBe('I have a question about grammar');
    });

    it('should throw error if sender does not exist', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        messagesService.sendMessage(fakeUserId, student2Id, 'Hello')
      ).rejects.toThrow('Sender not found');
    });

    it('should throw error if receiver does not exist', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        messagesService.sendMessage(student1Id, fakeUserId, 'Hello')
      ).rejects.toThrow('Receiver not found');
    });

    it('should throw error if users are not connected through any course', async () => {
      // Create a third student not enrolled in any course with student1
      const student3 = await User.create({
        name: 'Student Three',
        email: 'student3@example.com',
        password: 'Password123!',
        role: 'student',
      });

      await expect(
        messagesService.sendMessage(student1Id, student3._id.toString(), 'Hello')
      ).rejects.toThrow('You can only message users enrolled in the same courses');
    });

    it('should throw error if trying to message yourself', async () => {
      await expect(
        messagesService.sendMessage(student1Id, student1Id, 'Hello myself')
      ).rejects.toThrow('Cannot send message to yourself');
    });

    it('should throw error if content is empty', async () => {
      await expect(
        messagesService.sendMessage(student1Id, student2Id, '')
      ).rejects.toThrow('Message content cannot be empty');
    });

    it('should throw error if content exceeds max length', async () => {
      const longContent = 'a'.repeat(2001);

      await expect(
        messagesService.sendMessage(student1Id, student2Id, longContent)
      ).rejects.toThrow('Message content cannot exceed 2000 characters');
    });
  });

  describe('getConversations', () => {
    beforeEach(async () => {
      // Create some messages
      await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'Hello from student 1',
        isRead: false,
        isDeleted: false,
      });

      await Message.create({
        sender: student2Id,
        receiver: student1Id,
        content: 'Reply from student 2',
        isRead: true,
        isDeleted: false,
      });

      await Message.create({
        sender: teacherId,
        receiver: student1Id,
        content: 'Message from teacher',
        isRead: false,
        isDeleted: false,
      });
    });

    it('should return all conversations for a user', async () => {
      const result = await messagesService.getConversations(student1Id);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('user');
      expect(result[0]).toHaveProperty('lastMessage');
      expect(result[0]).toHaveProperty('unreadCount');
    });

    it('should include unread count for each conversation', async () => {
      const result = await messagesService.getConversations(student1Id);

      const teacherConvo = result.find(
        (c: any) => c.user._id.toString() === teacherId
      );

      expect(teacherConvo).toBeDefined();
      expect(teacherConvo!.unreadCount).toBe(1);
    });

    it('should sort conversations by most recent message', async () => {
      const result = await messagesService.getConversations(student1Id);

      // Teacher's message was created last, so should be first
      expect(result[0].user).toBeDefined();
      expect(result[0].user!._id.toString()).toBe(teacherId);
    });

    it('should return empty array if user has no conversations', async () => {
      // Create new user with no messages
      const newUser = await User.create({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
        role: 'student',
      });

      const result = await messagesService.getConversations(newUser._id.toString());

      expect(result).toHaveLength(0);
    });

    it('should not include deleted messages in last message', async () => {
      // Delete the most recent message
      await Message.updateOne(
        { sender: teacherId, receiver: student1Id },
        { isDeleted: true, deletedAt: new Date() }
      );

      const result = await messagesService.getConversations(student1Id);

      const teacherConvo = result.find(
        (c: any) => c.user._id.toString() === teacherId
      );

      // Last message should not be the deleted one
      expect(teacherConvo).toBeUndefined();
    });
  });

  describe('getConversation', () => {
    beforeEach(async () => {
      // Create a conversation thread
      await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'First message',
        isRead: true,
        isDeleted: false,
      });

      await Message.create({
        sender: student2Id,
        receiver: student1Id,
        content: 'Reply',
        isRead: true,
        isDeleted: false,
      });

      await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'Third message',
        isRead: false,
        isDeleted: false,
      });

      // Create a deleted message (should not be returned)
      await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'Deleted message',
        isRead: false,
        isDeleted: true,
        deletedAt: new Date(),
      });
    });

    it('should return full conversation thread between two users', async () => {
      const result = await messagesService.getConversation(student1Id, student2Id);

      expect(result).toHaveLength(3); // Deleted message not included
      expect(result[0].content).toBe('First message');
      expect(result[1].content).toBe('Reply');
      expect(result[2].content).toBe('Third message');
    });

    it('should include sender and receiver details', async () => {
      const result = await messagesService.getConversation(student1Id, student2Id);

      expect(result[0].sender).toHaveProperty('name');
      expect(result[0].sender).toHaveProperty('email');
      expect(result[0].receiver).toHaveProperty('name');
      expect(result[0].receiver).toHaveProperty('email');
    });

    it('should throw error if other user does not exist', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        messagesService.getConversation(student1Id, fakeUserId)
      ).rejects.toThrow('User not found');
    });

    it('should return empty array if no messages between users', async () => {
      const result = await messagesService.getConversation(student1Id, teacherId);

      expect(result).toHaveLength(0);
    });

    it('should only show non-deleted messages', async () => {
      const result = await messagesService.getConversation(student1Id, student2Id);

      const deletedMsg = result.find((m: any) => m.content === 'Deleted message');
      expect(deletedMsg).toBeUndefined();
    });
  });

  describe('markAsRead', () => {
    let messageId: string;

    beforeEach(async () => {
      const message = await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'Unread message',
        isRead: false,
        isDeleted: false,
      });
      messageId = message._id.toString();
    });

    it('should mark message as read by receiver', async () => {
      const result = await messagesService.markAsRead(messageId, student2Id);

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();

      // Verify in database
      const message = await Message.findById(messageId);
      expect(message?.isRead).toBe(true);
      expect(message?.readAt).toBeDefined();
    });

    it('should throw error if message does not exist', async () => {
      const fakeMessageId = new mongoose.Types.ObjectId().toString();

      await expect(
        messagesService.markAsRead(fakeMessageId, student2Id)
      ).rejects.toThrow('Message not found');
    });

    it('should throw error if user is not the receiver', async () => {
      // student1 is the sender, not receiver
      await expect(
        messagesService.markAsRead(messageId, student1Id)
      ).rejects.toThrow('Only the receiver can mark message as read');
    });

    it('should throw error if message is already deleted', async () => {
      await Message.updateOne(
        { _id: messageId },
        { isDeleted: true, deletedAt: new Date() }
      );

      await expect(
        messagesService.markAsRead(messageId, student2Id)
      ).rejects.toThrow('Message not found');
    });

    it('should allow marking already read message as read again', async () => {
      // Mark as read first time
      await messagesService.markAsRead(messageId, student2Id);

      // Mark as read again
      const result = await messagesService.markAsRead(messageId, student2Id);

      expect(result.isRead).toBe(true);
    });
  });

  describe('deleteMessage', () => {
    let messageId: string;

    beforeEach(async () => {
      const message = await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'Message to delete',
        isRead: false,
        isDeleted: false,
      });
      messageId = message._id.toString();
    });

    it('should soft delete message by sender', async () => {
      const result = await messagesService.deleteMessage(messageId, student1Id);

      expect(result.isDeleted).toBe(true);
      expect(result.message).toBe('Message deleted successfully');

      // Verify in database (soft delete, not hard delete)
      const message = await Message.findById(messageId);
      expect(message).toBeDefined();
      expect(message?.isDeleted).toBe(true);
      expect(message?.deletedAt).toBeDefined();
    });

    it('should throw error if message does not exist', async () => {
      const fakeMessageId = new mongoose.Types.ObjectId().toString();

      await expect(
        messagesService.deleteMessage(fakeMessageId, student1Id)
      ).rejects.toThrow('Message not found');
    });

    it('should throw error if user is not the sender', async () => {
      // student2 is the receiver, not sender
      await expect(
        messagesService.deleteMessage(messageId, student2Id)
      ).rejects.toThrow('Only the sender can delete the message');
    });

    it('should throw error if message is already deleted', async () => {
      await Message.updateOne(
        { _id: messageId },
        { isDeleted: true, deletedAt: new Date() }
      );

      await expect(
        messagesService.deleteMessage(messageId, student1Id)
      ).rejects.toThrow('Message not found');
    });

    it('should throw error for invalid message ID format', async () => {
      await expect(
        messagesService.deleteMessage('invalid-id', student1Id)
      ).rejects.toThrow('Invalid message ID');
    });
  });
});
