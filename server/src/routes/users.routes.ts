import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { validateJoi } from '../middleware/validateJoi';
import { usersValidation } from '../validations/users.validation';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// All users routes require authentication
router.use(authenticate);

// Get authenticated user's profile
router.get('/profile', usersController.getProfile);

// Update authenticated user's profile
router.patch(
  '/profile',
  validateJoi(usersValidation.updateProfile),
  usersController.updateProfile
);

// Change password
router.post(
  '/change-password',
  validateJoi(usersValidation.changePassword),
  usersController.changePassword
);

// Delete account
router.delete(
  '/account',
  validateJoi(usersValidation.deleteAccount),
  usersController.deleteAccount
);

// List all users (admin only)
router.get(
  '/',
  authorize('admin'),
  usersController.getAllUsers
);

// Get public user profile by ID (must be after other routes to avoid conflicts)
router.get(
  '/:id',
  validateJoi(usersValidation.getUserById),
  usersController.getUserById
);

export default router;
