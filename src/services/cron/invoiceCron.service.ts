import * as cron from 'node-cron';
import { InvoiceService } from '../../modules/invoice/services/invoice.service';
import { logger } from '../../common/logger';

/**
 * Cron job service for invoice-related scheduled tasks
 */
export class InvoiceCronService {
    /**
     * Initialize and start all invoice-related cron jobs
     */
    static initialize() {
        // Run daily at 12:05 AM (just after job cron) to mark overdue invoices
        cron.schedule('5 0 * * *', async () => {
            try {
                logger.info('Starting daily job to mark overdue invoices...');
                const result = await InvoiceService.markOverdueInvoices();
                logger.info(`Overdue invoices cron completed. Matched: ${result.matched}, Modified: ${result.modified}`);
            } catch (error) {
                logger.error('Error in overdue invoices cron job:', { error });
            }
        }, {
            timezone: 'UTC',
        });

        logger.info('Invoice cron service initialized - Daily overdue invoice check scheduled for 12:05 AM');
    }
}
