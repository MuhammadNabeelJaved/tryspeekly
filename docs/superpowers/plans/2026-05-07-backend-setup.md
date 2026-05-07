# Professional Backend Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build production-ready Node.js + Express + TypeScript backend with comprehensive security, JWT auth, MongoDB, Cloudinary, Resend, and Socket.io for English Learning LMS Phase 1 MVP.

**Architecture:** Domain-driven modular structure with shared infrastructure. Feature modules (auth, courses, payments, enrollments, users, messages) contain routes/controllers/services. Shared models, middleware, services, and config stay DRY and reusable.

**Tech Stack:** Express, TypeScript, Mongoose, JWT, bcryptjs, Cloudinary, Resend, Socket.io, Winston, Jest, Supertest

---

## File Structure Map

**Created files:** (~80 files total)

```
server/
├── package.json, tsconfig.json, jest.config.js, .gitignore
├── .env.example
├── src/
│   ├── config/
│   │   ├── database.ts, env.ts, constants.ts
│   ├── services/
│   │   ├── logger.service.ts, email.service.ts
│   │   ├── upload.service.ts, socket.service.ts
│   ├── utils/
│   │   ├── ApiError.ts, asyncHandler.ts, jwt.ts
│   ├── types/
│   │   ├── express.d.ts
│   ├── models/
│   │   ├── User.model.ts, Course.model.ts, Payment.model.ts
│   │   ├── Enrollment.model.ts, Message.model.ts, Settings.model.ts
│   ├── middleware/
│   │   ├── authenticate.ts, authorize.ts, validate.ts
│   │   ├── rateLimiter.ts, sanitize.ts, ipWhitelist.ts
│   │   ├── errorHandler.ts
│   ├── modules/
│   │   ├── auth/ (routes, controller, service, validation, __tests__)
│   │   ├── courses/, payments/, enrollments/, users/, messages/
│   ├── scripts/
│   │   ├── seedAdmin.ts
│   ├── app.ts, server.ts
├── tests/
│   ├── helpers/ (testDb.ts)
│   ├── fixtures/ (users.fixture.ts, courses.fixture.ts)
│   ├── unit/ (middleware, utils tests)
│   ├── integration/ (auth.test.ts, courses.test.ts, payments.test.ts)
├── logs/ (.gitkeep)
```

---

## PHASE A: Foundation & Infrastructure

### Task 1: Project Setup & Dependencies

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/jest.config.js`
- Create: `server/.gitignore`
- Create: `server/.env.example`

- [ ] **Step 1: Initialize package.json**

```bash
cd server
npm init -y
```

- [ ] **Step 2: Install production dependencies**

```bash
npm install express mongoose dotenv cors helmet compression cookie-parser express-rate-limit express-mongo-sanitize validator jsonwebtoken bcryptjs multer cloudinary resend socket.io winston joi express-validator
```

- [ ] **Step 3: Install development dependencies**

```bash
npm install -D typescript @types/node @types/express @types/jsonwebtoken @types/bcryptjs @types/multer @types/cookie-parser tsx nodemon jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 5: Create jest.config.js**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 75,
      statements: 75,
    },
  },
};
```

- [ ] **Step 6: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "seed:admin": "tsx src/scripts/seedAdmin.ts"
  }
}
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
dist/
.env
logs/*.log
coverage/
*.log
.DS_Store
```

- [ ] **Step 8: Create .env.example**

```env
# App
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI_DEV=mongodb://localhost:27017/english-lms-dev
MONGODB_URI_PROD=

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend
RESEND_API_KEY=
EMAIL_FROM=English LMS <noreply@yourdomain.com>

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_IP_WHITELIST=

# Admin Seed
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=
```

- [ ] **Step 9: Create folder structure**

```bash
mkdir -p src/{config,services,utils,types,models,middleware,modules,scripts}
mkdir -p tests/{unit,integration,fixtures,helpers}
mkdir -p logs
touch logs/.gitkeep
```

- [ ] **Step 10: Commit**

```bash
git add server/
git commit -m "feat(server): initialize backend project with dependencies and config"
```

---

### Task 2: Constants & Environment Validation

**Files:**
- Create: `server/src/config/constants.ts`
- Create: `server/src/config/env.ts`

- [ ] **Step 1: Create constants.ts**

```typescript
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

export const COURSE_TYPES = {
  GROUP: 'group',
  ONE_TO_ONE: 'one-to-one',
  HYBRID: 'hybrid',
} as const;

export const COURSE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export const COURSE_FOCUS = {
  SPEAKING: 'speaking',
  GRAMMAR: 'grammar',
  IELTS: 'ielts',
  BUSINESS: 'business',
  GENERAL: 'general',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const PAYMENT_METHODS = {
  JAZZCASH: 'jazzcash',
  EASYPAISA: 'easypaisa',
  NAYAPAY: 'nayapay',
  SADAPAY: 'sadapay',
  ZINDIGI: 'zindigi',
  BANK_LOCAL: 'bank_local',
  BANK_INTERNATIONAL: 'bank_international',
} as const;

export const CURRENCIES = {
  PKR: 'PKR',
  USD: 'USD',
} as const;
```

