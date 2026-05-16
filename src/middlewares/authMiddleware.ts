import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { config } from '../config';
import { errorResponse } from '../common/response';
import { GLOBAL_MESSAGES } from '../common/messages';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: number;
    roles?: string[];
    [key: string]: unknown;
  };
  franchiseFilter?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return errorResponse(res, StatusCodes.UNAUTHORIZED, GLOBAL_MESSAGES.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return errorResponse(res, StatusCodes.UNAUTHORIZED, GLOBAL_MESSAGES.UNAUTHORIZED);
  }

  try {
    const payload = jwt.verify(token, config.jwt.accessSecret);
    if (typeof payload === 'string') {
      throw new Error('Invalid token payload');
    }
    req.user = payload as AuthRequest['user'];
    return next();
  } catch (error) {
    return errorResponse(res, StatusCodes.UNAUTHORIZED, GLOBAL_MESSAGES.UNAUTHORIZED, {
      error,
    });
  }
};







