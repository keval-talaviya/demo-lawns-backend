import { Router } from 'express';
import { getServices } from '../controllers/service.controller';

const router = Router();

// Public endpoint returning available services for dropdowns
router.get('/', getServices);

export default router;
