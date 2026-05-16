"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const messages_1 = require("./messages");
const successResponse = (res, data, message = messages_1.GLOBAL_MESSAGES.SUCCESS, meta) => {
    const payload = {
        success: true,
        message,
        data,
        meta,
    };
    return res.json(payload);
};
exports.successResponse = successResponse;
const errorResponse = (res, statusCode, message = messages_1.GLOBAL_MESSAGES.SERVER_ERROR, meta) => {
    const payload = {
        success: false,
        message,
        meta,
    };
    return res.status(statusCode).json(payload);
};
exports.errorResponse = errorResponse;
//# sourceMappingURL=response.js.map