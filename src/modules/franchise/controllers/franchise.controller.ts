import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { FranchiseService } from '../services/franchise.service';
import { successResponse, errorResponse } from '../../../common/response';
import { FRANCHISE_MESSAGES } from '../messages/message';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { ROLES } from '../../../common/constants';

export const FranchiseController = {
  async create(req: AuthRequest, res: Response) {
    try {
      // Only master admin can create franchises
      if (req.user?.role !== ROLES.MASTER_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only master admin can create franchises');
      }

      const franchise = await FranchiseService.createFranchise(req.body);
      res.status(StatusCodes.CREATED);
      return successResponse(res, franchise, FRANCHISE_MESSAGES.CREATED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to create franchise', { error });
    }
  },

  async list(req: AuthRequest, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 25;
      
      const filter: any = {};
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ];
      }

      const result = await FranchiseService.paginate(filter, { page, limit });
      return successResponse(res, result, FRANCHISE_MESSAGES.LISTED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list franchises', { error });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const franchise = await FranchiseService.findById(req.params.id);
      if (!franchise) {
        return errorResponse(res, StatusCodes.NOT_FOUND, 'Franchise not found');
      }
      return successResponse(res, franchise, 'Franchise retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get franchise', { error });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      // Only master admin can update franchises
      if (req.user?.role !== ROLES.MASTER_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only master admin can update franchises');
      }

      const updated = await FranchiseService.updateFranchise(req.params.id, req.body);
      return successResponse(res, updated, FRANCHISE_MESSAGES.UPDATED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to update franchise', { error });
    }
  },

  async listAll(req: AuthRequest, res: Response) {
    try {
      // Only master admin can list all franchises
      if (req.user?.role !== ROLES.MASTER_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only master admin can list all franchises');
      }

      const filter: any = {};
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ];
      }
      const franchises = await FranchiseService.find(filter, undefined, {});
      return successResponse(res, franchises, FRANCHISE_MESSAGES.LISTED);
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list all franchises', { error });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      // Only master admin can delete franchises
      if (req.user?.role !== ROLES.MASTER_ADMIN) {
        return errorResponse(res, StatusCodes.FORBIDDEN, 'Only master admin can delete franchises');
      }

      await FranchiseService.deleteById(req.params.id);
      return res.status(StatusCodes.NO_CONTENT).send();
    } catch (error: any) {
      return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete franchise', { error });
    }
  },
};





