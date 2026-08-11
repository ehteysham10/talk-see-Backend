import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    message = field 
      ? `An account with that ${field} already exists.` 
      : 'Duplicate field value entered';
    statusCode = 400;
  }

  // Handle Multer File Size or Parsing Errors
  if (err.name === 'MulterError') {
    message = err.message;
    statusCode = 400;
  }

  // Handle our Custom File Filter Error
  if (err.message === 'Only standard images (JPEG, PNG, WebP) are allowed') {
    statusCode = 400;
  }

  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (env.NODE_ENV !== 'production' && err.stack) {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    message,
  });
};
