import { Router } from 'express';
import { QuotationController } from '../controllers/quotation.controller';
import { authenticate } from '../../../middlewares/authMiddleware';
import { addFranchiseFilter } from '../../../middlewares/franchiseFilter';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { createQuotationSchema, updateQuotationSchema } from '../validators/quotation.validator';
import { getModuleRateLimiter } from '../../../common/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(addFranchiseFilter);
router.use(getModuleRateLimiter('quotation'));

router.post('/', validatorMiddleware(createQuotationSchema), QuotationController.create);
router.post('/send', QuotationController.send);
router.post('/list', QuotationController.list);
router.get('/pdf', QuotationController.downloadPDF);
router.get('/:id', QuotationController.getById);
router.post('/:id', validatorMiddleware(updateQuotationSchema), QuotationController.update);
router.delete('/:id', QuotationController.remove);

export default router;





