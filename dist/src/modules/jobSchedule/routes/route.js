"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mobileJobScheduleRoute_1 = __importDefault(require("./mobileJobScheduleRoute"));
const webJobScheduleRoute_1 = __importDefault(require("./webJobScheduleRoute"));
const router = (0, express_1.Router)();
router.use('/mobile', mobileJobScheduleRoute_1.default);
router.use('/web', webJobScheduleRoute_1.default);
exports.default = router;
//# sourceMappingURL=route.js.map