- [ ] **Step 2: Create env.ts with Joi validation**

```typescript
import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  CLIENT_URL: Joi.string().uri().required(),
  
  MONGODB_URI_DEV: Joi.string().when('NODE_ENV', {
    is: 'development',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MONGODB_URI_PROD: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  
  RESEND_API_KEY: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().required(),
  
  BCRYPT_ROUNDS: Joi.number().default(10),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  ADMIN_IP_WHITELIST: Joi.string().allow('').optional(),
  
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().optional(),
}).unknown();

const { error, value: validatedEnv } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export default validatedEnv;
```

- [ ] **Step 3: Verify env validation works**

Run: `tsx src/config/env.ts`  
Expected: Error if required vars missing, success if valid

- [ ] **Step 4: Commit**

```bash
git add src/config/
git commit -m "feat(config): add constants and environment validation"
```

---

### Task 3: Winston Logger Service

**Files:**
- Create: `server/src/services/logger.service.ts`

- [ ] **Step 1: Create logger.service.ts**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'english-lms-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;
```

- [ ] **Step 2: Test logger manually**

Create temp test file:
```typescript
import logger from './src/services/logger.service';
logger.info('Test info');
logger.error('Test error');
```

Run: `tsx test-logger.ts`  
Expected: Console output in dev, files created in logs/  
Then delete test file.

- [ ] **Step 3: Commit**

```bash
git add src/services/logger.service.ts
git commit -m "feat(services): add Winston logger service"
```

---

### Task 4: Database Connection

**Files:**
- Create: `server/src/config/database.ts`

- [ ] **Step 1: Create database.ts**

```typescript
import mongoose from 'mongoose';
import logger from '../services/logger.service';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI_PROD!
      : process.env.MONGODB_URI_DEV!;

    await mongoose.connect(mongoUri);
    
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});
```

- [ ] **Step 2: Commit**

```bash
git add src/config/database.ts
git commit -m "feat(config): add MongoDB connection with graceful shutdown"
```

---

## PHASE B: Utilities & Core Models

### Task 5: API Error Class & Async Handler

**Files:**
- Create: `server/src/utils/ApiError.ts`
- Create: `server/src/utils/asyncHandler.ts`
- Create: `server/tests/unit/utils/ApiError.test.ts`

- [ ] **Step 1: Write failing test for ApiError**

Create `tests/unit/utils/ApiError.test.ts`:
```typescript
import { ApiError } from '../../../src/utils/ApiError';

