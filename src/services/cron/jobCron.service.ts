import * as cron from 'node-cron';
import { JobService } from '../../modules/job/services/job.service';
import { logger } from '../../common/logger';

/**
 * Cron job service for job-related scheduled tasks
 */
export class JobCronService {
  /**
   * Initialize and start all job-related cron jobs
   */
  static initialize() {
    // Run daily at 12:00 AM (midnight) to mark overdue jobs
    // Cron expression: '0 0 * * *' means: minute 0, hour 0, every day of month, every month, every day of week
    cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('Starting daily job to mark overdue jobs...');
        const result = await JobService.markOverdueJobs();
        logger.info(`Overdue jobs cron completed. Matched: ${result.matched}, Modified: ${result.modified}`);
      } catch (error) {
        logger.error('Error in overdue jobs cron job:', { error });
      }
    }, {
      timezone: 'UTC', // Adjust timezone as needed
    });

    logger.info('Job cron service initialized - Daily overdue job check scheduled for 12:00 AM');
  }
}

