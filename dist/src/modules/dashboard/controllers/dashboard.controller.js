"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = require("../../../common/response");
const constants_1 = require("../../../common/constants");
const dashboard_service_1 = require("../services/dashboard.service");
exports.DashboardController = {
    /**
     * Get Dashboard Data
     * Returns different data based on user role
     */
    async getDashboard(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const role = Number(loggedUser.role);
            const franchiseIdParam = req.query.franchiseId;
            let dashboardData;
            if (role === constants_1.ROLES.MASTER_ADMIN) {
                // Master Admin can view all data or filter by specific franchise
                dashboardData = await dashboard_service_1.DashboardService.getMasterAdminDashboard(franchiseIdParam);
            }
            else if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                // Franchise Admin can only view their own franchise data
                const franchiseId = loggedUser.id || loggedUser._id;
                dashboardData = await dashboard_service_1.DashboardService.getFranchiseAdminDashboard(String(franchiseId));
            }
            else {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied: Insufficient permissions');
            }
            return (0, response_1.successResponse)(res, dashboardData, 'Dashboard data fetched successfully');
        }
        catch (error) {
            console.error('Dashboard error:', error);
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch dashboard data', { error: error.message });
        }
    },
};
//# sourceMappingURL=dashboard.controller.js.map