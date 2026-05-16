import { NextFunction, Response } from 'express';
import { AuthRequest } from './authMiddleware';
import { UserModel } from '../modules/user/model/user.model';
import { ROLES } from '../common/constants';
import { Types } from 'mongoose';

/**
 * Middleware to add franchiseId filter to request for franchise admins
 * Master admin can see all, franchise admin can only see their own data
 */
export const addFranchiseFilter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return next();
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return next();
    }

    // Master admin can see everything (no filter)
    if (user.role === ROLES.MASTER_ADMIN) {
      req.franchiseFilter = undefined;
      return next();
    }

    // Franchise admin can only see their own franchise data
    if (user.role === ROLES.FRANCHISE_ADMIN) {
      // If user is a franchise (isFranchise = true), use their own _id
      // Otherwise, use parentFranchiseId if available
      if (user.isFranchise) {
        req.franchiseFilter = user._id;
      } else if (user.parentId) {
        req.franchiseFilter = user.parentId;
      } else {
        // If no franchise association, they can't see anything
        req.franchiseFilter = new Types.ObjectId('000000000000000000000000');
      }
      return next();
    }

if (user.role === ROLES.STAFF) {
  if ((user as { parentId?: Types.ObjectId }).parentId) {
    req.franchiseFilter = user.parentId;
  } else {
    req.franchiseFilter = new Types.ObjectId('000000000000000000000000');
  }
  return next();
}
    return next();
  } catch (error) {
    return next();
  }
};


