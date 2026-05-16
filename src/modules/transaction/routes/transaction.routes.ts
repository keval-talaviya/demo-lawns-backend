import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../../../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticate, TransactionController.create);
router.post('/list', authenticate, TransactionController.list);
router.get('/getByCustomerId', authenticate, TransactionController.getByCustomerId);

export default router;
