import { Router } from 'express';
import { CompanySettingsController } from '../controllers/companySettings.controller';
import { authenticate } from '../../../middlewares/authMiddleware';
import { roleGuard } from '../../../middlewares/roleGuard';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { companySettingsValidator } from '../validators/companySettings.validator';
import { uploadImage } from '../../../services/file.service';
import { ROLES } from '../../../common/constants';

const router = Router();

// All routes require authentication and master admin role
const masterAdminOnly = [authenticate, roleGuard([ROLES.MASTER_ADMIN])];

/**
 * @route   POST /api/company-settings
 * @desc    Create company settings (only if not exists)
 * @access  Master Admin only
 */
router.post(
    '/',
    ...masterAdminOnly,
    uploadImage.single('companyLogo'),
    validatorMiddleware(companySettingsValidator.create),
    CompanySettingsController.create
);

/**
 * @route   GET /api/company-settings
 * @desc    Get company settings
 * @access  Master Admin only
 */
router.get(
    '/',
    ...masterAdminOnly,
    CompanySettingsController.get
);

/**
 * @route   PUT /api/company-settings
 * @desc    Update company settings
 * @access  Master Admin only
 */
router.put(
    '/',
    ...masterAdminOnly,
    uploadImage.single('companyLogo'),
    validatorMiddleware(companySettingsValidator.update),
    CompanySettingsController.update
);

/**
 * @route   DELETE /api/company-settings/logo
 * @desc    Delete company logo
 * @access  Master Admin only
 */
router.delete(
    '/logo',
    ...masterAdminOnly,
    CompanySettingsController.deleteLogo
);

export default router;
