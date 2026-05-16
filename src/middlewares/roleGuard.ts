import { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthRequest } from './authMiddleware';
import { errorResponse } from '../common/response';
import { GLOBAL_MESSAGES } from '../common/messages';
import { UserModel } from '../modules/user/model/user.model';

export const roleGuard = (roles: number[]) => async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return errorResponse(res, StatusCodes.UNAUTHORIZED, GLOBAL_MESSAGES.UNAUTHORIZED);
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return errorResponse(res, StatusCodes.UNAUTHORIZED, GLOBAL_MESSAGES.UNAUTHORIZED);
    }

    if (!roles.includes(user.role)) {
      return errorResponse(res, StatusCodes.FORBIDDEN, GLOBAL_MESSAGES.FORBIDDEN);
    }

    return next();
  } catch (error) {
    return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, GLOBAL_MESSAGES.SERVER_ERROR, { error });
  }
};







