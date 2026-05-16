import { Router } from 'express';
import { getModuleRateLimiter, getCustomRateLimiter } from '../../../common/rateLimiter';
import { MobileInvoiceController } from '../controllers/mobileInvoice.controller';

const router = Router();

router.use(getModuleRateLimiter('invoice-mobile'));


export default router;
