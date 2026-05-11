import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { validateJoi } from '../middleware/validateJoi';
import { paymentsValidation } from '../validations/payments.validation';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create payment intent (student only)
router.post(
  '/create',
  authorize('student'),
  validateJoi(paymentsValidation.createPayment),
  paymentsController.createPayment
);

// Verify payment (student only)
router.post(
  '/verify',
  authorize('student'),
  validateJoi(paymentsValidation.verifyPayment),
  paymentsController.verifyPayment
);

// Get teacher earnings (teacher only)
router.get(
  '/earnings',
  authorize('teacher'),
  validateJoi(paymentsValidation.getEarnings),
  paymentsController.getEarnings
);

// Get all payments for authenticated user
router.get(
  '/',
  validateJoi(paymentsValidation.getPayments),
  paymentsController.getPayments
);

// Get all payments (admin only)
router.get(
  '/all',
  authorize('admin'),
  paymentsController.listAllPayments
);

// Get single payment by ID (student or teacher)
router.get(
  '/:id',
  validateJoi(paymentsValidation.getPaymentById),
  paymentsController.getPaymentById
);

// Request refund (student only)
router.post(
  '/:id/refund',
  authorize('student'),
  validateJoi(paymentsValidation.requestRefund),
  paymentsController.requestRefund
);

export default router;
