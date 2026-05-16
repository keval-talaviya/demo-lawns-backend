"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webUser_controller_1 = require("../controllers/webUser.controller");
const staff_controller_1 = require("../controllers/staff.controller");
const validatorMiddleware_1 = require("../../../middlewares/validatorMiddleware");
const user_validator_1 = require("../validators/user.validator");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const franchiseFilter_1 = require("../../../middlewares/franchiseFilter");
const rateLimiter_1 = require("../../../common/rateLimiter");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use(franchiseFilter_1.addFranchiseFilter);
router.use((0, rateLimiter_1.getModuleRateLimiter)('user-web'));
// ==== USER MANAGEMENT (FRANCHISE ADMINS) ====
router.post('/create', (0, validatorMiddleware_1.validatorMiddleware)(user_validator_1.createUserSchema), webUser_controller_1.WebUserController.create);
router.post('/franchisesList', webUser_controller_1.WebUserController.list);
router.get('/list-all', webUser_controller_1.WebUserController.listAll);
router.get('/wallet', webUser_controller_1.WebUserController.getWallet);
router.get('/:id', webUser_controller_1.WebUserController.getById);
router.post('/:id', (0, validatorMiddleware_1.validatorMiddleware)(user_validator_1.updateSchema), webUser_controller_1.WebUserController.update);
router.post('/updatePassword', webUser_controller_1.WebUserController.updatePassword);
router.delete('/:id', webUser_controller_1.WebUserController.remove);
// ==== STAFF MANAGEMENT CRUD ====
router.post('/staff/create', (0, validatorMiddleware_1.validatorMiddleware)(user_validator_1.createStaffSchema), staff_controller_1.StaffController.createStaff);
router.post('/staff/list', (0, validatorMiddleware_1.validatorMiddleware)(user_validator_1.listStaffSchema), staff_controller_1.StaffController.listStaff);
router.post('/staff/listAll', (0, validatorMiddleware_1.validatorMiddleware)(user_validator_1.listAllStaffSchema), staff_controller_1.StaffController.listAll);
router.get('/staff/:id', staff_controller_1.StaffController.getStaffById);
router.post('/staff/:id', (0, validatorMiddleware_1.validatorMiddleware)(user_validator_1.updateStaffSchema), staff_controller_1.StaffController.updateStaff);
router.delete('/staff/:id', staff_controller_1.StaffController.deleteStaff);
router.patch('/staff/:id/toggle-status', staff_controller_1.StaffController.toggleStaffStatus);
exports.default = router;
//# sourceMappingURL=webUserRoute.js.map