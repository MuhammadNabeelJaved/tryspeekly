# Backend MVC Pattern Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert backend from partial modular structure to complete professional MVC architecture with 6 fully-functional modules

**Architecture:** Three-layer MVC (Routes → Controllers → Services → Models) with centralized error handling, validation middleware, and role-based authorization

**Tech Stack:** Node.js, Express, TypeScript, MongoDB/Mongoose, Jest/Supertest, Joi validation

---

## File Structure Overview

### New Files to Create

**Controllers:**
- `server/src/controllers/index.ts` - Barrel export
- `server/src/controllers/auth.controller.ts` - Auth HTTP handlers
- `server/src/controllers/users.controller.ts` - User profile HTTP handlers
- `server/src/controllers/courses.controller.ts` - Course CRUD HTTP handlers
- `server/src/controllers/enrollments.controller.ts` - Enrollment HTTP handlers
- `server/src/controllers/messages.controller.ts` - Messaging HTTP handlers
- `server/src/controllers/payments.controller.ts` - Payment HTTP handlers

**Routes:**
- `server/src/routes/index.ts` - Central route registry
- `server/src/routes/auth.routes.ts` - Auth endpoints
- `server/src/routes/users.routes.ts` - User endpoints
- `server/src/routes/courses.routes.ts` - Course endpoints
- `server/src/routes/enrollments.routes.ts` - Enrollment endpoints
- `server/src/routes/messages.routes.ts` - Message endpoints
- `server/src/routes/payments.routes.ts` - Payment endpoints

**Services:**
- `server/src/services/index.ts` - Barrel export (update existing)
- `server/src/services/users.service.ts` - User business logic
- `server/src/services/courses.service.ts` - Course business logic
- `server/src/services/enrollments.service.ts` - Enrollment business logic
- `server/src/services/messages.service.ts` - Messaging business logic
- `server/src/services/payments.service.ts` - Payment business logic

**Validations:**
- `server/src/validations/auth.validation.ts` - Auth validation schemas
- `server/src/validations/users.validation.ts` - User validation schemas
- `server/src/validations/courses.validation.ts` - Course validation schemas
- `server/src/validations/enrollments.validation.ts` - Enrollment validation schemas
- `server/src/validations/messages.validation.ts` - Message validation schemas
- `server/src/validations/payments.validation.ts` - Payment validation schemas

**Tests:**
- `server/tests/utils/testHelpers.ts` - Test utilities
- `server/tests/auth/auth.test.ts` - Auth integration tests (update existing)
- `server/tests/users/users.test.ts` - User integration tests
- `server/tests/courses/courses.test.ts` - Course integration tests
- `server/tests/enrollments/enrollments.test.ts` - Enrollment integration tests
- `server/tests/messages/messages.test.ts` - Message integration tests
- `server/tests/payments/payments.test.ts` - Payment integration tests

### Files to Modify

- `server/src/app.ts` - Update route imports
- `server/src/services/auth.service.ts` - Move from modules/auth/

### Files to Delete

- `server/src/modules/auth/` - Entire directory after migration

---

## PHASE 1: Foundation Setup

### Task 1: Create Directory Structure

**Files:**
- Create: `server/src/controllers/`
- Create: `server/src/routes/`
- Create: `server/src/validations/`

- [ ] **Step 1: Create controllers directory**

```bash
mkdir -p server/src/controllers
```

- [ ] **Step 2: Create routes directory**

```bash
mkdir -p server/src/routes
```

- [ ] **Step 3: Create validations directory**

```bash
mkdir -p server/src/validations
```

- [ ] **Step 4: Verify directories created**

Run: `ls -la server/src/`
Expected: See `controllers/`, `routes/`, `validations/` directories

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers server/src/routes server/src/validations
git commit -m "feat(structure): create MVC directory structure

Add controllers/, routes/, and validations/ directories for MVC pattern.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create Barrel Exports

**Files:**
- Create: `server/src/controllers/index.ts`
- Create: `server/src/routes/index.ts`
- Modify: `server/src/services/index.ts`

- [ ] **Step 1: Create controllers barrel export**

```typescript
// server/src/controllers/index.ts
// Barrel export for all controllers
// Add exports as controllers are created

export * from './auth.controller';
export * from './users.controller';
export * from './courses.controller';
export * from './enrollments.controller';
export * from './messages.controller';
export * from './payments.controller';
```

- [ ] **Step 2: Create routes index (central registry)**

