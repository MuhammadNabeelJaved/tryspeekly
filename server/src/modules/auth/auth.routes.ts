import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authValidation } from './auth.validation';
import { authLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.post('/register',
  authLimiter,
  validate(authValidation.register),
  authController.register
);

router.post('/login',
  authLimiter,
  validate(authValidation.login),
  authController.login
);

router.post('/refresh',
  validate(authValidation.refresh),
  authController.refreshTokens
);

router.post('/forgot-password',
  authLimiter,
  validate(authValidation.forgotPassword),
  authController.requestPasswordReset
);

router.post('/reset-password',
  authLimiter,
  validate(authValidation.resetPassword),
  authController.resetPassword
);

router.post('/logout',
  authenticate,
  authController.logout
);

export default router;
