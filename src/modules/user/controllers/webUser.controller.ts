import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../services/user.service';
import { successResponse, errorResponse } from '../../../common/response';
import { USER_MESSAGES } from '../messages/message';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { ROLES } from '../../../common/constants';
import { UserModel } from '../model/user.model';
import { Types } from 'mongoose';
import { FileService } from '../../../services/file.service';
import path from 'path';
import fs from 'fs';
import { config } from '../../../config';

export const WebUserController = {
  async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;

      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized access');
      }

      const role = Number((loggedUser as any).role);

      if (role === ROLES.MASTER_ADMIN) {
        // Master admin can create any type of user
        if (req.body.parentFranchiseId && !req.body.parentId) {
          req.body.parentId = req.body.parentFranchiseId;
        }
        const user = await UserService.createUser(req.body);
        res.status(StatusCodes.CREATED);
        return successResponse(res, user, USER_MESSAGES.CREATED);
      } else if (role === ROLES.FRANCHISE_ADMIN) {
        // Franchise admin can only create staff under them
        req.body.parentId = loggedUser._id;
        req.body.role = ROLES.STAFF;
        const user = await UserService.createUser(req.body);
        res.status(StatusCodes.CREATED);
        return successResponse(res, user, USER_MESSAGES.CREATED);
      } else {
        // Staff cannot create users
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to create user', { error });
    }
  },

  async list(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const page = Math.max(1, Number(req.body.page) || 1);
      const limit = Math.max(1, Number(req.body.limit) || 25);
      const loggedUser = req.user;

      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);
      let filter: any = {};

      if (role === ROLES.MASTER_ADMIN) {
        // Master admin can list all users, but default to franchise admins if no specific filter
        filter = req.body.role ? { role: Number(req.body.role) } : { role: ROLES.FRANCHISE_ADMIN };
      } else if (role === ROLES.FRANCHISE_ADMIN) {
        // Franchise admin can only list their own staff
        filter = {
          role: ROLES.STAFF,
          parentId: loggedUser._id
        };
      } else {
        // Staff can only see themselves
        filter = { _id: loggedUser._id };
      }

      // Apply additional filters only for master admin, as others have restricted access
      if (role === ROLES.MASTER_ADMIN) {
        if (req.body.search) {
          const search = String(req.body.search).trim();
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { uniqueCode: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } }
          ];
        }

        if (req.body.isFranchise !== undefined) {
          filter.isFranchise = Boolean(req.body.isFranchise);
        }

        if (req.body.isActive !== undefined) {
          filter.isActive = Boolean(req.body.isActive);
        }

        if (req.body.countryCode) {
          filter.countryCode = Number(req.body.countryCode);
        }

        if (req.body.createdBy && Types.ObjectId.isValid(String(req.body.createdBy))) {
          filter.createdBy = new Types.ObjectId(String(req.body.createdBy));
        }

        if (req.body.fromDate || req.body.toDate) {
          filter.createdAt = {};
          if (req.body.fromDate) filter.createdAt.$gte = new Date(String(req.body.fromDate));
          if (req.body.toDate) filter.createdAt.$lte = new Date(String(req.body.toDate));
          if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
        }
      }

      let sort: any = { createdAt: -1 };
      if (req.body.sortBy) {
        const parts = String(req.body.sortBy).split(':');
        sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
      }

      const pagination = await UserService.paginate(filter, { page, limit, sort });
      return successResponse(res, pagination, USER_MESSAGES.LISTED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list users', { error });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const user = await UserService.findById(req.params.id);
      if (!user) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
      }

      const role = Number((loggedUser as any).role);
      const loggedUserIdStr = String((loggedUser._id as any) ?? '');
      const userIdStr = String((user._id as any) ?? '');
      const parentIdStr = user.parentId ? String((user.parentId as any)) : null;

      if (role === ROLES.MASTER_ADMIN) {
        return successResponse(res, user, 'User retrieved successfully');
      }

      if (role === ROLES.FRANCHISE_ADMIN) {
        const canAccess = userIdStr === loggedUserIdStr || (parentIdStr !== null && parentIdStr === loggedUserIdStr);
        if (!canAccess) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        return successResponse(res, user, 'User retrieved successfully');
      }

      // Staff or other roles can only access themselves
      if (userIdStr === loggedUserIdStr) {
        return successResponse(res, user, 'User retrieved successfully');
      }

      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get user', { error });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);
      const user = await UserService.findById(req.params.id);
      if (!user) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
      }

      // Master admin can access and update all users
      if (role === ROLES.MASTER_ADMIN) {
        if (req.body.parentFranchiseId && !req.body.parentId) {
          req.body.parentId = req.body.parentFranchiseId;
        }
        const updated = await UserService.updateUser(req.params.id, req.body);
        return successResponse(res, updated, USER_MESSAGES.UPDATED);
      }

      // Franchise admin can only update their own staff
      if (role === ROLES.FRANCHISE_ADMIN) {
        const franchiseId = req.franchiseFilter ?? (loggedUser._id as Types.ObjectId);
        const userId = user._id as Types.ObjectId;
        const parentId = user.parentId as Types.ObjectId | null;

        const canAccess = userId.equals(franchiseId) || (parentId && parentId.equals(franchiseId));
        if (!canAccess) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }

        const updatePayload = { ...req.body };
        delete updatePayload.role; // Franchise admin cannot change role
        const updated = await UserService.updateUser(req.params.id, updatePayload);
        return successResponse(res, updated, USER_MESSAGES.UPDATED);
      }

      // Staff can only update themselves
      const loggedUserIdStr = String((loggedUser.id as any) ?? '');
      const targetUserIdStr = String((user._id as any) ?? '');
      if (loggedUserIdStr !== targetUserIdStr) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      const updated = await UserService.updateUser(req.params.id, req.body);
      return successResponse(res, updated, USER_MESSAGES.UPDATED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to update user', { error });
    }
  },

  async remove(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);
      const user = await UserService.findById(req.params.id);
      if (!user) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
      }

      // Master admin can access and delete all users
      if (role === ROLES.MASTER_ADMIN) {
        await UserService.deleteById(req.params.id);
        return successResponse(res, null, USER_MESSAGES.DELETED);
      }

      // Franchise admin can only delete their own staff
      if (role === ROLES.FRANCHISE_ADMIN) {
        const franchiseId = req.franchiseFilter ?? (loggedUser._id as Types.ObjectId);
        const parentId = user.parentId as Types.ObjectId | null;
        const userId = user._id as Types.ObjectId;

        const canAccess = userId.equals(franchiseId) || (parentId && parentId.equals(franchiseId));
        if (!canAccess) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }

        await UserService.deleteById(req.params.id);
        return successResponse(res, null, USER_MESSAGES.DELETED);
      }

      // Staff can only delete themselves
      const loggedUserIdStr = String((loggedUser._id as any) ?? '');
      const targetUserIdStr = String((user._id as any) ?? '');
      if (loggedUserIdStr !== targetUserIdStr) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      await UserService.deleteById(req.params.id);
      return successResponse(res, null, USER_MESSAGES.DELETED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete user', { error });
    }
  },

  async updatePassword(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);
      const user = await UserService.findById(req.body.id);
      if (!user) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
      }

      // Only master admin can update passwords for franchise admins
      if (role !== ROLES.MASTER_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only master admin can update passwords');
      }

      // Only allow updating password for franchise admin users
      if (user.role !== ROLES.FRANCHISE_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Password update is only allowed for franchise admin users');
      }

      if (!req.body.password || req.body.password.trim() === '') {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'Password is required');
      }

      const updated = await UserService.updateUser(req.params.id, { password: req.body.password });
      return successResponse(res, { message: 'Password updated successfully' }, 'Password updated successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to update password', { error });
    }
  },

  async listAll(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;

      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);

      // Only master admin is allowed to list franchise users
      if (role !== ROLES.MASTER_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only master admin can access franchise user list');
      }

      // ONLY FILTER WE KEEP
      const filter = { role: ROLES.FRANCHISE_ADMIN };

      // DEFAULT SORT (optional)
      const sort = { createdAt: -1 };

      const users = await UserService.find(filter, undefined, { sort });
      return successResponse(res, users, USER_MESSAGES.LISTED);

    } catch (error: any) {
      return errorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to list all franchise users',
        { error }
      );
    }
  },

  async getWallet(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const userId = loggedUser._id as Types.ObjectId;
      const userIdStr = String(userId);

      // Users can only access their own wallet
      const requestedUserId = req.query.id as string;
      if (requestedUserId && requestedUserId !== userIdStr) {
        // Check if user has permission to view other users' wallets
        const role = Number((loggedUser as any).role);
        if (role !== ROLES.MASTER_ADMIN && role !== ROLES.FRANCHISE_ADMIN) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        // For admin roles, validate the requested user exists
        if (!Types.ObjectId.isValid(requestedUserId)) {
          return errorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid user id');
        }
        const targetUser = await UserService.findById(requestedUserId);
        if (!targetUser) {
          return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
        }
        // Franchise admin can only access their own staff
        if (role === ROLES.FRANCHISE_ADMIN) {
          const parentIdStr = targetUser.parentId ? String((targetUser.parentId as any)) : null;
          if (parentIdStr !== userIdStr && String((targetUser._id as any)) !== userIdStr) {
            return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
          }
        }
      }

      const targetUserId = requestedUserId && Types.ObjectId.isValid(requestedUserId)
        ? requestedUserId
        : String(userId);

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Number(req.query.limit) || 25);

      // Use UserWalletService
      const { UserWalletService } = await import('../../userWallet/services/userWallet.service');

      const [balance, transactionsData] = await Promise.all([
        UserWalletService.getUserBalance(targetUserId),
        UserWalletService.getUserTransactions(targetUserId, { page, limit, ...req.query }),
      ]);

      // Get user info
      const user = await UserService.findById(targetUserId);

      return successResponse(res, {
        transactions: transactionsData.transactions,
        pagination: transactionsData.pagination,
        currentBalance: balance,
        user: {
          id: user?._id?.toString() ?? null,
          name: user?.name ?? null,
          email: user?.email ?? null,
          address: user?.address ?? null,
        },
      }, 'User wallet retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get user wallet', { error });
    }
  },

  async uploadLogo(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);

      // Only FRANCHISE_ADMIN can upload logo
      if (role !== ROLES.FRANCHISE_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only franchise admin can upload logo');
      }

      if (!req.file) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'No file uploaded');
      }

      const userId = req.params.id || String(loggedUser._id);
      const user = await UserService.findById(userId);

      if (!user) {
        // Delete uploaded file if user not found
        FileService.removeFile(req.file.path);
        return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
      }

      // Check permissions
      if (role === ROLES.FRANCHISE_ADMIN && String(user._id) !== String(loggedUser._id)) {
        FileService.removeFile(req.file.path);
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      // Delete old logo if exists
      if (user.logo) {
        const oldLogoPath = path.join(config.fileUploadPath, path.basename(user.logo));
        FileService.removeFile(oldLogoPath);
      }

      // Save logo path (relative to uploads directory)
      const logoPath = `/uploads/${req.file.filename}`;
      await UserService.updateUser(userId, { logo: logoPath });

      return successResponse(res, { logo: logoPath }, 'Logo uploaded successfully');
    } catch (error: any) {
      if (req.file) {
        FileService.removeFile(req.file.path);
      }
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to upload logo', { error });
    }
  },

  async updateGstNumber(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);

      // Only FRANCHISE_ADMIN can update GST number
      if (role !== ROLES.FRANCHISE_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only franchise admin can update GST number');
      }

      const userId = req.params.id || String(loggedUser._id);
      const user = await UserService.findById(userId);

      if (!user) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
      }

      // Check permissions
      if (role === ROLES.FRANCHISE_ADMIN && String(user._id) !== String(loggedUser._id)) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      const { gstNumber } = req.body;
      if (!gstNumber || typeof gstNumber !== 'string') {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'GST number is required');
      }

      await UserService.updateUser(userId, { gstNumber: gstNumber.trim() });

      return successResponse(res, { gstNumber }, 'GST number updated successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update GST number', { error });
    }
  },

  async deleteLogo(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);

      // Only FRANCHISE_ADMIN can delete logo
      if (role !== ROLES.FRANCHISE_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only franchise admin can delete logo');
      }

      const userId = req.params.id || String(loggedUser._id);
      const user = await UserService.findById(userId);

      if (!user) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
      }

      // Check permissions
      if (role === ROLES.FRANCHISE_ADMIN && String(user._id) !== String(loggedUser._id)) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      if (!user.logo) {
        return errorResponse(res, StatusCodes.BAD_REQUEST, 'No logo to delete');
      }

      // Delete logo file
      const logoPath = path.join(config.fileUploadPath, path.basename(user.logo));
      FileService.removeFile(logoPath);

      // Remove logo from user
      await UserService.updateUser(userId, { logo: null });

      return successResponse(res, null, 'Logo deleted successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete logo', { error });
    }
  }

};

