"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companySettings_controller_1 = require("../controllers/companySettings.controller");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const roleGuard_1 = require("../../../middlewares/roleGuard");
const validatorMiddleware_1 = require("../../../middlewares/validatorMiddleware");
const companySettings_validator_1 = require("../validators/companySettings.validator");
const file_service_1 = require("../../../services/file.service");
const constants_1 = require("../../../common/constants");
const router = (0, express_1.Router)();
// All routes require authentication and master admin role
const masterAdminOnly = [authMiddleware_1.authenticate, (0, roleGuard_1.roleGuard)([constants_1.ROLES.MASTER_ADMIN])];
/**
 * @route   POST /api/company-settings
 * @desc    Create company settings (only if not exists)
 * @access  Master Admin only
 */
router.post('/', ...masterAdminOnly, file_service_1.uploadImage.single('companyLogo'), (0, validatorMiddleware_1.validatorMiddleware)(companySettings_validator_1.companySettingsValidator.create), companySettings_controller_1.CompanySettingsController.create);
/**
 * @route   GET /api/company-settings
 * @desc    Get company settings
 * @access  Master Admin only
 */
router.get('/', ...masterAdminOnly, companySettings_controller_1.CompanySettingsController.get);
/**
 * @route   PUT /api/company-settings
 * @desc    Update company settings
 * @access  Master Admin only
 */
router.put('/', ...masterAdminOnly, file_service_1.uploadImage.single('companyLogo'), (0, validatorMiddleware_1.validatorMiddleware)(companySettings_validator_1.companySettingsValidator.update), companySettings_controller_1.CompanySettingsController.update);
/**
 * @route   DELETE /api/company-settings/logo
 * @desc    Delete company logo
 * @access  Master Admin only
 */
router.delete('/logo', ...masterAdminOnly, companySettings_controller_1.CompanySettingsController.deleteLogo);
exports.default = router;
//# sourceMappingURL=route.js.map