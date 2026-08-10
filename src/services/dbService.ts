import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const dbService = {
  connect: async (retries = 5, delay = 5000): Promise<void> => {
    while (retries > 0) {
      try {
        await mongoose.connect(env.MONGO_URI);
        logger.info('Successfully connected to MongoDB.');
        return;
      } catch (error) {
        retries -= 1;
        logger.error(`MongoDB connection failed. Retries left: ${retries}`, error);
        if (retries === 0) {
          logger.error('Exhausted all retries for MongoDB connection. Exiting...');
          process.exit(1);
        }
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  },

  disconnect: async (): Promise<void> => {
    try {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB.');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB', error);
    }
  },
};
