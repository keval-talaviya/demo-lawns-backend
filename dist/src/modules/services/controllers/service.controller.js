"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServices = void 0;
const constants_1 = require("../../../common/constants");
const response_1 = require("../../../common/response");
const getServices = (_req, res) => {
    // Return the service list as-is
    return (0, response_1.successResponse)(res, { services: constants_1.SERVICE_LIST }, 'Service list');
};
exports.getServices = getServices;
//# sourceMappingURL=service.controller.js.map