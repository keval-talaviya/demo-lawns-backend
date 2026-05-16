// src/modules/dashboard/controllers/dashboard.controller.ts
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { successResponse, errorResponse } from '../../../common/response';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { ROLES } from '../../../common/constants';
import { DashboardService } from '../services/dashboard.service';

export const DashboardController = {
    /**
     * Get Dashboard Data
     * Returns different data based on user role
     */
    async getDashboard(req: AuthRequest, res: Response) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }

            const role = Number((loggedUser as any).role);
            const franchiseIdParam = req.query.franchiseId as string | undefined;

            let dashboardData;

            if (role === ROLES.MASTER_ADMIN) {
                // Master Admin can view all data or filter by specific franchise
                dashboardData = await DashboardService.getMasterAdminDashboard(franchiseIdParam);
            } else if (role === ROLES.FRANCHISE_ADMIN) {
                // Franchise Admin can only view their own franchise data
                const franchiseId = (loggedUser as any).id || (loggedUser as any)._id;
                dashboardData = await DashboardService.getFranchiseAdminDashboard(String(franchiseId));
            } else {
                return errorResponse(res, StatusCodes.FORBIDDEN, 'Access denied: Insufficient permissions');
            }

            return successResponse(res, dashboardData, 'Dashboard data fetched successfully');
        } catch (error: any) {
            console.error('Dashboard error:', error);
            return errorResponse(
                res,
                StatusCodes.INTERNAL_SERVER_ERROR,
                'Failed to fetch dashboard data',
                { error: error.message }
            );
        }
    },
};
