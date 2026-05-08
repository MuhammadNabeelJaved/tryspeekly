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
    } catch {
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

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  getIO().to(`user:${userId}`).emit(event, data);
};

export const emitToRoom = (roomId: string, event: string, data: unknown): void => {
  getIO().to(roomId).emit(event, data);
};