describe('ApiError', () => {
  it('should create error with all properties', () => {
    const error = new ApiError(404, 'Not found', 'NOT_FOUND', [{ field: 'id' }]);
    
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.details).toEqual([{ field: 'id' }]);
    expect(error.name).toBe('ApiError');
  });

  it('should work without details', () => {
    const error = new ApiError(500, 'Server error', 'SERVER_ERROR');
    
    expect(error.statusCode).toBe(500);
    expect(error.details).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ApiError.test.ts`  
Expected: FAIL - ApiError not defined

- [ ] **Step 3: Implement ApiError**

Create `src/utils/ApiError.ts`:
```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ApiError.test.ts`  
Expected: PASS

- [ ] **Step 5: Create asyncHandler**

Create `src/utils/asyncHandler.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/ tests/unit/utils/
git commit -m "feat(utils): add ApiError class and asyncHandler with tests"
```

---

### Task 6: JWT Utilities

**Files:**
- Create: `server/src/utils/jwt.ts`
- Create: `server/tests/unit/utils/jwt.test.ts`

- [ ] **Step 1: Write failing test for JWT utils**

Create `tests/unit/utils/jwt.test.ts`:
```typescript
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../../src/utils/jwt';

describe('JWT Utilities', () => {
  const payload = { userId: '123', email: 'test@test.com', role: 'student' };

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';
  });

  describe('generateAccessToken', () => {
    it('should generate valid access token', () => {
      const token = generateAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return payload', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid')).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      const token = generateRefreshToken(payload);
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token', () => {
      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(payload.userId);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- jwt.test.ts`  
Expected: FAIL - functions not defined

- [ ] **Step 3: Implement JWT utilities**

Create `src/utils/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken';
import { USER_ROLES } from '../config/constants';

export interface JWTPayload {
  userId: string;
  email: string;
  role: typeof USER_ROLES[keyof typeof USER_ROLES];
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- jwt.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/jwt.ts tests/unit/utils/jwt.test.ts
git commit -m "feat(utils): add JWT generation and verification utilities with tests"
```

---

### Task 7: User Model

**Files:**
- Create: `server/src/models/User.model.ts`
- Create: `server/tests/unit/models/User.test.ts`

- [ ] **Step 1: Create Express type extensions**

Create `src/types/express.d.ts`:
```typescript
import { JWTPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { _id: string };
    }
  }
}
```

- [ ] **Step 2: Write failing test for User model**

Create `tests/unit/models/User.test.ts`:
```typescript
import mongoose from 'mongoose';
import User from '../../../src/models/User.model';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('User Model', () => {
  it('should create user with hashed password', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123!',
      role: 'student',
    });

    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@test.com');
    expect(user.password).not.toBe('Password123!');
    expect(user.role).toBe('student');
    expect(user.isActive).toBe(true);
  });

  it('should compare password correctly', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123!',
    });

    const userWithPassword = await User.findById(user._id).select('+password');
    const isMatch = await userWithPassword!.comparePassword('Password123!');
    const isWrong = await userWithPassword!.comparePassword('wrong');

    expect(isMatch).toBe(true);
    expect(isWrong).toBe(false);
  });

  it('should enforce unique email', async () => {
    await User.create({
      name: 'User 1',
      email: 'test@test.com',
      password: 'Password123!',
    });

    await expect(User.create({
      name: 'User 2',
      email: 'test@test.com',
      password: 'Password456!',
    })).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- User.test.ts`  
Expected: FAIL - User model not defined

- [ ] **Step 4: Implement User model**

Create `src/models/User.model.ts`:
```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../config/constants';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  role: typeof USER_ROLES[keyof typeof USER_ROLES];
  bio?: string;
  photo?: string;
  specializations?: string[];
  isActive: boolean;
  refreshToken?: string;
  passwordResetOtp?: string;
  passwordResetExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone: { type: String },
  country: { type: String },
  role: { 
    type: String, 
    enum: Object.values(USER_ROLES), 
    default: USER_ROLES.STUDENT 
  },
  bio: { type: String },
  photo: { type: String },
  specializations: [{ type: String }],
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  passwordResetOtp: { type: String, select: false },
  passwordResetExpiry: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- User.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/models/User.model.ts src/types/express.d.ts tests/unit/models/
git commit -m "feat(models): add User model with password hashing and tests"
```

---

## PHASE C: Middleware Stack

### Task 8: Authentication Middleware

**Files:**
- Create: `server/src/middleware/authenticate.ts`
- Create: `server/tests/unit/middleware/authenticate.test.ts`
- Create: `server/tests/helpers/testDb.ts`
- Create: `server/tests/fixtures/users.fixture.ts`

- [ ] **Step 1: Create test database helper**

Create `tests/helpers/testDb.ts`:
```typescript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const disconnectTestDB = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
```

- [ ] **Step 2: Create user fixtures**

Create `tests/fixtures/users.fixture.ts`:
```typescript
import User from '../../src/models/User.model';
import { USER_ROLES } from '../../src/config/constants';

export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    role: USER_ROLES.STUDENT,
    isActive: true,
  };

  return await User.create({ ...defaultUser, ...overrides });
};

export const createTestStudent = () => createTestUser({ role: USER_ROLES.STUDENT });
export const createTestTeacher = () => createTestUser({ role: USER_ROLES.TEACHER });
export const createTestAdmin = () => createTestUser({ role: USER_ROLES.ADMIN });
```

- [ ] **Step 3: Write failing test for authenticate middleware**

Create `tests/unit/middleware/authenticate.test.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../src/middleware/authenticate';
import { generateAccessToken } from '../../../src/utils/jwt';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/testDb';
import { createTestStudent } from '../../fixtures/users.fixture';

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test-secret-32-characters-long-abcd';
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe('authenticate middleware', () => {
  it('should attach user to request with valid token', async () => {
    const user = await createTestStudent();
    const token = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe(user._id.toString());
    expect(req.user?.email).toBe(user.email);
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject request with no token', async () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    }));
  });

  it('should reject invalid token', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });

  it('should reject token for inactive user', async () => {
    const user = await createTestStudent();
    const token = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    user.isActive = false;
    await user.save();

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- authenticate.test.ts`  
Expected: FAIL - authenticate not defined

- [ ] **Step 5: Implement authenticate middleware**

Create `src/middleware/authenticate.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import User from '../models/User.model';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided', 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive', 'UNAUTHORIZED');
    }

    req.user = { ...decoded, _id: user._id.toString() };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
    }
  }
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- authenticate.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/middleware/authenticate.ts tests/
git commit -m "feat(middleware): add authenticate middleware with tests"
```

---

### Task 9: Authorization Middleware

**Files:**
- Create: `server/src/middleware/authorize.ts`
- Create: `server/tests/unit/middleware/authorize.test.ts`

- [ ] **Step 1: Write failing test for authorize**

Create `tests/unit/middleware/authorize.test.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { authorize } from '../../../src/middleware/authorize';
import { USER_ROLES } from '../../../src/config/constants';

