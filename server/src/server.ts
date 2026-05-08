import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { initializeSocket } from './services/socket.service';
import logger from './services/logger.service';
import env from './config/env';

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
