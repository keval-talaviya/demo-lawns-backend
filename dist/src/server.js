"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./common/logger");
const mongoose_1 = require("./db/mongoose");
const master_admin_seed_1 = require("../seeders/master-admin.seed");
const jobCron_service_1 = require("./services/cron/jobCron.service");
const invoiceCron_service_1 = require("./services/cron/invoiceCron.service");
dotenv_1.default.config();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0'; // 👈 add this
const server = http_1.default.createServer(app_1.default);
const start = async () => {
    try {
        await (0, mongoose_1.connectMongo)();
        try {
            await (0, master_admin_seed_1.run)();
        }
        catch (error) {
            logger_1.logger.warn('Master admin seeder failed, continuing anyway', { error });
        }
        jobCron_service_1.JobCronService.initialize();
        invoiceCron_service_1.InvoiceCronService.initialize();
        // 👇 bind to 0.0.0.0 so LAN/public can reach it
        server.listen(port, () => {
            logger_1.logger.info(`Server listening on http://${host}:${port}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', { error });
        process.exit(1);
    }
};
console.log('--- [DEBUG] Server Initialization Started ---');
start();
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Rejection', { reason });
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception', { error });
    process.exit(1);
});
//# sourceMappingURL=server.js.map