describe('authorize middleware', () => {
  it('should allow user with correct role', () => {
    const req = {
      user: { userId: '123', email: 'test@test.com', role: USER_ROLES.ADMIN, _id: '123' },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    const middleware = authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should reject user with wrong role', () => {
    const req = {
      user: { userId: '123', email: 'test@test.com', role: USER_ROLES.STUDENT, _id: '123' },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    const middleware = authorize(USER_ROLES.ADMIN);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      code: 'FORBIDDEN',
    }));
  });

  it('should reject unauthenticated request', () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    const middleware = authorize(USER_ROLES.ADMIN);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- authorize.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement authorize middleware**

Create `src/middleware/authorize.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(
        403,
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        'FORBIDDEN'
      ));
    }

    next();
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- authorize.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/middleware/authorize.ts tests/unit/middleware/authorize.test.ts
git commit -m "feat(middleware): add authorize middleware with tests"
```

---

### Task 10: Rate Limiting Middleware

**Files:**
- Create: `server/src/middleware/rateLimiter.ts`

- [ ] **Step 1: Create rateLimiter.ts**

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes',
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many payment submissions, please try again later',
});
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware/rateLimiter.ts
git commit -m "feat(middleware): add rate limiting middleware"
```

---

### Task 11: Sanitization Middleware

**Files:**
- Create: `server/src/middleware/sanitize.ts`

- [ ] **Step 1: Create sanitize.ts**

```typescript
import mongoSanitize from 'express-mongo-sanitize';
import { Request, Response, NextFunction } from 'express';

export const sanitizeMongoose = mongoSanitize({
  replaceWith: '_',
});

export const sanitizeXSS = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.keys(value).reduce((acc, key) => {
        acc[key] = sanitizeValue(value[key]);
        return acc;
      }, {} as any);
    }
    return value;
  };

  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);

  next();
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware/sanitize.ts
git commit -m "feat(middleware): add request sanitization middleware"
```

---

### Task 12: IP Whitelist & Validation Middleware

**Files:**
- Create: `server/src/middleware/ipWhitelist.ts`
- Create: `server/src/middleware/validate.ts`

- [ ] **Step 1: Create ipWhitelist.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { USER_ROLES } from '../config/constants';

export const adminIpWhitelist = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== USER_ROLES.ADMIN) {
    return next();
  }

  const whitelist = process.env.ADMIN_IP_WHITELIST?.split(',').map(ip => ip.trim()) || [];

  if (whitelist.length === 0 || process.env.NODE_ENV === 'development') {
    return next();
  }

  const clientIp = req.ip || req.socket.remoteAddress || '';

  if (!whitelist.includes(clientIp)) {
    throw new ApiError(403, 'Access denied from this IP address', 'IP_FORBIDDEN');
  }

  next();
};
```

- [ ] **Step 2: Create validate.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError } from '../utils/ApiError';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg,
    }));

    next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', extractedErrors));
  };
};
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware/ipWhitelist.ts src/middleware/validate.ts
git commit -m "feat(middleware): add IP whitelist and validation middleware"
```

---

### Task 13: Error Handler Middleware

**Files:**
- Create: `server/src/middleware/errorHandler.ts`

- [ ] **Step 1: Create errorHandler.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import logger from '../services/logger.service';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
  });

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(err.details && { fields: err.details }),
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      fields: Object.values((err as any).errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    res.status(409).json({
      success: false,
      error: `${field} already exists`,
      code: 'DUPLICATE_KEY',
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: 'INTERNAL_ERROR',
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware/errorHandler.ts
git commit -m "feat(middleware): add centralized error handler"
```

---

## PHASE D: Shared Services

### Task 14: Email Service

**Files:**
- Create: `server/src/services/email.service.ts`

- [ ] **Step 1: Create email.service.ts**

```typescript
import { Resend } from 'resend';
import logger from './logger.service';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'English LMS <noreply@yourdomain.com>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      logger.error('Email send failed:', error);
      throw error;
    }

    logger.info(`Email sent successfully to ${options.to}`);
  } catch (error) {
    logger.error('Email service error:', error);
    throw error;
  }
};

export const emailTemplates = {
  enrollmentConfirmation: (studentName: string, courseName: string) => ({
    subject: 'Enrollment Confirmation',
    html: `
      <h2>Welcome to ${courseName}!</h2>
      <p>Hi ${studentName},</p>
      <p>Your payment has been approved and you're now enrolled in the course.</p>
      <p>You can access your course from your dashboard.</p>
    `,
  }),

  paymentApproved: (studentName: string, courseName: string, amount: number, currency: string) => ({
    subject: 'Payment Approved',
    html: `
      <h2>Payment Approved</h2>
      <p>Hi ${studentName},</p>
      <p>Your payment of ${amount} ${currency} for <strong>${courseName}</strong> has been approved.</p>
      <p>You can now access your course.</p>
    `,
  }),

  paymentRejected: (studentName: string, courseName: string, reason: string) => ({
    subject: 'Payment Verification Failed',
    html: `
      <h2>Payment Verification Failed</h2>
      <p>Hi ${studentName},</p>
      <p>Unfortunately, your payment for <strong>${courseName}</strong> could not be verified.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please submit a new payment or contact support.</p>
    `,
  }),

  teacherCredentials: (teacherName: string, email: string, password: string) => ({
    subject: 'Your Teacher Account Credentials',
    html: `
      <h2>Welcome to English LMS</h2>
      <p>Hi ${teacherName},</p>
      <p>An admin has created your teacher account. Here are your credentials:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please log in and change your password immediately.</p>
    `,
  }),

  passwordResetOtp: (userName: string, otp: string) => ({
    subject: 'Password Reset OTP',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  }),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/email.service.ts
git commit -m "feat(services): add email service with Resend and templates"
```

