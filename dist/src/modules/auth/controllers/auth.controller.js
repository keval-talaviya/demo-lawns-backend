"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = require("../../../common/response");
const auth_service_1 = require("../services/auth.service");
const message_1 = require("../messages/message");
exports.AuthController = {
    async register(req, res) {
        const result = await auth_service_1.AuthService.register(req.body);
        res.status(http_status_codes_1.StatusCodes.CREATED);
        return (0, response_1.successResponse)(res, result, message_1.AUTH_MESSAGES.REGISTER_SUCCESS);
    },
    async login(req, res) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            return (0, response_1.successResponse)(res, result, message_1.AUTH_MESSAGES.LOGIN_SUCCESS);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, message_1.AUTH_MESSAGES.INVALID_CREDENTIALS, {
                error,
            });
        }
    },
    async franchiseLogin(req, res) {
        try {
            const result = await auth_service_1.AuthService.franchiseLogin(req.body);
            return (0, response_1.successResponse)(res, result, message_1.AUTH_MESSAGES.LOGIN_SUCCESS);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, message_1.AUTH_MESSAGES.INVALID_CREDENTIALS, {
                error,
            });
        }
    }
};
//# sourceMappingURL=auth.controller.js.map