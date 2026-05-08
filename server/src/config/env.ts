import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  CLIENT_URL: Joi.string().uri().default('http://localhost:5173'),

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
  MONGODB_URI_TEST: Joi.string().when('NODE_ENV', {
    is: 'test',
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
  EMAIL_FROM: Joi.string().required(),

  BCRYPT_ROUNDS: Joi.number().default(10),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  ADMIN_IP_WHITELIST: Joi.string().allow('').optional(),

  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().min(12).optional(),
}).unknown();

const { error, value: validatedEnv } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  CLIENT_URL: string;
  MONGODB_URI_DEV?: string;
  MONGODB_URI_PROD?: string;
  MONGODB_URI_TEST?: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  BCRYPT_ROUNDS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  ADMIN_IP_WHITELIST?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

export default validatedEnv as Env;
