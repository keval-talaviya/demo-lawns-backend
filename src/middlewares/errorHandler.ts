import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../common/logger';
import { errorResponse } from '../common/response';
import { GLOBAL_MESSAGES } from '../common/messages';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || GLOBAL_MESSAGES.SERVER_ERROR;

  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    logger.error('Unhandled error', { err });
  }

  return errorResponse(res, statusCode, message, err.meta);
};