```typescript
// server/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import coursesRoutes from './courses.routes';
import enrollmentsRoutes from './enrollments.routes';
import messagesRoutes from './messages.routes';
import paymentsRoutes from './payments.routes';

const router = Router();

// Register all routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/courses', coursesRoutes);
router.use('/enrollments', enrollmentsRoutes);
router.use('/messages', messagesRoutes);
router.use('/payments', paymentsRoutes);

export default router;
```

- [ ] **Step 3: Update services barrel export**

```typescript
// server/src/services/index.ts
// Barrel export for all services
export * from './auth.service';
export * from './users.service';
export * from './courses.service';
export * from './enrollments.service';
export * from './messages.service';
export * from './payments.service';

// Existing shared utilities
export * from './email.service';
export * from './logger.service';
export * from './socket.service';
export * from './upload.service';
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `cd server && npm run build`
Expected: Compilation errors for missing files (expected at this stage)

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/index.ts server/src/routes/index.ts server/src/services/index.ts
git commit -m "feat(structure): add barrel exports for MVC layers

Add index.ts files for controllers, routes, and services to enable clean imports.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Create Test Utilities

**Files:**
- Create: `server/tests/utils/testHelpers.ts`

- [ ] **Step 1: Create test helpers file**

```typescript
// server/tests/utils/testHelpers.ts
import jwt from 'jsonwebtoken';
import User from '../../src/models/User.model';
import Course from '../../src/models/Course.model';
import Enrollment from '../../src/models/Enrollment.model';
import Message from '../../src/models/Message.model';
import Payment from '../../src/models/Payment.model';

/**
 * Create a test user with optional overrides
 */
export const createTestUser = async (overrides: any = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'student',
    isEmailVerified: true,
  };

  return User.create({ ...defaultUser, ...overrides });
};

/**
 * Generate JWT token for a user
 */
export const generateToken = (user: any) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

/**
 * Clear all test data from database
 */
export const clearDatabase = async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
  await Enrollment.deleteMany({});
  await Message.deleteMany({});
  await Payment.deleteMany({});
};

/**
 * Create a test course
 */
export const createTestCourse = async (teacher: any, overrides: any = {}) => {
  const defaultCourse = {
    title: 'Test Course',
    description: 'This is a test course for automated testing',
    price: 5000,
    currency: 'PKR',
    type: 'one-on-one',
    level: 'beginner',
    focus: 'grammar',
    teacher: teacher._id,
    totalSessions: 10,
    sessionDuration: 60,
    status: 'published',
    enrolledStudents: [],
  };

  return Course.create({ ...defaultCourse, ...overrides });
};
```

- [ ] **Step 2: Verify test helpers compile**

Run: `cd server && npm run build`
Expected: Should compile without errors

- [ ] **Step 3: Commit**

```bash
git add server/tests/utils/testHelpers.ts
git commit -m "test(utils): add test helper functions

Add utilities for creating test users, courses, generating tokens, and database cleanup.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## PHASE 2: Auth Module Migration

### Task 4: Create Auth Validation

**Files:**
- Create: `server/src/validations/auth.validation.ts`
- Reference: `server/src/modules/auth/auth.validation.ts`

- [ ] **Step 1: Create auth validation file**

```typescript
// server/src/validations/auth.validation.ts
import Joi from 'joi';

export const authValidation = {
  register: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        }),
      role: Joi.string().valid('student', 'teacher').default('student')
    })
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  },

  refresh: {
    body: Joi.object({
      refreshToken: Joi.string().required()
    })
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required()
    })
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
    })
  }
};
```

- [ ] **Step 2: Verify compilation**

Run: `cd server && npm run build`
Expected: Should compile without errors

- [ ] **Step 3: Commit**

```bash
git add server/src/validations/auth.validation.ts
git commit -m "feat(auth): add auth validation schemas

Add Joi validation schemas for register, login, refresh, forgot password, and reset password.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Migrate Auth Controller

**Files:**
- Create: `server/src/controllers/auth.controller.ts`
- Reference: `server/src/modules/auth/auth.controller.ts`

- [ ] **Step 1: Create auth controller**

```typescript
// server/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  refreshTokens: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    const result = await authService.refreshTokens(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  }),

  requestPasswordReset: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await authService.requestPasswordReset(email);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }),
};
```

- [ ] **Step 2: Verify compilation**

Run: `cd server && npm run build`
Expected: Should compile (may have errors about missing authService - expected)

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/auth.controller.ts
git commit -m "feat(auth): add auth controller

Add HTTP request handlers for register, login, logout, refresh tokens, and password reset.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Migrate Auth Service

**Files:**
- Move: `server/src/modules/auth/auth.service.ts` → `server/src/services/auth.service.ts`

- [ ] **Step 1: Copy auth service to new location**

```bash
cp server/src/modules/auth/auth.service.ts server/src/services/auth.service.ts
```

- [ ] **Step 2: Update imports in auth service**

Update relative import paths in `server/src/services/auth.service.ts`:
- Change `'../models/'` to `'../models/'` (should already be correct)
- Change `'../utils/'` to `'../utils/'` (should already be correct)
- Verify all imports work from new location

- [ ] **Step 3: Verify compilation**

Run: `cd server && npm run build`
Expected: Should compile without errors

- [ ] **Step 4: Commit**

```bash
git add server/src/services/auth.service.ts
git commit -m "feat(auth): migrate auth service to services layer