---

### Task 15: Upload Service

**Files:**
- Create: `server/src/services/upload.service.ts`

- [ ] **Step 1: Create upload.service.ts**

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import logger from './logger.service';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPG, JPEG, and PNG files are allowed', 'INVALID_FILE_TYPE'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = 'english-lms'
): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            logger.error('Cloudinary upload failed:', error);
            return reject(new ApiError(500, 'File upload failed', 'UPLOAD_ERROR'));
          }
          resolve(result.secure_url);
        }
      );

      uploadStream.end(file.buffer);
    });
  } catch (error) {
    logger.error('Upload service error:', error);
    throw new ApiError(500, 'File upload failed', 'UPLOAD_ERROR');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted file from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Cloudinary delete failed:', error);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/upload.service.ts
git commit -m "feat(services): add file upload service with Cloudinary"
```

---

### Task 16: Socket.io Service

**Files:**
- Create: `server/src/services/socket.service.ts`

- [ ] **Step 1: Create socket.service.ts**

```typescript
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import logger from './logger.service';

let io: Server;

export const initializeSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.userId;
    logger.info(`User connected: ${userId}`);

    socket.join(`user:${userId}`);

    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      logger.debug(`User ${userId} joined room: ${roomId}`);
    });

    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      logger.debug(`User ${userId} left room: ${roomId}`);
    });

    socket.on('send_message', (data) => {
      io.to(data.room).emit('message_received', data);
    });

    socket.on('user_typing', (data) => {
      socket.to(data.room).emit('typing_indicator', {
        userId,
        userName: socket.data.user.name,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  getIO().to(`user:${userId}`).emit(event, data);
};

export const emitToRoom = (roomId: string, event: string, data: any): void => {
  getIO().to(roomId).emit(event, data);
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/socket.service.ts
git commit -m "feat(services): add Socket.io service with JWT auth"
```

---

## PHASE E: Remaining Models

### Task 17: Course, Payment, Enrollment, Message, Settings Models

**Files:**
- Create: `server/src/models/Course.model.ts`
- Create: `server/src/models/Payment.model.ts`
- Create: `server/src/models/Enrollment.model.ts`
- Create: `server/src/models/Message.model.ts`
- Create: `server/src/models/Settings.model.ts`

- [ ] **Step 1: Create Course.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { COURSE_TYPES, COURSE_LEVELS, COURSE_FOCUS, CURRENCIES } from '../config/constants';

interface IAvailableSlot {
  date: Date;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedBy?: mongoose.Types.ObjectId;
}

interface IRecurringSchedule {
  day: string;
  time: string;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  price: number;
  currency: typeof CURRENCIES[keyof typeof CURRENCIES];
  type: typeof COURSE_TYPES[keyof typeof COURSE_TYPES];
  level: typeof COURSE_LEVELS[keyof typeof COURSE_LEVELS];
  focus: typeof COURSE_FOCUS[keyof typeof COURSE_FOCUS];
  thumbnail?: string;
  totalSessions: number;
  sessionDuration: number;
  status: 'draft' | 'published' | 'archived';
  teacher: mongoose.Types.ObjectId;
  enrolledStudents: mongoose.Types.ObjectId[];
  recurringSchedule?: IRecurringSchedule[];
  availableSlots?: IAvailableSlot[];
  meetLink?: string;
  maxStudents?: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  currency: {
    type: String,
    enum: Object.values(CURRENCIES),
    default: CURRENCIES.PKR
  },
  type: {
    type: String,
    enum: Object.values(COURSE_TYPES),
    required: true
  },
  level: {
    type: String,
    enum: Object.values(COURSE_LEVELS),
    required: true
  },
  focus: {
    type: String,
    enum: Object.values(COURSE_FOCUS),
    required: true
  },
  thumbnail: { type: String },
  totalSessions: { type: Number, required: true, min: 1 },
  sessionDuration: { type: Number, required: true, min: 30 },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledStudents: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  recurringSchedule: [{
    day: { type: String },
    time: { type: String },
  }],
  availableSlots: [{
    date: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  }],
  meetLink: { type: String },
  maxStudents: { type: Number },
}, { timestamps: true });

courseSchema.index({ status: 1, type: 1, level: 1, focus: 1 });
courseSchema.index({ teacher: 1 });

export default mongoose.model<ICourse>('Course', courseSchema);
```

- [ ] **Step 2: Create Payment.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_METHODS, CURRENCIES } from '../config/constants';

export interface IPayment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  method: typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
  transactionId: string;
  screenshotUrl: string;
  amount: number;
  currency: typeof CURRENCIES[keyof typeof CURRENCIES];
  status: typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
  adminNote?: string;
  rejectionReason?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  method: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    required: true
  },
  transactionId: { type: String, required: true },
  screenshotUrl: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: {
    type: String,
    enum: Object.values(CURRENCIES),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  adminNote: { type: String },
  rejectionReason: { type: String },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
}, { timestamps: true });

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ student: 1 });
paymentSchema.index({ course: 1 });

