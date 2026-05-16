"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.checkPermission = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = require("../common/response");
const messages_1 = require("../common/messages");
const user_model_1 = require("../modules/user/model/user.model");
const constants_1 = require("../common/constants");
const checkPermission = (module, requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, messages_1.GLOBAL_MESSAGES.UNAUTHORIZED);
            }
            const user = await user_model_1.UserModel.findById(req.user.id);
            if (!user) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, messages_1.GLOBAL_MESSAGES.UNAUTHORIZED);
            }
            // Master admin has all permissions
            if (user.role === constants_1.ROLES.MASTER_ADMIN) {
                return next();
            }
            // Check if user has permission for this module
            // Note: permissions is now string[] not Permission[] objects
            // For now, if user has any permissions, allow access
            // TODO: Implement proper permission checking based on string array
            if (!user.permissions || user.permissions.length === 0) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'No permissions assigned');
            }
            // Check if user has the required permission
            if (!user.permissions.includes(requiredPermission)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, `Missing ${requiredPermission} permission`);
            }
            return next();
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, messages_1.GLOBAL_MESSAGES.SERVER_ERROR, {
                error,
            });
        }
    };
};
exports.checkPermission = checkPermission;
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, messages_1.GLOBAL_MESSAGES.UNAUTHORIZED);
            }
            const user = await user_model_1.UserModel.findById(req.user.id);
            if (!user) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, messages_1.GLOBAL_MESSAGES.UNAUTHORIZED);
            }
            // Check if user role is in allowed roles
            if (!allowedRoles.includes(user.role)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, messages_1.GLOBAL_MESSAGES.FORBIDDEN);
            }
            return next();
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, messages_1.GLOBAL_MESSAGES.SERVER_ERROR, {
                error,
            });
        }
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=permissionMiddleware.js.map