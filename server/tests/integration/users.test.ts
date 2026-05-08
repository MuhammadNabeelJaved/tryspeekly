import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb';
import User from '../../src/models/User.model';
import { generateAccessToken } from '../../src/utils/jwt';

describe('Users API Integration Tests', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await connectTestDB();
  }, 120000);

  afterAll(async () => {
    await disconnectTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();

    // Create a test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'student',
    });

    userId = user._id.toString();
    accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.name).toBe('Test User');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/users/profile', () => {
    it('should update user profile for authenticated user', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Name',
          bio: 'Updated bio',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.bio).toBe('Updated bio');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .send({
          name: 'Updated Name',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for empty update', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/users/change-password', () => {
    it('should change password for authenticated user', async () => {
      const res = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Password changed successfully');
    });

    it('should return 401 for wrong current password', async () => {
      const res = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Current password is incorrect');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/users/change-password')
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return public user profile for authenticated user', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test User');
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get(`/api/users/${userId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/account', () => {
    it('should delete account for authenticated user', async () => {
      const res = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Account deleted successfully');

      // Verify user is soft deleted (isActive = false)
      const user = await User.findById(userId);
      expect(user).not.toBeNull();
      expect(user?.isActive).toBe(false);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Password is incorrect');

      // Verify user is NOT deleted
      const user = await User.findById(userId);
      expect(user).not.toBeNull();
      expect(user?.isActive).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .delete('/api/users/account')
        .send({
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
