import { Response } from 'express';
import { GLOBAL_MESSAGES } from './messages';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = GLOBAL_MESSAGES.SUCCESS,
  meta?: Record<string, unknown>,
) => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.json(payload);
};

export const errorResponse = (
  res: Response,
  statusCode: number,
  message = GLOBAL_MESSAGES.SERVER_ERROR,
  meta?: Record<string, unknown>,
) => {
  const payload: ApiResponse<null> = {
    success: false,
    message,
    meta,
  };
  return res.status(statusCode).json(payload);
};











