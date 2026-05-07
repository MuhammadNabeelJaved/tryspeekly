import mongoose from 'mongoose';
import logger from '../services/logger.service';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI_PROD!
      : process.env.NODE_ENV === 'test'
      ? process.env.MONGODB_URI_TEST!
      : process.env.MONGODB_URI_DEV!;

    await mongoose.connect(mongoUri);

    logger.info(`MongoDB connected: ${mongoose.connection.host}`);

    // Register graceful shutdown handler after successful connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
