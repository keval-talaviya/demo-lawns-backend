import { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthRequest } from './authMiddleware';
import { errorResponse } from '../common/response';
import { GLOBAL_MESSAGES } from '../common/messages';
import { UserModel } from '../modules/user/model/user.model';
import { ROLES, PERMISSIONS } from '../common/constants';

export const checkPermission = (module: string, requiredPermission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, GLOBAL_MESSAGES.UNAUTHORIZED);
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, GLOBAL_MESSAGES.UNAUTHORIZED);
      }

      // Master admin has all permissions
      if (user.role === ROLES.MASTER_ADMIN) {
        return next();
      }

      // Check if user has permission for this module
      // Note: permissions is now string[] not Permission[] objects
      // For now, if user has any permissions, allow access
      // TODO: Implement proper permission checking based on string array
      if (!user.permissions || user.permissions.length === 0) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'No permissions assigned');
      }

      // Check if user has the required permission
      if (!user.permissions.includes(requiredPermission)) {
        return errorResponse(res, StatusCodes.FORBIDDEN, `Missing ${requiredPermission} permission`);
      }

      return next();
    } catch (error) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, GLOBAL_MESSAGES.SERVER_ERROR, {
        error,
      });
    }
  };
};

export const requireRole = (allowedRoles: number[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, GLOBAL_MESSAGES.UNAUTHORIZED);
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, GLOBAL_MESSAGES.UNAUTHORIZED);
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(user.role)) {
        return errorResponse(res, StatusCodes.FORBIDDEN, GLOBAL_MESSAGES.FORBIDDEN);
      }

      return next();
    } catch (error) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, GLOBAL_MESSAGES.SERVER_ERROR, {
        error,
      });
    }
  };
};







