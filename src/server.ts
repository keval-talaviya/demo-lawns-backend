import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { logger } from './common/logger';
import { connectMongo } from './db/mongoose';
import { run as runMasterAdminSeeder } from '../seeders/master-admin.seed';
import { JobCronService } from './services/cron/jobCron.service';
import { InvoiceCronService } from './services/cron/invoiceCron.service';

dotenv.config();

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';   // 👈 add this

const server = http.createServer(app);

const start = async () => {
  try {
    await connectMongo();

    try {
      await runMasterAdminSeeder();
    } catch (error) {
      logger.warn('Master admin seeder failed, continuing anyway', { error });
    }

    JobCronService.initialize();
    InvoiceCronService.initialize();

    // 👇 bind to 0.0.0.0 so LAN/public can reach it
    server.listen(port, () => {
      logger.info(`Server listening on http://${host}:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

console.log('--- [DEBUG] Server Initialization Started ---');
start();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});
