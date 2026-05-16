import { Router } from 'express';
import mobileRoutes from './mobileJobRoute';
import webRoutes from './webJobRoute';

const router = Router();

router.use('/mobile', mobileRoutes);
router.use('/web', webRoutes);

export default router;
