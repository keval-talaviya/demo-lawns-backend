import { Router } from 'express';
import { FranchiseController } from '../controllers/franchise.controller';
import { authenticate } from '../../../middlewares/authMiddleware';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { createFranchiseSchema, updateFranchiseSchema } from '../validators/franchise.validator';
import { getModuleRateLimiter } from '../../../common/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(getModuleRateLimiter('franchise'));

router.post('/', validatorMiddleware(createFranchiseSchema), FranchiseController.create);
router.get('/list', FranchiseController.list);
router.get('/list-all', FranchiseController.listAll);
router.get('/:id', FranchiseController.getById);
router.post('/:id', validatorMiddleware(updateFranchiseSchema), FranchiseController.update);
router.delete('/:id', FranchiseController.remove);

export default router;





