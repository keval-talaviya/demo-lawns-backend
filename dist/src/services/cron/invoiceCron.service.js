"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCronService = void 0;
const cron = __importStar(require("node-cron"));
const invoice_service_1 = require("../../modules/invoice/services/invoice.service");
const logger_1 = require("../../common/logger");
/**
 * Cron job service for invoice-related scheduled tasks
 */
class InvoiceCronService {
    /**
     * Initialize and start all invoice-related cron jobs
     */
    static initialize() {
        // Run daily at 12:05 AM (just after job cron) to mark overdue invoices
        cron.schedule('5 0 * * *', async () => {
            try {
                logger_1.logger.info('Starting daily job to mark overdue invoices...');
                const result = await invoice_service_1.InvoiceService.markOverdueInvoices();
                logger_1.logger.info(`Overdue invoices cron completed. Matched: ${result.matched}, Modified: ${result.modified}`);
            }
            catch (error) {
                logger_1.logger.error('Error in overdue invoices cron job:', { error });
            }
        }, {
            timezone: 'UTC',
        });
        logger_1.logger.info('Invoice cron service initialized - Daily overdue invoice check scheduled for 12:05 AM');
    }
}
exports.InvoiceCronService = InvoiceCronService;
//# sourceMappingURL=invoiceCron.service.js.map