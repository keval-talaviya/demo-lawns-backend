import fs from 'fs';
import path from 'path';
import { connectMongo, disconnectMongo } from '../src/db/mongoose';
import { logger } from '../src/common/logger';

const runSeeders = async () => {
  await connectMongo();
  logger.info('Running seeders...');

  const seedersDir = path.resolve(__dirname);
  const files = fs
    .readdirSync(seedersDir)
    .filter((file) => file.endsWith('.seed.ts') || file.endsWith('.seed.js'))
    .sort();

  for (const file of files) {
    try {
      const seederPath = path.join(seedersDir, file);
      logger.info(`Running seeder: ${file}`);
      const seeder = await import(seederPath);
      if (seeder.run) {
        await seeder.run();
      } else if (typeof seeder.default === 'function') {
        await seeder.default();
      }
      logger.info(`Completed seeder: ${file}`);
    } catch (error) {
      logger.error(`Failed to run seeder ${file}`, { error });
    }
  }

  await disconnectMongo();
  logger.info('Seeders completed');
};

runSeeders().catch((error) => {
  logger.error('Seeder error', { error });
  process.exit(1);
});