Move auth.service.ts from modules/auth/ to services/ directory.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Create Auth Routes

**Files:**
- Create: `server/src/routes/auth.routes.ts`
- Reference: `server/src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Create auth routes file**

```typescript
// server/src/routes/auth.routes.ts
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authValidation } from '../validations/auth.validation';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(authValidation.register),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(authValidation.login),
  authController.login
);

router.post(
  '/refresh',
  validate(authValidation.refresh),
  authController.refreshTokens
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(authValidation.forgotPassword),
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  authLimiter,
  validate(authValidation.resetPassword),
  authController.resetPassword
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

export default router;
```

- [ ] **Step 2: Verify compilation**

Run: `cd server && npm run build`
Expected: Should compile without errors

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/auth.routes.ts
git commit -m "feat(auth): add auth routes

Add route definitions for register, login, logout, refresh, and password reset endpoints.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Update App to Use New Routes

**Files:**
- Modify: `server/src/app.ts`

- [ ] **Step 1: Update app.ts imports and routes**

Replace the auth route import in `server/src/app.ts`:

```typescript
// OLD:
// import authRoutes from './modules/auth/auth.routes';

// NEW:
import routes from './routes';
```

Replace the route registration:

```typescript
// OLD:
// app.use('/api/auth', authRoutes);

// NEW:
app.use('/api', routes);
```

- [ ] **Step 2: Verify compilation**

Run: `cd server && npm run build`
Expected: Should compile without errors

- [ ] **Step 3: Start server and test health endpoint**

```bash
cd server && npm start
```

Then in another terminal:
```bash
curl http://localhost:5000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 4: Commit**

```bash
git add server/src/app.ts
git commit -m "feat(app): update to use centralized route registry

Replace direct auth route import with centralized routes from routes/index.ts.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Test Auth Migration

**Files:**
- Test: `server/tests/auth/auth.test.ts`

- [ ] **Step 1: Run existing auth tests**

```bash
cd server && npm test -- tests/auth
```

Expected: All auth tests should pass

- [ ] **Step 2: Test auth endpoints manually**

Start server:
```bash
cd server && npm start
```

Test registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123!","role":"student"}'
```

Expected: 201 response with user data and accessToken

- [ ] **Step 3: If all tests pass, delete old auth module**

```bash
rm -rf server/src/modules/auth
rm -rf server/src/modules
```

- [ ] **Step 4: Verify compilation after deletion**

Run: `cd server && npm run build`
Expected: Should compile without errors

- [ ] **Step 5: Run all tests**

```bash
cd server && npm test
```

Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(auth): complete auth module migration to MVC

Remove old modules/auth directory. Auth now follows MVC pattern:
- controllers/auth.controller.ts
- services/auth.service.ts
- routes/auth.routes.ts
- validations/auth.validation.ts

All tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## PHASE 3: Users Module

### Task 10: Users Validation Schemas

**Files:**
- Create: `server/src/validations/users.validation.ts`

- [ ] **Step 1: Create users validation file**

```typescript
// server/src/validations/users.validation.ts
import Joi from 'joi';

export const usersValidation = {
  getProfile: {
    // No validation needed - uses authenticated user
  },

  updateProfile: {
    body: Joi.object({
      name: Joi.string().min(2).max(100),
      bio: Joi.string().max(500),
      avatar: Joi.string().uri()
    }).min(1) // At least one field required
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        })
    })
  },

  getUserById: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
          'string.pattern.base': 'Invalid user ID format'
        })
    })
  },

  deleteAccount: {
    body: Joi.object({
      password: Joi.string().required()
    })
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/validations/users.validation.ts
git commit -m "feat(users): add users validation schemas

Add Joi validation for profile management, password change, and account deletion.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Users Service with TDD

**Files:**
- Create: `server/src/services/users.service.ts`
- Create: `server/tests/users/users.test.ts`

- [ ] **Step 1: Write failing test for getProfile**

```typescript
// server/tests/users/users.test.ts
import request from 'supertest';
import app from '../../src/app';
import { connectDB, disconnectDB } from '../../src/config/database';
import { createTestUser, generateToken, clearDatabase } from '../utils/testHelpers';

describe('Users API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/users/profile', () => {
    it('should get current user profile', async () => {
      const user = await createTestUser({ name: 'John Doe', bio: 'Test bio' });
      const token = generateToken(user);

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John Doe');
      expect(res.body.data.bio).toBe('Test bio');
      expect(res.body.data.password).toBeUndefined(); // Should not return password
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app).get('/api/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npm test -- tests/users/users.test.ts
```

Expected: FAIL - "Cannot GET /api/users/profile" or similar

- [ ] **Step 3: Create users service**

```typescript
// server/src/services/users.service.ts
import User from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import bcrypt from 'bcryptjs';

export const usersService = {
  /**
   * Get user profile by ID
   */
  getProfile: async (userId: string) => {
    const user = await User.findById(userId).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return user;
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, updates: any) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Only allow specific fields to be updated
    const allowedFields = ['name', 'bio', 'avatar'];
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        (user as any)[key] = updates[key];
      }
    });

    await user.save();

    // Return user without sensitive fields
    const updatedUser = await User.findById(userId).select('-password -refreshToken');
    return updatedUser;
  },

  /**
   * Change user password
   */
  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  },

  /**
   * Get public user profile by ID
   */
  getUserById: async (userId: string) => {
    const user = await User.findById(userId).select('name bio avatar role createdAt');

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return user;
  },

  /**
   * Delete user account
   */
  deleteAccount: async (userId: string, password: string) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Password is incorrect', 'INVALID_PASSWORD');
    }

    await User.findByIdAndDelete(userId);

    return { message: 'Account deleted successfully' };
  }
};
```

- [ ] **Step 4: Create users controller**

```typescript
// server/src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { usersService } from '../services/users.service';
import { asyncHandler } from '../utils/asyncHandler';

