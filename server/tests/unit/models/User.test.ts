import mongoose from 'mongoose';
import User from '../../../src/models/User.model';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30000);

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

  it('should not rehash password when updating other fields', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123!',
    });

    const userWithPassword = await User.findById(user._id).select('+password');
    const originalHash = userWithPassword!.password;

    // Update name without changing password
    userWithPassword!.name = 'Updated Name';
    await userWithPassword!.save();

    const updatedUser = await User.findById(user._id).select('+password');
    expect(updatedUser!.name).toBe('Updated Name');
    expect(updatedUser!.password).toBe(originalHash); // Password hash should be unchanged
  });

  it('should throw error when comparing password without selecting password field', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password123!',
    });

    const userWithoutPassword = await User.findById(user._id); // password not selected
    await expect(userWithoutPassword!.comparePassword('Password123!'))
      .rejects
      .toThrow('comparePassword called on document without password field selected');
  });

  it('should reject invalid email format', async () => {
    await expect(User.create({
      name: 'Test User',
      email: 'not-an-email',
      password: 'Password123!',
    })).rejects.toThrow(/Invalid email format/);
  });

  it('should trim and lowercase email', async () => {
    const user = await User.create({
      name: 'Test User',
      email: '  TEST@TEST.COM  ',
      password: 'Password123!',
    });

    expect(user.email).toBe('test@test.com');
  });
});