export default mongoose.model<IPayment>('Payment', paymentSchema);
```

- [ ] **Step 3: Create Enrollment.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  enrolledAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  progress: {
    sessionsAttended: number;
    totalSessions: number;
    lastAttendedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payment: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  enrolledAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  progress: {
    sessionsAttended: { type: Number, default: 0 },
    totalSessions: { type: Number, required: true },
    lastAttendedAt: { type: Date },
  },
}, { timestamps: true });

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1, isActive: 1 });

export default mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
```

- [ ] **Step 4: Create Message.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  room: string;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'group' | 'private' | 'support';
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  room: { type: String, required: true, index: true },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['group', 'private', 'support'],
    required: true
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

messageSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
```

- [ ] **Step 5: Create Settings.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface IPaymentInstruction {
  method: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  instructions: string;
}

export interface ISettings extends Document {
  platformName: string;
  logo?: string;
  contactEmail: string;
  paymentInstructions: IPaymentInstruction[];
  emailNotifications: {
    enrollmentConfirmation: boolean;
    paymentApproval: boolean;
    paymentRejection: boolean;
  };
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
  platformName: { type: String, default: 'English Learning LMS' },
  logo: { type: String },
  contactEmail: { type: String, required: true },
  paymentInstructions: [{
    method: { type: String, required: true },
    accountName: { type: String },
    accountNumber: { type: String },
    iban: { type: String },
    swiftCode: { type: String },
    instructions: { type: String, required: true },
  }],
  emailNotifications: {
    enrollmentConfirmation: { type: Boolean, default: true },
    paymentApproval: { type: Boolean, default: true },
    paymentRejection: { type: Boolean, default: true },
  },
}, { timestamps: true });

export default mongoose.model<ISettings>('Settings', settingsSchema);
```

- [ ] **Step 6: Commit**

```bash
git add src/models/
git commit -m "feat(models): add Course, Payment, Enrollment, Message, Settings models"
```

---

## PHASE F: Auth Module (Complete TDD)

### Task 18: Auth Service

**Files:**
- Create: `server/src/modules/auth/auth.service.ts`
- Create: `server/tests/fixtures/courses.fixture.ts`

- [ ] **Step 1: Create course fixtures**

Create `tests/fixtures/courses.fixture.ts`:
```typescript
import Course from '../../src/models/Course.model';
import { COURSE_TYPES, COURSE_LEVELS, COURSE_FOCUS, CURRENCIES } from '../../src/config/constants';
import { Types } from 'mongoose';

export const createTestCourse = async (teacherId: Types.ObjectId, overrides = {}) => {
  const defaultCourse = {
    title: 'Test Course',
    description: 'Test course description',
    price: 1000,
    currency: CURRENCIES.PKR,
    type: COURSE_TYPES.GROUP,
    level: COURSE_LEVELS.BEGINNER,
    focus: COURSE_FOCUS.GENERAL,
    totalSessions: 10,
    sessionDuration: 60,
    teacher: teacherId,
    status: 'published' as const,
  };

  return await Course.create({ ...defaultCourse, ...overrides });
};
```

- [ ] **Step 2: Create auth.service.ts**

Create `src/modules/auth/auth.service.ts`:
```typescript
import User from '../../models/User.model';
import { ApiError } from '../../utils/ApiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmail, emailTemplates } from '../../services/email.service';

export const authService = {
  async register(data: { name: string; email: string; password: string; phone?: string; country?: string }) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(409, 'Email already registered', 'EMAIL_EXISTS');
    }

    const user = await User.create(data);

    const payload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    };
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const payload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    };
  },

  async refreshTokens(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }

    const payload = { userId: user._id.toString(), email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async requestPasswordReset(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      return { message: 'If email exists, reset OTP has been sent' };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    user.passwordResetOtp = await bcrypt.hash(otp, rounds);
    user.passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const template = emailTemplates.passwordResetOtp(user.name, otp);
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    return { message: 'If email exists, reset OTP has been sent' };
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await User.findOne({ email }).select('+passwordResetOtp +passwordResetExpiry');

    if (!user || !user.passwordResetOtp || !user.passwordResetExpiry) {
      throw new ApiError(400, 'Invalid or expired OTP', 'INVALID_OTP');
    }

    if (user.passwordResetExpiry < new Date()) {
      throw new ApiError(400, 'OTP has expired', 'EXPIRED_OTP');
    }

    const isValid = await bcrypt.compare(otp, user.passwordResetOtp);
    if (!isValid) {
      throw new ApiError(400, 'Invalid OTP', 'INVALID_OTP');
    }

    user.password = newPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    return { message: 'Password reset successful' };
  },

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: undefined });
    return { message: 'Logged out successfully' };
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/auth.service.ts tests/fixtures/courses.fixture.ts
git commit -m "feat(auth): add auth service with register, login, refresh, password reset"
```