export const usersController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const user = await usersService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: user
    });
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const updates = req.body;

    const user = await usersService.updateProfile(userId, updates);

    res.status(200).json({
      success: true,
      data: user
    });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const result = await usersService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: result.message
    });
  }),

  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await usersService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user
    });
  }),

  deleteAccount: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { password } = req.body;

    const result = await usersService.deleteAccount(userId, password);

    res.status(200).json({
      success: true,
      message: result.message
    });
  })
};
```

- [ ] **Step 5: Create users routes**

```typescript
// server/src/routes/users.routes.ts
import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { usersValidation } from '../validations/users.validation';

const router = Router();

// Protected routes - require authentication
router.get(
  '/profile',
  authenticate,
  usersController.getProfile
);

router.patch(
  '/profile',
  authenticate,
  validate(usersValidation.updateProfile),
  usersController.updateProfile
);

router.patch(
  '/change-password',
  authenticate,
  validate(usersValidation.changePassword),
  usersController.changePassword
);

router.delete(
  '/account',
  authenticate,
  validate(usersValidation.deleteAccount),
  usersController.deleteAccount
);

// Public routes
router.get(
  '/:id',
  validate(usersValidation.getUserById),
  usersController.getUserById
);

export default router;
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd server && npm test -- tests/users/users.test.ts
```

Expected: PASS - getProfile test passes

- [ ] **Step 7: Commit**

```bash
git add server/src/services/users.service.ts server/src/controllers/users.controller.ts server/src/routes/users.routes.ts server/tests/users/users.test.ts
git commit -m "feat(users): add users module with profile management

Add users service, controller, and routes for:
- Get profile
- Update profile
- Change password
- Get public user by ID
- Delete account

Includes basic integration test.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 12: Complete Users Integration Tests

**Files:**
- Modify: `server/tests/users/users.test.ts`

- [ ] **Step 1: Add comprehensive test cases**

Add to `server/tests/users/users.test.ts`:

