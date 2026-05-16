import { Router } from 'express';
import { WebUserController } from '../controllers/webUser.controller';
import { StaffController } from '../controllers/staff.controller';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { createUserSchema, updateSchema, createStaffSchema, updateStaffSchema, listStaffSchema, listAllStaffSchema } from '../validators/user.validator';
import { authenticate } from '../../../middlewares/authMiddleware';
import { addFranchiseFilter } from '../../../middlewares/franchiseFilter';
import { getModuleRateLimiter } from '../../../common/rateLimiter';
import { uploadImage } from '../../../services/file.service';

const router = Router();

router.use(authenticate);
router.use(addFranchiseFilter);
router.use(getModuleRateLimiter('user-web'));

// ==== USER MANAGEMENT (FRANCHISE ADMINS) ====
router.post('/create', validatorMiddleware(createUserSchema), WebUserController.create);
router.post('/franchisesList', WebUserController.list);
router.get('/list-all', WebUserController.listAll);
router.get('/wallet', WebUserController.getWallet);
router.get('/:id', WebUserController.getById);
router.post('/:id', validatorMiddleware(updateSchema), WebUserController.update);
router.post('/updatePassword', WebUserController.updatePassword);
router.delete('/:id', WebUserController.remove);

// ==== STAFF MANAGEMENT CRUD ====
router.post('/staff/create', validatorMiddleware(createStaffSchema), StaffController.createStaff);
router.post('/staff/list', validatorMiddleware(listStaffSchema), StaffController.listStaff);
router.post('/staff/listAll', validatorMiddleware(listAllStaffSchema), StaffController.listAll);
router.get('/staff/:id', StaffController.getStaffById);
router.post('/staff/:id', validatorMiddleware(updateStaffSchema), StaffController.updateStaff);
router.delete('/staff/:id', StaffController.deleteStaff);
router.patch('/staff/:id/toggle-status', StaffController.toggleStaffStatus);

export default router;
