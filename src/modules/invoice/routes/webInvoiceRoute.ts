import { Router } from 'express';
import { WebInvoiceController } from '../controllers/webInvoice.controller';
import { authenticate } from '../../../middlewares/authMiddleware';
import { addFranchiseFilter } from '../../../middlewares/franchiseFilter';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { createInvoiceSchema, updateInvoiceSchema, updatePaymentSchema } from '../validators/invoice.validator';
import { getModuleRateLimiter } from '../../../common/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(addFranchiseFilter);
router.use(getModuleRateLimiter('invoice-web'));

router.post('/list', WebInvoiceController.list);
router.get('/getById', WebInvoiceController.getById);

router.use('/send-email', (req, res, next) => {
  console.log(`--- [DEBUG] INCOMING REQUEST: ${req.method} /api/invoice/web/send-email ---`);
  console.log('--- ID:', req.query.id || req.body.id);
  next();
});
router.get('/send-email', WebInvoiceController.sendEmail);
router.post('/send-email', WebInvoiceController.sendEmail);


router.get('/download-pdf', WebInvoiceController.downloadPDF);
router.post('/markAsPaid', WebInvoiceController.markAsPaid);
router.post('/cancel', WebInvoiceController.cancel);
router.patch('/update', (req, res, next) => {
  console.log('--- [DEBUG] INCOMING REQUEST: PATCH /api/invoice/web/update ---');
  console.log('--- Query ID:', req.query.id);
  next();
}, validatorMiddleware(updateInvoiceSchema), WebInvoiceController.update);

console.log('--- [DEBUG] Invoice Web Routes Registered: /send-email, /update etc. ---');

export default router;
