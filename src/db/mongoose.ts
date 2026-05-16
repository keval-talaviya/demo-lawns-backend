import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../common/logger';

mongoose.set('strictQuery', true);

export const connectMongo = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const connection = await mongoose.connect(config.mongoUri);
  logger.info('Connected to MongoDB');
  return connection;
};

export const disconnectMongo = async () => {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
};