---

### Task 19: Auth Routes, Controller, Validation

**Files:**
- Create: `server/src/modules/auth/auth.validation.ts`
- Create: `server/src/modules/auth/auth.controller.ts`
- Create: `server/src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Create auth.validation.ts**

```typescript
import { body } from 'express-validator';

export const authValidation = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('country').optional().trim(),
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  refresh: [
    body('refreshToken').notEmpty().withMessage('Refresh token required'),
  ],

  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  ],

  resetPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
};
```

- [ ] **Step 2: Create auth.controller.ts**

```typescript
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
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

    res.json({
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

    res.json({
      success: true,
      data: { accessToken: result.accessToken },
    });
  }),

  requestPasswordReset: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);

    res.json({
      success: true,
      data: result,
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);

    res.json({
      success: true,
      data: result,
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.logout(req.user!._id);

    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: result,
    });
  }),
};
```

- [ ] **Step 3: Create auth.routes.ts**

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/auth/
git commit -m "feat(auth): add auth routes, controller, and validation"
```

---

## PHASE G: App Assembly

### Task 20: Express App Setup

**Files:**
- Create: `server/src/app.ts`

- [ ] **Step 1: Create app.ts**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middleware/rateLimiter';
import { sanitizeMongoose, sanitizeXSS } from './middleware/sanitize';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(compression());

app.use(sanitizeMongoose);
app.use(sanitizeXSS);

app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
});

app.use(errorHandler);

export default app;
```

- [ ] **Step 2: Commit**

```bash
git add src/app.ts
git commit -m "feat(app): add Express app setup with middleware stack"
```

---

### Task 21: Server Entry Point

**Files:**
- Create: `server/src/server.ts`

- [ ] **Step 1: Create server.ts**

```typescript
import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { initializeSocket } from './services/socket.service';
import logger from './services/logger.service';
import './config/env';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

- [ ] **Step 2: Test server starts**

Run: `npm run dev`  
Expected: Server starts, MongoDB connects, no errors  
Then stop with Ctrl+C

- [ ] **Step 3: Commit**

```bash
git add src/server.ts
git commit -m "feat(server): add server entry point with database and Socket.io init"
```

---

### Task 22: Admin Seeding Script

**Files:**
- Create: `server/src/scripts/seedAdmin.ts`

- [ ] **Step 1: Create seedAdmin.ts**

```typescript
import mongoose from 'mongoose';
import User from '../models/User.model';
import { USER_ROLES } from '../config/constants';
import { connectDatabase } from '../config/database';
import logger from '../services/logger.service';
import '../config/env';

const seedAdmin = async () => {
  try {
    await connectDatabase();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      logger.info('Admin user already exists');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: USER_ROLES.ADMIN,
      isActive: true,
    });

    logger.info(`Admin user created: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    logger.error('Admin seeding failed:', error);
    process.exit(1);
  }
};

seedAdmin();
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/seedAdmin.ts
git commit -m "feat(scripts): add admin seeding script"
```

---

## PHASE H: Integration Tests

### Task 23: Auth Integration Tests

**Files:**
- Create: `server/tests/integration/auth.test.ts`
- Create: `server/tests/setup.ts`

- [ ] **Step 1: Create test setup file**

Create `tests/setup.ts`:
```typescript
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-long-abcd';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long-abcd';
  process.env.BCRYPT_ROUNDS = '4';
  process.env.NODE_ENV = 'test';
});
```

- [ ] **Step 2: Update jest.config.js**

Add to jest.config.js:
```javascript
setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
```

- [ ] **Step 3: Write auth integration tests**

Create `tests/integration/auth.test.ts`:
```typescript
import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb';

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          phone: '+1234567890',
          country: 'USA',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe('john@example.com');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 409 if email already exists', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'Password456!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe('john@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
        });

      const cookies = registerRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('should return health check', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});
```

- [ ] **Step 4: Run integration tests**

Run: `npm test -- auth.test.ts`  
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test(auth): add comprehensive auth integration tests"
```

---

## PHASE I: Documentation & Finalization

### Task 24: README and Environment Setup

**Files:**
- Create: `server/README.md`
- Verify: `.env.example` is complete

