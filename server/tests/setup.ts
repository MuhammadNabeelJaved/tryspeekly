// Test environment setup
process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.CLIENT_URL = 'http://localhost:5173';

// Database
process.env.MONGODB_URI_TEST = 'mongodb://localhost:27017/english-lms-test';

// JWT
process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-characters-long';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

// Cloudinary
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Resend
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.EMAIL_FROM = 'test@example.com';

// Security
process.env.BCRYPT_ROUNDS = '10';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Admin Seed
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'TestAdminPassword123!';
