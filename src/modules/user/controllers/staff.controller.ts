import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from '../services/user.service';
import { successResponse, errorResponse } from '../../../common/response';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { ROLES } from '../../../common/constants';
import { UserModel } from '../model/user.model';
import { Types } from 'mongoose';

function toObjectIdOrNull(id?: string | Types.ObjectId | null): Types.ObjectId | null {
  if (!id) return null;
  if (Types.ObjectId.isValid(id as any)) return new Types.ObjectId(id);
  return null;
}

export const StaffController = {
  async createStaff(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;

      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized access');
      }

      const role = Number((loggedUser as any).role);
      let franchiseId: Types.ObjectId | null = null;

      if (role === ROLES.MASTER_ADMIN) {
        if (!req.body.franchiseId) {
          return errorResponse(res, StatusCodes.BAD_REQUEST, 'Franchise ID is required for master admin');
        }
        franchiseId = toObjectIdOrNull(req.body.franchiseId);
      } else if (role === ROLES.FRANCHISE_ADMIN) {
        franchiseId = toObjectIdOrNull(loggedUser.id as any);
      } else {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only master admin or franchise admin can create staff');
      }

      const existingStaff = await UserModel.findOne({
        email: req.body.email,
        parentId: franchiseId,
        isDeleted: false,
      });

      if (existingStaff) {
        return errorResponse(res, StatusCodes.CONFLICT, 'Staff with this email already exists in this franchise');
      }

      const staffPayload = {
        ...req.body,
        parentId: franchiseId,
        role: ROLES.STAFF,
        createdBy: toObjectIdOrNull(loggedUser.id as any),
      };

      const staff = await UserService.createUser(staffPayload);
      res.status(StatusCodes.CREATED);
      return successResponse(res, staff, 'Staff created successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to create staff', { error });
    }
  },

  async listStaff(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, Number(req.body.page) || 1);
      const limit = Math.max(1, Number(req.body.limit) || 25);
      const loggedUser = req.user;

      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);
      let filter: any = { role: ROLES.STAFF, isDeleted: false };

      if (role === ROLES.MASTER_ADMIN) {
        if (req.body.franchiseId) {
          const franchiseId = toObjectIdOrNull(req.body.franchiseId);
          if (franchiseId) filter.parentId = franchiseId;
        }
      } else if (role === ROLES.FRANCHISE_ADMIN) {
        filter.parentId = toObjectIdOrNull(loggedUser.id as any);
      } else {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      // Search
      if (req.body.search) {
        const s = String(req.body.search).trim();
        filter.$or = [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { phoneNumber: { $regex: s, $options: 'i' } },
        ];
      }
      if (req.body.isActive !== undefined) {
        filter.isActive = Boolean(req.body.isActive);
      }

      // Sort
      let sort: any = { createdAt: -1 };
      if (req.body.sortBy) {
        const parts = String(req.body.sortBy).split(':');
        sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
      }

      const startIndex = (page - 1) * limit;

      // IMPORTANT: populate parentId and select only 'name'
      const [data, total] = await Promise.all([
        UserModel.find(filter)
          .sort(sort)
          .skip(startIndex)
          .limit(limit)
          .populate({ path: 'parentId', select: 'name' }) // <- explicit populate
          .exec(),
        UserModel.countDocuments(filter),
      ]);

      const mappedData = data.map((staffDoc: any) => {
        const staff = staffDoc.toObject();
        return {
          ...staff,
          franchiseName: staff.parentId?.name ?? null,
        };
      });

      const result = { data: mappedData, total, page, limit };
      return successResponse(res, result, 'Staff list retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list staff', { error });
    }
  },

  async listAll(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;

      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const role = Number((loggedUser as any).role);
      let filter: any = { role: ROLES.STAFF, isDeleted: false };

      if (role === ROLES.MASTER_ADMIN) {
        if (req.body.franchiseId) {
          const franchiseId = toObjectIdOrNull(req.body.franchiseId);
          if (franchiseId) filter.parentId = franchiseId;
        }
      } else if (role === ROLES.FRANCHISE_ADMIN) {
        filter.parentId = toObjectIdOrNull(loggedUser.id as any);
      } else {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
      }

      if (req.body.search) {
        const s = String(req.body.search).trim();
        filter.$or = [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { phoneNumber: { $regex: s, $options: 'i' } },
        ];
      }

      if (req.body.isActive !== undefined) {
        filter.isActive = Boolean(req.body.isActive);
      }

      let sort: any = { createdAt: -1 };
      if (req.body.sortBy) {
        const parts = String(req.body.sortBy).split(':');
        sort = { [parts[0]]: parts[1] === 'asc' ? 1 : -1 };
      }

      const data = await UserService.find(filter, undefined, { sort, populate: { path: 'parentId', select: 'name' } });
      const total = await UserService.count(filter);
      // Map data to replace parentId with franchiseName
      const mappedData = data.map((staff: any) => {
        const { parentId, ...rest } = staff.toObject();
        return { ...rest, franchiseName: parentId?.name || null };
      });
      const result = { data: mappedData, total, page: 1, limit: mappedData.length };
      return successResponse(res, result, 'Staff list retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list staff', { error });
    }
  },

  async getStaffById(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const staffId = req.params.id;
      const staff = await UserService.findById(staffId);

      if (!staff || staff.role !== ROLES.STAFF) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Staff not found');
      }

      const role = Number((loggedUser as any).role);
      const loggedUserId = toObjectIdOrNull(loggedUser.id as any);

      if (role === ROLES.MASTER_ADMIN) {
        // Master admin can view any staff
        return successResponse(res, staff, 'Staff retrieved successfully');
      }

      if (role === ROLES.FRANCHISE_ADMIN) {
        // Franchise admin can only view their own staff
        const staffParentId = toObjectIdOrNull((staff.parentId as any) ?? null);
        if (!staffParentId || !staffParentId.equals(loggedUserId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }
        return successResponse(res, staff, 'Staff retrieved successfully');
      }

      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get staff', { error });
    }
  },

  async updateStaff(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const staffId = req.params.id;
      const staff = await UserService.findById(staffId);

      if (!staff || staff.role !== ROLES.STAFF) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Staff not found');
      }

      const role = Number((loggedUser as any).role);
      const loggedUserId = toObjectIdOrNull(loggedUser.id as any);

      if (role === ROLES.MASTER_ADMIN) {
        // Master admin can update any staff
        if (req.body.franchiseId && !req.body.parentId) {
          req.body.parentId = req.body.franchiseId;
        }
        const updated = await UserService.updateUser(staffId, req.body);
        return successResponse(res, updated, 'Staff updated successfully');
      }

      if (role === ROLES.FRANCHISE_ADMIN) {
        // Franchise admin can only update their own staff
        const staffParentId = toObjectIdOrNull((staff.parentId as any) ?? null);
        if (!staffParentId || !staffParentId.equals(loggedUserId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }

        const updatePayload = { ...req.body };
        delete updatePayload.role; // Cannot change staff role
        delete updatePayload.parentId; // Cannot change parent franchise

        const updated = await UserService.updateUser(staffId, updatePayload);
        return successResponse(res, updated, 'Staff updated successfully');
      }

      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to update staff', { error });
    }
  },

  async deleteStaff(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const staffId = req.params.id;
      const staff = await UserService.findById(staffId);

      if (!staff || staff.role !== ROLES.STAFF) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Staff not found');
      }

      const role = Number((loggedUser as any).role);
      const loggedUserId = toObjectIdOrNull(loggedUser.id as any);

      if (role === ROLES.MASTER_ADMIN) {
        // Master admin can delete any staff
        await UserService.deleteById(staffId);
        return successResponse(res, {}, 'Staff deleted successfully');
      }

      if (role === ROLES.FRANCHISE_ADMIN) {
        // Franchise admin can only delete their own staff
        const staffParentId = toObjectIdOrNull((staff.parentId as any) ?? null);
        if (!staffParentId || !staffParentId.equals(loggedUserId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }

        await UserService.deleteById(staffId);
        return successResponse(res, {}, 'Staff deleted successfully');
      }

      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete staff', { error });
    }
  },

  async toggleStaffStatus(req: AuthRequest, res: Response) {
    try {
      const loggedUser = req.user;
      if (!loggedUser) {
        return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      }

      const staffId = req.params.id;
      const staff = await UserService.findById(staffId);

      if (!staff || staff.role !== ROLES.STAFF) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Staff not found');
      }

      const role = Number((loggedUser as any).role);
      const loggedUserId = toObjectIdOrNull(loggedUser.id as any);

      if (role === ROLES.MASTER_ADMIN) {
        // Master admin can toggle any staff status
        const updated = await UserService.updateUser(staffId, { isActive: !staff.isActive });
        return successResponse(res, updated, 'Staff status updated successfully');
      }

      if (role === ROLES.FRANCHISE_ADMIN) {
        // Franchise admin can only toggle their own staff status
        const staffParentId = toObjectIdOrNull((staff.parentId as any) ?? null);
        if (!staffParentId || !staffParentId.equals(loggedUserId)) {
          return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
        }

        const updated = await UserService.updateUser(staffId, { isActive: !staff.isActive });
        return successResponse(res, updated, 'Staff status updated successfully');
      }

      return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to toggle staff status', { error });
    }
  },
};
