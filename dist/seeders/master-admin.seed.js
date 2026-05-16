"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const user_model_1 = require("../src/modules/user/model/user.model");
const constants_1 = require("../src/common/constants");
const logger_1 = require("../src/common/logger");
const MASTER_ADMIN_EMAIL = 'info.sadhguruinfotech@gmail.com';
const MASTER_ADMIN_PASSWORD = 'Admin@demo123';
const MASTER_ADMIN_NAME = 'Master Admin';
const run = async () => {
    try {
        // Check if master admin already exists by email or userEmail
        const existingAdmin = await user_model_1.UserModel.findOne({
            $or: [
                { email: MASTER_ADMIN_EMAIL },
                { userEmail: MASTER_ADMIN_EMAIL },
                { role: constants_1.ROLES.MASTER_ADMIN },
            ],
        });
        if (existingAdmin) {
            logger_1.logger.info('Master admin already exists, skipping creation');
            return;
        }
        // Master admin gets all permissions as string array
        const allPermissions = Object.values(constants_1.PERMISSIONS);
        const masterAdmin = await user_model_1.UserModel.create({
            name: MASTER_ADMIN_NAME,
            email: MASTER_ADMIN_EMAIL,
            password: MASTER_ADMIN_PASSWORD,
            role: constants_1.ROLES.MASTER_ADMIN,
            status: true,
            permissions: allPermissions,
        });
        logger_1.logger.info(`Master admin created successfully: ${masterAdmin.email}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to create master admin', { error });
        throw error;
    }
};
exports.run = run;
if (require.main === module) {
    (0, exports.run)()
        .then(() => {
        logger_1.logger.info('Master admin seeder completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('Master admin seeder failed', { error });
        process.exit(1);
    });
}
//# sourceMappingURL=master-admin.seed.js.map