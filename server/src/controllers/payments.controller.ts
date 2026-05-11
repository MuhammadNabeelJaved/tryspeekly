import { Request, Response, NextFunction } from 'express';
import { paymentsService } from '../services/payments.service';

export const paymentsController = {
  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { courseId, amount, currency, paymentMethod } = req.body;

      const payment = await paymentsService.createPayment(
        studentId,
        courseId,
        amount,
        currency,
        paymentMethod
      );

      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { paymentId, transactionId, screenshotUrl } = req.body;

      const payment = await paymentsService.verifyPayment(
        studentId,
        paymentId,
        transactionId,
        screenshotUrl
      );

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { status } = req.query;

      const payments = await paymentsService.getPayments(
        userId,
        status as string
      );

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const payment = await paymentsService.getPaymentById(id, userId);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  async requestRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.userId;
      const { id } = req.params;
      const { reason } = req.body;

      const result = await paymentsService.requestRefund(id, studentId, reason);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async listAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;

      const result = await paymentsService.listAllPayments({
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getEarnings(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = req.user!.userId;
      const { startDate, endDate } = req.query;

      const earnings = await paymentsService.getTeacherEarnings(
        teacherId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: earnings,
      });
    } catch (error) {
      next(error);
    }
  },
};
