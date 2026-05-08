import Payment from '../models/Payment.model';
import Course from '../models/Course.model';
import Enrollment from '../models/Enrollment.model';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

export const paymentsService = {
  /**
   * Create payment intent (student only)
   * Validates course and creates pending payment
   */
  async createPayment(
    studentId: string,
    courseId: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ) {
    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, 'Invalid course ID', 'INVALID_COURSE_ID');
    }

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    if (course.status !== 'published') {
      throw new ApiError(
        400,
        'Course is not available for payment',
        'COURSE_NOT_AVAILABLE'
      );
    }

    // Validate amount and currency match course price
    if (amount !== course.price || currency !== course.currency) {
      throw new ApiError(
        400,
        'Payment amount or currency does not match course price',
        'AMOUNT_MISMATCH'
      );
    }

    // Check for duplicate pending payment
    const existingPendingPayment = await Payment.findOne({
      student: studentId,
      course: courseId,
      status: 'pending',
    });

    if (existingPendingPayment) {
      throw new ApiError(
        409,
        'You already have a pending payment for this course',
        'DUPLICATE_PENDING_PAYMENT'
      );
    }

    // Create payment intent
    const payment = await Payment.create({
      student: studentId,
      course: courseId,
      teacher: course.teacher,
      method: paymentMethod,
      amount,
      currency,
      status: 'pending',
    });

    return {
      id: payment._id.toString(),
      student: payment.student,
      course: payment.course,
      teacher: payment.teacher,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt,
    };
  },

  /**
   * Verify payment (student only)
   * Updates pending payment with transaction details and approves it
   */
  async verifyPayment(
    studentId: string,
    paymentId: string,
    transactionId: string,
    screenshotUrl: string
  ) {
    // Validate payment ID
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new ApiError(400, 'Invalid payment ID', 'INVALID_PAYMENT_ID');
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    // Check ownership
    if (payment.student.toString() !== studentId) {
      throw new ApiError(
        403,
        'Not authorized to verify this payment',
        'UNAUTHORIZED'
      );
    }

    // Check if already verified
    if (payment.status !== 'pending') {
      throw new ApiError(
        400,
        'Payment has already been verified',
        'ALREADY_VERIFIED'
      );
    }

    // Update payment with transaction details and approve
    payment.transactionId = transactionId;
    payment.screenshotUrl = screenshotUrl;
    payment.status = 'approved';
    payment.verifiedAt = new Date();
    await payment.save();

    return {
      id: payment._id.toString(),
      student: payment.student,
      course: payment.course,
      teacher: payment.teacher,
      method: payment.method,
      transactionId: payment.transactionId,
      screenshotUrl: payment.screenshotUrl,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      verifiedAt: payment.verifiedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  },

  /**
   * Get all payments for a user with optional status filter
   */
  async getPayments(userId: string, status?: string) {
    const query: any = { student: userId };

    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('course', 'title description price currency thumbnail')
      .populate('teacher', 'name email photo')
      .sort({ createdAt: -1 })
      .lean();

    return payments.map((payment) => ({
      id: payment._id.toString(),
      student: payment.student,
      course: payment.course,
      teacher: payment.teacher,
      method: payment.method,
      transactionId: payment.transactionId,
      screenshotUrl: payment.screenshotUrl,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      verifiedAt: payment.verifiedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));
  },

  /**
   * Get single payment by ID (student or teacher)
   */
  async getPaymentById(paymentId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new ApiError(400, 'Invalid payment ID', 'INVALID_PAYMENT_ID');
    }

    const payment = await Payment.findById(paymentId)
      .populate('course', 'title description price currency thumbnail')
      .populate('student', 'name email photo')
      .populate('teacher', 'name email photo')
      .lean();

    if (!payment) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    // Check authorization (student or teacher)
    if (
      payment.student._id.toString() !== userId &&
      payment.teacher._id.toString() !== userId
    ) {
      throw new ApiError(
        403,
        'Not authorized to access this payment',
        'UNAUTHORIZED'
      );
    }

    return {
      id: payment._id.toString(),
      student: payment.student,
      course: payment.course,
      teacher: payment.teacher,
      method: payment.method,
      transactionId: payment.transactionId,
      screenshotUrl: payment.screenshotUrl,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      verifiedAt: payment.verifiedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  },

  /**
   * Request refund (student only, within 7 days, before course starts)
   */
  async requestRefund(paymentId: string, studentId: string, reason: string) {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new ApiError(400, 'Invalid payment ID', 'INVALID_PAYMENT_ID');
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new ApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    // Check ownership
    if (payment.student.toString() !== studentId) {
      throw new ApiError(
        403,
        'Not authorized to request refund for this payment',
        'UNAUTHORIZED'
      );
    }

    // Business rule: Only approved payments can be refunded
    if (payment.status !== 'approved') {
      throw new ApiError(
        400,
        'Only approved payments can be refunded',
        'INVALID_PAYMENT_STATUS'
      );
    }

    // Business rule: Refund only within 7 days
    const daysSincePayment = Math.floor(
      (Date.now() - payment.verifiedAt!.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePayment > 7) {
      throw new ApiError(
        400,
        'Refund can only be requested within 7 days of payment',
        'REFUND_PERIOD_EXPIRED'
      );
    }

    // Business rule: Cannot refund after course starts
    const enrollment = await Enrollment.findOne({
      payment: paymentId,
      isActive: true,
    });

    if (enrollment && enrollment.progress.sessionsAttended > 0) {
      throw new ApiError(
        400,
        'Cannot request refund after course has started',
        'COURSE_STARTED'
      );
    }

    // Mark payment for refund (in real system, this would trigger admin review)
    payment.adminNote = `Refund requested: ${reason}`;
    await payment.save();

    return {
      id: payment._id.toString(),
      refundRequested: true,
      message: 'Refund request submitted successfully',
    };
  },

  /**
   * Get teacher earnings (teacher only)
   * Calculates earnings with 80/20 split (teacher gets 80%)
   */
  async getTeacherEarnings(
    teacherId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const query: any = {
      teacher: teacherId,
      status: 'approved',
    };

    if (startDate || endDate) {
      query.verifiedAt = {};
      if (startDate) {
        query.verifiedAt.$gte = startDate;
      }
      if (endDate) {
        query.verifiedAt.$lte = endDate;
      }
    }

    const payments = await Payment.find(query).lean();

    const totalEarnings = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const platformFee = totalEarnings * 0.2; // 20% platform fee
    const netEarnings = totalEarnings * 0.8; // 80% for teacher

    return {
      totalEarnings,
      platformFee,
      netEarnings,
      paymentCount: payments.length,
      payments: payments.map((payment) => ({
        id: payment._id.toString(),
        course: payment.course,
        student: payment.student,
        amount: payment.amount,
        currency: payment.currency,
        verifiedAt: payment.verifiedAt,
      })),
    };
  },
};
