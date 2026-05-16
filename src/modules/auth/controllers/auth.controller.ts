import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { successResponse, errorResponse } from '../../../common/response';
import { AuthService } from '../services/auth.service';
import { AUTH_MESSAGES } from '../messages/message';

export const AuthController = {
  async register(req: Request, res: Response) {
    const result = await AuthService.register(req.body);
    res.status(StatusCodes.CREATED);
    return successResponse(res, result, AUTH_MESSAGES.REGISTER_SUCCESS);
  },

  async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      return successResponse(res, result, AUTH_MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      return errorResponse(res, StatusCodes.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS, {
        error,
      });
    }
  },

  async franchiseLogin(req: Request, res: Response) {
    try {
      const result = await AuthService.franchiseLogin(req.body);
      return successResponse(res, result, AUTH_MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      return errorResponse(res, StatusCodes.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS, {
        error,
      });
    }
  }
};
