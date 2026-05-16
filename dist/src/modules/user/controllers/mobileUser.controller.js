"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileUserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = require("../../../common/response");
const auth_service_1 = require("../../auth/services/auth.service");
const message_1 = require("../messages/message");
exports.MobileUserController = {
    async register(req, res) {
        const result = await auth_service_1.AuthService.register(req.body);
        return res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            message: message_1.USER_MESSAGES.REGISTERED,
            data: result,
        });
    },
    async login(req, res) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            return (0, response_1.successResponse)(res, result, message_1.USER_MESSAGES.LOGIN_SUCCESS);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, message_1.USER_MESSAGES.LOGIN_FAILED, { error });
        }
    },
};
//# sourceMappingURL=mobileUser.controller.js.map