import { Router } from 'express';
import mobileRoutes from './mobileUserRoute';
import webRoutes from './webUserRoute';

const router = Router();

router.use('/mobile', mobileRoutes);
router.use('/web', webRoutes);

export default router;











