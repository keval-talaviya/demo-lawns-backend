"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimiter_1 = require("../common/rateLimiter");
// MODULE_IMPORTS
const route_1 = __importDefault(require("../modules/report/routes/route"));
const route_2 = __importDefault(require("../modules/dailyReport/routes/route"));
const route_3 = __importDefault(require("../modules/invoice/routes/route"));
const route_4 = __importDefault(require("../modules/jobSchedule/routes/route"));
const route_5 = __importDefault(require("../modules/job/routes/route"));
const auth_route_1 = __importDefault(require("../modules/auth/routes/auth.route"));
const route_6 = __importDefault(require("../modules/user/routes/route"));
const customer_route_1 = __importDefault(require("../modules/customer/routes/customer.route"));
const quotation_route_1 = __importDefault(require("../modules/quotation/routes/quotation.route"));
const franchise_route_1 = __importDefault(require("../modules/franchise/routes/franchise.route"));
const route_7 = __importDefault(require("../modules/services/routes/route"));
const route_8 = __importDefault(require("../modules/inquiry/routes/route"));
const transaction_routes_1 = __importDefault(require("../modules/transaction/routes/transaction.routes"));
const route_9 = __importDefault(require("../modules/companySettings/routes/route"));
const route_10 = __importDefault(require("../modules/userWallet/routes/route"));
const dashboard_routes_1 = __importDefault(require("../modules/dashboard/routes/dashboard.routes"));
const unifiedTransaction_controller_1 = require("../controllers/unifiedTransaction.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// MODULE_ROUTES
router.use('/report', (0, rateLimiter_1.getModuleRateLimiter)('report'), route_1.default);
router.use('/daily-report', (0, rateLimiter_1.getModuleRateLimiter)('dailyReport'), route_2.default);
router.use('/invoice', (0, rateLimiter_1.getModuleRateLimiter)('invoice'), route_3.default);
router.use('/job-schedule', (0, rateLimiter_1.getModuleRateLimiter)('jobSchedule'), route_4.default);
router.use('/job', (0, rateLimiter_1.getModuleRateLimiter)('job'), route_5.default);
router.use('/auth', (0, rateLimiter_1.getModuleRateLimiter)('auth'), auth_route_1.default);
router.use('/users', (0, rateLimiter_1.getModuleRateLimiter)('user'), route_6.default);
router.use('/customers', customer_route_1.default);
router.use('/quotations', quotation_route_1.default);
router.use('/franchises', franchise_route_1.default);
router.use('/services', route_7.default);
router.use('/transactions', transaction_routes_1.default);
router.use('/company-settings', (0, rateLimiter_1.getModuleRateLimiter)('companySettings'), route_9.default);
router.use('/user-wallet', (0, rateLimiter_1.getModuleRateLimiter)('userWallet'), route_10.default);
router.use('/dashboard', (0, rateLimiter_1.getModuleRateLimiter)('dashboard'), dashboard_routes_1.default);
// Unified Transaction Management Routes (combines customer transactions + staff wallet)
router.get('/unified-transactions/report', authMiddleware_1.authenticate, unifiedTransaction_controller_1.UnifiedTransactionController.getUnifiedReport);
router.get('/unified-transactions/reconcile', authMiddleware_1.authenticate, unifiedTransaction_controller_1.UnifiedTransactionController.reconcile);
router.get('/unified-transactions/summary', authMiddleware_1.authenticate, unifiedTransaction_controller_1.UnifiedTransactionController.getSummary);
// Public contact/inquiry endpoint (no token required)
router.use('/inquiry', route_8.default);
console.log('--- [DEBUG] Main API Routes Initialized ---');
exports.default = router;
//# sourceMappingURL=index.js.map