"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webInvoice_controller_1 = require("../controllers/webInvoice.controller");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const franchiseFilter_1 = require("../../../middlewares/franchiseFilter");
const validatorMiddleware_1 = require("../../../middlewares/validatorMiddleware");
const invoice_validator_1 = require("../validators/invoice.validator");
const rateLimiter_1 = require("../../../common/rateLimiter");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use(franchiseFilter_1.addFranchiseFilter);
router.use((0, rateLimiter_1.getModuleRateLimiter)('invoice-web'));
router.post('/list', webInvoice_controller_1.WebInvoiceController.list);
router.get('/getById', webInvoice_controller_1.WebInvoiceController.getById);
router.use('/send-email', (req, res, next) => {
    console.log(`--- [DEBUG] INCOMING REQUEST: ${req.method} /api/invoice/web/send-email ---`);
    console.log('--- ID:', req.query.id || req.body.id);
    next();
});
router.get('/send-email', webInvoice_controller_1.WebInvoiceController.sendEmail);
router.post('/send-email', webInvoice_controller_1.WebInvoiceController.sendEmail);
router.get('/download-pdf', webInvoice_controller_1.WebInvoiceController.downloadPDF);
router.post('/markAsPaid', webInvoice_controller_1.WebInvoiceController.markAsPaid);
router.post('/cancel', webInvoice_controller_1.WebInvoiceController.cancel);
router.patch('/update', (req, res, next) => {
    console.log('--- [DEBUG] INCOMING REQUEST: PATCH /api/invoice/web/update ---');
    console.log('--- Query ID:', req.query.id);
    next();
}, (0, validatorMiddleware_1.validatorMiddleware)(invoice_validator_1.updateInvoiceSchema), webInvoice_controller_1.WebInvoiceController.update);
console.log('--- [DEBUG] Invoice Web Routes Registered: /send-email, /update etc. ---');
exports.default = router;
//# sourceMappingURL=webInvoiceRoute.js.map