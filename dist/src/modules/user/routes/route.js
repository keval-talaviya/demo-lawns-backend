"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mobileUserRoute_1 = __importDefault(require("./mobileUserRoute"));
const webUserRoute_1 = __importDefault(require("./webUserRoute"));
const router = (0, express_1.Router)();
router.use('/mobile', mobileUserRoute_1.default);
router.use('/web', webUserRoute_1.default);
exports.default = router;
//# sourceMappingURL=route.js.map