"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mobileJobRoute_1 = __importDefault(require("./mobileJobRoute"));
const webJobRoute_1 = __importDefault(require("./webJobRoute"));
const router = (0, express_1.Router)();
router.use('/mobile', mobileJobRoute_1.default);
router.use('/web', webJobRoute_1.default);
exports.default = router;
//# sourceMappingURL=route.js.map