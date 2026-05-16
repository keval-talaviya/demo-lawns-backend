"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mobileInvoiceRoute_1 = __importDefault(require("./mobileInvoiceRoute"));
const webInvoiceRoute_1 = __importDefault(require("./webInvoiceRoute"));
const router = (0, express_1.Router)();
router.use((req, res, next) => {
    console.log(`--- [DEBUG] Invoice Module Entry Point: ${req.method} ${req.originalUrl} -> ${req.path} ---`);
    next();
});
router.use('/mobile', mobileInvoiceRoute_1.default);
router.use('/web', webInvoiceRoute_1.default);
exports.default = router;
//# sourceMappingURL=route.js.map