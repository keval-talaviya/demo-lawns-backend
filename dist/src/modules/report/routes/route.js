"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mobileReportRoute_1 = __importDefault(require("./mobileReportRoute"));
const webReportRoute_1 = __importDefault(require("./webReportRoute"));
const router = (0, express_1.Router)();
router.use('/mobile', mobileReportRoute_1.default);
router.use('/web', webReportRoute_1.default);
exports.default = router;
//# sourceMappingURL=route.js.map