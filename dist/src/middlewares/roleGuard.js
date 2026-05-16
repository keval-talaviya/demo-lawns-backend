"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = require("../common/response");
const messages_1 = require("../common/messages");
const user_model_1 = require("../modules/user/model/user.model");
const roleGuard = (roles) => async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, messages_1.GLOBAL_MESSAGES.UNAUTHORIZED);
        }
        const user = await user_model_1.UserModel.findById(req.user.id);
        if (!user) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, messages_1.GLOBAL_MESSAGES.UNAUTHORIZED);
        }
        if (!roles.includes(user.role)) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, messages_1.GLOBAL_MESSAGES.FORBIDDEN);
        }
        return next();
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, messages_1.GLOBAL_MESSAGES.SERVER_ERROR, { error });
    }
};
exports.roleGuard = roleGuard;
//# sourceMappingURL=roleGuard.js.map