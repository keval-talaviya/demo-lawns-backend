import { connectMongo, disconnectMongo } from '../src/db/mongoose';
import { UserModel } from '../src/modules/user/model/user.model';
import { ROLES, MODULES, PERMISSIONS } from '../src/common/constants';
import bcrypt from 'bcrypt';
import { logger } from '../src/common/logger';

const MASTER_ADMIN_EMAIL = 'info.sadhguruinfotech@gmail.com';
const MASTER_ADMIN_PASSWORD = 'Admin@demo123';
const MASTER_ADMIN_NAME = 'Master Admin';

export const run = async () => {
  try {
    // Check if master admin already exists by email or userEmail
    const existingAdmin = await UserModel.findOne({
      $or: [
        { email: MASTER_ADMIN_EMAIL },
        { userEmail: MASTER_ADMIN_EMAIL },
        { role: ROLES.MASTER_ADMIN },
      ],
    });

    if (existingAdmin) {
      logger.info('Master admin already exists, skipping creation');
      return;
    }


    // Master admin gets all permissions as string array
    const allPermissions = Object.values(PERMISSIONS);

    const masterAdmin = await UserModel.create({
      name: MASTER_ADMIN_NAME,
      email: MASTER_ADMIN_EMAIL,
      password: MASTER_ADMIN_PASSWORD,
      role: ROLES.MASTER_ADMIN,
      status: true,
      permissions: allPermissions,
    });

    logger.info(`Master admin created successfully: ${masterAdmin.email}`);
  } catch (error) {
    logger.error('Failed to create master admin', { error });
    throw error;
  }
};

if (require.main === module) {
  run()
    .then(() => {
      logger.info('Master admin seeder completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Master admin seeder failed', { error });
      process.exit(1);
    });
}







