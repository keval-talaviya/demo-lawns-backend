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
exports.JobCronService = void 0;
const cron = __importStar(require("node-cron"));
const job_service_1 = require("../../modules/job/services/job.service");
const logger_1 = require("../../common/logger");
/**
 * Cron job service for job-related scheduled tasks
 */
class JobCronService {
    /**
     * Initialize and start all job-related cron jobs
     */
    static initialize() {
        // Run daily at 12:00 AM (midnight) to mark overdue jobs
        // Cron expression: '0 0 * * *' means: minute 0, hour 0, every day of month, every month, every day of week
        cron.schedule('0 0 * * *', async () => {
            try {
                logger_1.logger.info('Starting daily job to mark overdue jobs...');
                const result = await job_service_1.JobService.markOverdueJobs();
                logger_1.logger.info(`Overdue jobs cron completed. Matched: ${result.matched}, Modified: ${result.modified}`);
            }
            catch (error) {
                logger_1.logger.error('Error in overdue jobs cron job:', { error });
            }
        }, {
            timezone: 'UTC', // Adjust timezone as needed
        });
        logger_1.logger.info('Job cron service initialized - Daily overdue job check scheduled for 12:00 AM');
    }
}
exports.JobCronService = JobCronService;
//# sourceMappingURL=jobCron.service.js.map