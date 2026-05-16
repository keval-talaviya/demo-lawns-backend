"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatorMiddleware = void 0;
const http_status_codes_1 = require("http-status-codes");
const response_1 = require("../common/response");
const messages_1 = require("../common/messages");
const validatorMiddleware = (schema, options = { target: 'body' }) => (req, res, next) => {
    const target = options.target ?? 'body';
    const { error, value } = schema.validate(req[target], {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
    });
    if (error) {
        return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, messages_1.GLOBAL_MESSAGES.VALIDATION_FAILED, {
            details: error.details,
        });
    }
    req[target] = value;
    return next();
};
exports.validatorMiddleware = validatorMiddleware;
//# sourceMappingURL=validatorMiddleware.js.map