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
