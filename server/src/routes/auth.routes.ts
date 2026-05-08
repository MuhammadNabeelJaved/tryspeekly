import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateJoi } from '../middleware/validateJoi';
import { authValidation } from '../validations/auth.validation';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/register',
  authLimiter,
  validateJoi(authValidation.register),
  authController.register
);

router.post('/login',
  authLimiter,
  validateJoi(authValidation.login),
  authController.login
);

router.post('/refresh',
  validateJoi(authValidation.refresh),
  authController.refreshTokens
);

router.post('/forgot-password',
  authLimiter,
  validateJoi(authValidation.forgotPassword),
  authController.requestPasswordReset
);

router.post('/reset-password',
  authLimiter,
  validateJoi(authValidation.resetPassword),
  authController.resetPassword
);

router.post('/logout',
  authenticate,
  authController.logout
);

export default router;