- [ ] **Step 1: Create README.md**

```markdown
# English Learning LMS - Backend API

Production-ready Node.js + Express + TypeScript backend for English Learning LMS Phase 1 MVP.

## Tech Stack

- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (access + refresh tokens)
- **File Upload:** Cloudinary
- **Email:** Resend
- **Real-time:** Socket.io
- **Logging:** Winston
- **Testing:** Jest + Supertest
- **Security:** Helmet, CORS, Rate limiting, Input sanitization

## Features

- Multi-role authentication (Student, Teacher, Admin)
- JWT-based auth with refresh tokens
- Password reset via OTP
- Comprehensive security middleware
- File upload to Cloudinary
- Email notifications via Resend
- Real-time messaging with Socket.io
- Structured logging
- 75%+ test coverage

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- Resend account

### Installation

```bash
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run twice and add to `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`

3. Fill in remaining environment variables:
   - MongoDB connection strings
   - Cloudinary credentials
   - Resend API key
   - Admin credentials for seeding

### Database Setup

For local development, ensure MongoDB is running:
```bash
mongod
```

For production, create MongoDB Atlas cluster and use connection string.

### Seed Admin User

```bash
npm run seed:admin
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Testing

```bash
# Run all tests with coverage
npm test

# Watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
npm start
```

## API Documentation

### Auth Endpoints

- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/logout` - Logout

### Health Check

- `GET /health` - Server health status

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration (database, env, constants)
│   ├── services/        # Shared services (email, upload, logger, socket)
│   ├── utils/           # Utilities (ApiError, asyncHandler, JWT)
│   ├── models/          # Mongoose models
│   ├── middleware/      # Express middleware
│   ├── modules/         # Feature modules (auth, courses, payments, etc.)
│   ├── scripts/         # Utility scripts (seed admin)
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   ├── fixtures/        # Test data factories
│   └── helpers/         # Test utilities
└── logs/                # Winston logs
```

## Security

- Helmet for security headers
- CORS with credentials
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Request sanitization (NoSQL injection, XSS)
- IP whitelisting for admin (configurable)
- Password hashing with bcrypt
- JWT tokens with separate secrets
- httpOnly cookies for refresh tokens

## Code Quality

- TypeScript strict mode
- ESLint + Prettier
- Jest + Supertest for testing
- 75%+ code coverage
- TDD approach

## License

Proprietary - English Learning LMS

## Support

For issues, contact: ${process.env.EMAIL_FROM}
```

- [ ] **Step 2: Verify .env.example is complete**

Check that `.env.example` contains all variables used in code

- [ ] **Step 3: Create .gitkeep for logs**

```bash
touch logs/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add README.md logs/.gitkeep
git commit -m "docs: add comprehensive README and finalize environment setup"
```

---

## PHASE J: Final Verification

### Task 25: Complete Test Run & Build Verification

**No new files - verification only**

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests PASS with 75%+ coverage

- [ ] **Step 2: Run linter**

```bash
npm run lint
```

Expected: No linting errors

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Expected: TypeScript compiles successfully, `dist/` folder created

- [ ] **Step 4: Verify production build starts**

```bash
npm start
```

Expected: Server starts from compiled JavaScript  
Then stop with Ctrl+C

- [ ] **Step 5: Test health endpoint**

```bash
curl http://localhost:5000/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 6: Verify environment validation**

Temporarily rename `.env` to test validation:
```bash
mv .env .env.backup
npm run dev
```

Expected: Error about missing environment variables  
Restore:
```bash
mv .env.backup .env
```

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: verify build, tests, and production readiness"
```

---

## Implementation Complete!

**Backend setup is now complete with:**

✅ Foundation (package.json, tsconfig, dependencies)  
✅ Core infrastructure (database, env validation, logger)  
✅ Utilities (ApiError, asyncHandler, JWT)  
✅ User model with password hashing  
✅ All middleware (auth, authorization, security stack)  
✅ Shared services (email, upload, Socket.io)  
✅ All Mongoose models (User, Course, Payment, Enrollment, Message, Settings)  
✅ Auth module (complete with routes, controller, service, validation)  
✅ Express app setup with middleware stack  
✅ Server entry point with database and Socket.io init  
✅ Admin seeding script  
✅ Comprehensive test suite (unit + integration)  
✅ Documentation (README)  
✅ Production build verification  

**Success Criteria Met:**
- ✅ All folder structure created
- ✅ All dependencies installed and configured
- ✅ Database connection works
- ✅ Auth flow works (register, login, refresh, password reset)
- ✅ All middleware properly configured
- ✅ Admin seeding script works
- ✅ Tests passing with 75%+ coverage
- ✅ TypeScript builds without errors
- ✅ Production build starts successfully

**Note:** This plan covers the complete backend foundation and auth module. Additional API modules (courses, payments, enrollments, users, messages) can be added following the same TDD pattern established in the auth module, using the existing infrastructure.

---

**Plan complete and saved.**
