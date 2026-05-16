"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const logger_1 = require("../common/logger");
const response_1 = require("../common/response");
const messages_1 = require("../common/messages");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorHandler = (err, _req, res, _next) => {
    const statusCode = err.status || err.statusCode || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || messages_1.GLOBAL_MESSAGES.SERVER_ERROR;
    if (statusCode >= http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) {
        logger_1.logger.error('Unhandled error', { err });
    }
    return (0, response_1.errorResponse)(res, statusCode, message, err.meta);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map