```typescript
describe('PATCH /api/users/profile', () => {
  it('should update user profile', async () => {
    const user = await createTestUser();
    const token = generateToken(user);

    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
        bio: 'Updated bio'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.bio).toBe('Updated bio');
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .send({ name: 'New Name' });

    expect(res.status).toBe(401);
  });

  it('should return 400 for empty update', async () => {
    const user = await createTestUser();
    const token = generateToken(user);

    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/users/change-password', () => {
  it('should change password with correct current password', async () => {
    const user = await createTestUser({ password: 'OldPassword123!' });
    const token = generateToken(user);

    const res = await request(app)
      .patch('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 401 for incorrect current password', async () => {
    const user = await createTestUser();
    const token = generateToken(user);

    const res = await request(app)
      .patch('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123!'
      });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/:id', () => {
  it('should get public user profile', async () => {
    const user = await createTestUser({ name: 'Public User' });

    const res = await request(app).get(`/api/users/${user._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Public User');
    expect(res.body.data.email).toBeUndefined(); // Should not expose email
  });

  it('should return 404 for non-existent user', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/api/users/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/account', () => {
  it('should delete account with correct password', async () => {
    const user = await createTestUser({ password: 'Password123!' });
    const token = generateToken(user);

    const res = await request(app)
      .delete('/api/users/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify user is deleted
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  it('should return 401 for incorrect password', async () => {
    const user = await createTestUser();
    const token = generateToken(user);

    const res = await request(app)
      .delete('/api/users/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'WrongPassword' });

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Add missing import**

At the top of `server/tests/users/users.test.ts`:

```typescript
import User from '../../src/models/User.model';
```

- [ ] **Step 3: Run all users tests**

```bash
cd server && npm test -- tests/users/users.test.ts
```

Expected: All tests pass

- [ ] **Step 4: Run coverage check**

```bash
cd server && npm run test:coverage
```

Expected: Users module has >80% coverage

- [ ] **Step 5: Commit**

```bash
git add server/tests/users/users.test.ts
git commit -m "test(users): add comprehensive integration tests

Add tests for:
- Profile update (success, unauthorized, validation)
- Password change (success, wrong password)
- Get public profile (success, not found)
- Delete account (success, wrong password)

All tests passing with >80% coverage.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## PHASE 4: Courses Module

### Task 13: Courses Validation Schemas

**Files:**
- Create: `server/src/validations/courses.validation.ts`

- [ ] **Step 1: Create courses validation file**

```typescript
// server/src/validations/courses.validation.ts
import Joi from 'joi';

export const coursesValidation = {
  create: {
    body: Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().min(10).required(),
      price: Joi.number().min(0).required(),
      currency: Joi.string().valid('PKR', 'USD').required(),
      type: Joi.string().valid('one-on-one', 'group').required(),
      level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
      focus: Joi.string().valid('grammar', 'speaking', 'writing', 'listening', 'reading', 'vocabulary').required(),
      totalSessions: Joi.number().min(1).required(),
      sessionDuration: Joi.number().min(30).required(),
      thumbnail: Joi.string().uri().optional()
    })
  },

  update: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object({
      title: Joi.string().min(3).max(200),
      description: Joi.string().min(10),
      price: Joi.number().min(0),
      type: Joi.string().valid('one-on-one', 'group'),
      level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      focus: Joi.string().valid('grammar', 'speaking', 'writing', 'listening', 'reading', 'vocabulary'),
      totalSessions: Joi.number().min(1),
      sessionDuration: Joi.number().min(30),
      thumbnail: Joi.string().uri()
    }).min(1)
  },

  getById: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  },

  list: {
    query: Joi.object({
      level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      type: Joi.string().valid('one-on-one', 'group'),
      focus: Joi.string().valid('grammar', 'speaking', 'writing', 'listening', 'reading', 'vocabulary'),
      minPrice: Joi.number().min(0),
      maxPrice: Joi.number().min(0),
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(20)
    })
  },

  delete: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  },

  publish: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  },

  archive: {
    params: Joi.object({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    })
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/validations/courses.validation.ts
git commit -m "feat(courses): add courses validation schemas

Add Joi validation for course CRUD operations, filtering, and status management.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 14: Courses Service with TDD

**Files:**
- Create: `server/src/services/courses.service.ts`
- Create: `server/tests/courses/courses.test.ts`

- [ ] **Step 1: Write failing test for createCourse**

```typescript
// server/tests/courses/courses.test.ts
import request from 'supertest';
import app from '../../src/app';
import { connectDB, disconnectDB } from '../../src/config/database';
import { createTestUser, createTestCourse, generateToken, clearDatabase } from '../utils/testHelpers';

describe('Courses API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/courses', () => {
    it('should create course for authenticated teacher', async () => {
      const teacher = await createTestUser({ role: 'teacher' });
      const token = generateToken(teacher);

      const courseData = {
        title: 'Advanced Grammar',
        description: 'Learn advanced English grammar concepts',
        price: 5000,
        currency: 'PKR',
        type: 'one-on-one',
        level: 'advanced',
        focus: 'grammar',
        totalSessions: 10,
        sessionDuration: 60
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(courseData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Advanced Grammar');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.teacher.toString()).toBe(teacher._id.toString());
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send({ title: 'Test' });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-teacher users', async () => {
      const student = await createTestUser({ role: 'student' });
      const token = generateToken(student);

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test' });

      expect(res.status).toBe(403);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npm test -- tests/courses/courses.test.ts
```

Expected: FAIL - route not found

- [ ] **Step 3: Create courses service**

```typescript
// server/src/services/courses.service.ts
import Course from '../models/Course.model';
import User from '../models/User.model';
import { ApiError } from '../utils/ApiError';

export const coursesService = {
  /**
   * Create a new course
   */
  createCourse: async (courseData: any, teacherId: string) => {
    // Verify teacher exists and has teacher role
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      throw new ApiError(403, 'Only teachers can create courses', 'FORBIDDEN');
    }

    // Business validation
    if (courseData.totalSessions < 1) {
      throw new ApiError(400, 'Must have at least 1 session', 'INVALID_INPUT');
    }

    if (courseData.price < 0) {
      throw new ApiError(400, 'Price cannot be negative', 'INVALID_INPUT');
    }

    // Create course
    const course = await Course.create({
      ...courseData,
      teacher: teacherId,
      status: 'draft',
      enrolledStudents: []
    });

    return course;
  },

  /**
   * Get all published courses with optional filters
   */
  getAllCourses: async (filters: any) => {
    const query: any = { status: 'published' };

    // Apply filters
    if (filters.level) {
      query.level = filters.level;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.focus) {
      query.focus = filters.focus;
    }

    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = parseInt(filters.minPrice);
      if (filters.maxPrice) query.price.$lte = parseInt(filters.maxPrice);
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .populate('teacher', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(query);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get single course by ID
   */
  getCourseById: async (courseId: string) => {
    const course = await Course.findById(courseId).populate('teacher', 'name email avatar bio');

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    return course;
  },

  /**
   * Get teacher's own courses
   */
  getTeacherCourses: async (teacherId: string) => {
    const courses = await Course.find({ teacher: teacherId })
      .sort({ createdAt: -1 });

    return courses;
  },

  /**
   * Update course
   */
  updateCourse: async (courseId: string, teacherId: string, updates: any) => {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    // Check ownership
    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(403, 'You can only update your own courses', 'FORBIDDEN');
    }

    // Business rules
    if (course.status === 'published' && updates.price) {
      throw new ApiError(409, 'Cannot change price of published course', 'CONFLICT');
    }

    // Apply updates
    Object.assign(course, updates);
    await course.save();

    return course;
  },

  /**
   * Delete course
   */
  deleteCourse: async (courseId: string, teacherId: string) => {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    // Check ownership
    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(403, 'You can only delete your own courses', 'FORBIDDEN');
    }

    // Business rule: can't delete course with enrollments
    if (course.enrolledStudents.length > 0) {
      throw new ApiError(409, 'Cannot delete course with active enrollments', 'CONFLICT');
    }

    await Course.findByIdAndDelete(courseId);

    return { message: 'Course deleted successfully' };
  },

  /**
   * Publish course
   */
  publishCourse: async (courseId: string, teacherId: string) => {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(403, 'You can only publish your own courses', 'FORBIDDEN');
    }

    if (course.status === 'published') {
      throw new ApiError(409, 'Course is already published', 'CONFLICT');
    }

    course.status = 'published';
    await course.save();

    return course;
  },

  /**
   * Archive course
   */
  archiveCourse: async (courseId: string, teacherId: string) => {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(403, 'You can only archive your own courses', 'FORBIDDEN');
    }

    course.status = 'archived';
    await course.save();

    return course;
  }
};
```

- [ ] **Step 4: Create courses controller**

```typescript
// server/src/controllers/courses.controller.ts
import { Request, Response } from 'express';
import { coursesService } from '../services/courses.service';
import { asyncHandler } from '../utils/asyncHandler';

export const coursesController = {
  createCourse: asyncHandler(async (req: Request, res: Response) => {
    const courseData = req.body;
    const teacherId = req.user.id;

    const course = await coursesService.createCourse(courseData, teacherId);

    res.status(201).json({
      success: true,
      data: course
    });
  }),

  getAllCourses: asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await coursesService.getAllCourses(filters);

    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination
    });
  }),

  getCourseById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const course = await coursesService.getCourseById(id);

    res.status(200).json({
      success: true,
      data: course
    });
  }),

  getMyCourseses: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user.id;
    const courses = await coursesService.getTeacherCourses(teacherId);

    res.status(200).json({
      success: true,
      data: courses
    });
  }),

  updateCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const teacherId = req.user.id;

    const course = await coursesService.updateCourse(id, teacherId, updates);

    res.status(200).json({
      success: true,
      data: course
    });
  }),

  deleteCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user.id;

    const result = await coursesService.deleteCourse(id, teacherId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  }),

  publishCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user.id;

    const course = await coursesService.publishCourse(id, teacherId);

    res.status(200).json({
      success: true,
      data: course
    });
  }),

  archiveCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user.id;

    const course = await coursesService.archiveCourse(id, teacherId);

    res.status(200).json({
      success: true,
      data: course
    });
  })
};
```

- [ ] **Step 5: Create courses routes**

```typescript
// server/src/routes/courses.routes.ts
import { Router } from 'express';
import { coursesController } from '../controllers/courses.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { coursesValidation } from '../validations/courses.validation';

const router = Router();

// Public routes
router.get(
  '/',
  validate(coursesValidation.list),
  coursesController.getAllCourses
);

router.get(
  '/:id',
  validate(coursesValidation.getById),
  coursesController.getCourseById
);

// Protected teacher routes
router.post(
  '/',
  authenticate,
  authorize('teacher'),
  validate(coursesValidation.create),
  coursesController.createCourse
);

router.get(
  '/my-courses',
  authenticate,
  authorize('teacher'),
  coursesController.getMyCourseses
);

router.patch(
  '/:id',
  authenticate,
  authorize('teacher'),
  validate(coursesValidation.update),
  coursesController.updateCourse
);

router.delete(
  '/:id',
  authenticate,
  authorize('teacher'),
  validate(coursesValidation.delete),
  coursesController.deleteCourse
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize('teacher'),
  validate(coursesValidation.publish),
  coursesController.publishCourse
);

router.patch(
  '/:id/archive',
  authenticate,
  authorize('teacher'),
  validate(coursesValidation.archive),
  coursesController.archiveCourse
);

export default router;
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd server && npm test -- tests/courses/courses.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/src/services/courses.service.ts server/src/controllers/courses.controller.ts server/src/routes/courses.routes.ts server/tests/courses/courses.test.ts
git commit -m "feat(courses): add courses module with CRUD operations

Add courses service, controller, and routes for:
- Create course (teacher only)
- List published courses (with filters)
- Get course by ID
- Update course (teacher only, own courses)
- Delete course (teacher only, own courses)
- Publish/archive course

Includes basic integration test.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

Due to length constraints, I'll provide the remaining modules (Enrollments, Messages, Payments) in a condensed format. The pattern is identical to Users and Courses modules.

---

## PHASE 5-7: Remaining Modules (Enrollments, Messages, Payments)

### Note on Implementation Pattern

For the remaining modules (Enrollments, Messages, Payments), follow the exact same TDD pattern as Users and Courses:

1. **Create validation schemas** (`validations/<module>.validation.ts`)
2. **Write failing test** for first endpoint
3. **Create service** with business logic
4. **Create controller** with HTTP handlers
5. **Create routes** with middleware
6. **Run test to verify it passes**
7. **Commit**
8. **Repeat for all endpoints**
9. **Add comprehensive integration tests**
10. **Verify 80%+ coverage**
11. **Final commit**

### Task 15-17: Implement Remaining Modules

Follow the same structure as Tasks 10-14 for:

**Task 15: Enrollments Module**
- Validation: enroll, cancel, complete session
- Service: enrollment logic, prevent duplicates, track progress
- Controller: HTTP handlers
- Routes: POST /enrollments, GET /enrollments, PATCH /:id/cancel, etc.
- Tests: enrollment scenarios, authorization checks

**Task 16: Messages Module**
- Validation: send message, mark read
- Service: messaging logic, conversation threads
- Controller: HTTP handlers
- Routes: POST /messages, GET /conversations, etc.
- Tests: messaging scenarios, privacy checks

**Task 17: Payments Module**
- Validation: create payment, verify, refund
- Service: payment processing, earnings calculation
- Controller: HTTP handlers
- Routes: POST /payments/create, POST /payments/verify, etc.
- Tests: payment scenarios, teacher earnings

---

## PHASE 8: Final Integration & Testing

### Task 18: Run Complete Test Suite

**Files:**
- All test files

- [ ] **Step 1: Run all tests**

```bash
cd server && npm test
```

Expected: All tests pass

- [ ] **Step 2: Check coverage**

```bash
cd server && npm run test:coverage
```

Expected: Overall coverage ≥ 80%

- [ ] **Step 3: Fix any failing tests**

If tests fail, debug and fix until all pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: verify all modules pass integration tests

All 6 modules (auth, users, courses, enrollments, messages, payments) passing tests with >80% coverage.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 19: Manual API Testing

**Files:**
- None (manual testing)

- [ ] **Step 1: Start server**

```bash
cd server && npm start
```

- [ ] **Step 2: Test complete user flow**

1. Register as teacher
2. Login
3. Create course
4. Publish course
5. Register as student
6. Enroll in course
7. Send message
8. Create payment

- [ ] **Step 3: Verify all endpoints work**

Document any issues found

- [ ] **Step 4: Stop server**

---

### Task 20: Update Documentation

**Files:**
- Modify: `server/README.md`

- [ ] **Step 1: Update README with new structure**

Add to `server/README.md`:

```markdown
## Architecture

This backend follows a professional MVC (Model-View-Controller) pattern:

### Directory Structure

- `controllers/` - HTTP request handlers
- `services/` - Business logic layer
- `routes/` - API endpoint definitions
- `models/` - Database schemas (Mongoose)
- `middleware/` - Request middleware (auth, validation, etc.)
- `validations/` - Joi validation schemas
- `utils/` - Utility functions
- `config/` - Configuration files

### Modules

- **Auth** - Authentication & authorization
- **Users** - User profile management
- **Courses** - Course CRUD & management
- **Enrollments** - Course enrollments
- **Messages** - Direct messaging
- **Payments** - Payment processing

### API Endpoints

#### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### Users
- `GET /api/users/profile` - Get profile
- `PATCH /api/users/profile` - Update profile
- `PATCH /api/users/change-password` - Change password
- `DELETE /api/users/account` - Delete account
- `GET /api/users/:id` - Get public profile

#### Courses
- `POST /api/courses` - Create course (teacher)
- `GET /api/courses` - List published courses
- `GET /api/courses/:id` - Get course details
- `PATCH /api/courses/:id` - Update course (teacher)
- `DELETE /api/courses/:id` - Delete course (teacher)
- `PATCH /api/courses/:id/publish` - Publish course
- `PATCH /api/courses/:id/archive` - Archive course

(Add similar sections for Enrollments, Messages, Payments)
```

- [ ] **Step 2: Commit documentation**

```bash
git add server/README.md
git commit -m "docs(server): update README with MVC architecture

Document new directory structure, modules, and API endpoints.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 21: Final Cleanup & Review

**Files:**
- All files

- [ ] **Step 1: Remove unused imports**

Review all files and remove any unused imports

- [ ] **Step 2: Check for console.logs**

Remove any debugging console.logs

- [ ] **Step 3: Verify TypeScript strict mode**

Run: `cd server && npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Run linter**

```bash
cd server && npm run lint
```

Fix any linting issues

- [ ] **Step 5: Final test run**

```bash
cd server && npm test
```

Expected: All tests pass

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "refactor(server): complete MVC conversion

Backend successfully converted to professional MVC architecture:
✅ 6 modules fully implemented
✅ All tests passing (>80% coverage)
✅ Clean separation of concerns
✅ Type-safe with TypeScript strict mode
✅ Production-ready

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria Verification

- [ ] All 6 modules implemented (auth, users, courses, enrollments, messages, payments)
- [ ] Controllers contain only HTTP logic
- [ ] Services contain all business logic
- [ ] Routes properly configured with middleware
- [ ] All endpoints validated with Joi
- [ ] 80%+ test coverage
- [ ] All integration tests passing
- [ ] TypeScript strict mode with no errors
- [ ] Clean git history with descriptive commits
- [ ] Documentation updated

---

## Estimated Timeline

- **Phase 1:** Foundation Setup - 1 hour
- **Phase 2:** Auth Migration - 2 hours
- **Phase 3:** Users Module - 3 hours
- **Phase 4:** Courses Module - 4 hours
- **Phase 5:** Enrollments Module - 3 hours
- **Phase 6:** Messages Module - 3 hours
- **Phase 7:** Payments Module - 4 hours
- **Phase 8:** Final Integration - 2 hours

**Total:** ~22 hours (3-4 days)

---

## Next Steps

After completing this plan:
1. Deploy to staging environment
2. Perform end-to-end testing
3. Update API documentation
4. Deploy to production
