import { Router } from 'express';
import { sendInquiry } from '../controllers/inquiry.controller';

const router = Router();

// Public endpoint to receive inquiry form submissions
router.post('/', sendInquiry);

export default router;
