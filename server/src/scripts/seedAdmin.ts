import mongoose from 'mongoose';
import User from '../models/User.model';
import { USER_ROLES } from '../config/constants';
import { connectDatabase } from '../config/database';
import logger from '../services/logger.service';
import env from '../config/env';

const seedAdmin = async () => {
  try {
    await connectDatabase();

    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

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
    logger.error('Failed to seed admin:', error);
    process.exit(1);
  }
};

seedAdmin();
