import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../../../middlewares/authMiddleware';
import { addFranchiseFilter } from '../../../middlewares/franchiseFilter';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { createCustomerSchema, updateCustomerSchema, createTransactionSchema } from '../validators/customer.validator';
import { getModuleRateLimiter } from '../../../common/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(addFranchiseFilter);
router.use(getModuleRateLimiter('customer'));

router.post('/', validatorMiddleware(createCustomerSchema), CustomerController.create);
router.post('/list', CustomerController.list);
router.post('/transactionsCreate', validatorMiddleware(createTransactionSchema), CustomerController.createTransaction);
router.get('/list-all', CustomerController.listAll);
router.get('/invoices', CustomerController.getInvoices);
router.get('/wallet', CustomerController.getWallet);
router.get('/:id', CustomerController.getById);
router.post('/:id', validatorMiddleware(updateCustomerSchema), CustomerController.update);
router.post('/statement/email', CustomerController.sendStatement);
router.delete('/:id', CustomerController.remove);

export default router;
