"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const franchise_controller_1 = require("../controllers/franchise.controller");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const validatorMiddleware_1 = require("../../../middlewares/validatorMiddleware");
const franchise_validator_1 = require("../validators/franchise.validator");
const rateLimiter_1 = require("../../../common/rateLimiter");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use((0, rateLimiter_1.getModuleRateLimiter)('franchise'));
router.post('/', (0, validatorMiddleware_1.validatorMiddleware)(franchise_validator_1.createFranchiseSchema), franchise_controller_1.FranchiseController.create);
router.get('/list', franchise_controller_1.FranchiseController.list);
router.get('/list-all', franchise_controller_1.FranchiseController.listAll);
router.get('/:id', franchise_controller_1.FranchiseController.getById);
router.post('/:id', (0, validatorMiddleware_1.validatorMiddleware)(franchise_validator_1.updateFranchiseSchema), franchise_controller_1.FranchiseController.update);
router.delete('/:id', franchise_controller_1.FranchiseController.remove);
exports.default = router;
//# sourceMappingURL=franchise.route.js.map