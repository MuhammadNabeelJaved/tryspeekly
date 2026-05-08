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
