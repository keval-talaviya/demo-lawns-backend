import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { successResponse, errorResponse } from '../../../common/response';
import { AuthService } from '../../auth/services/auth.service';
import { USER_MESSAGES } from '../messages/message';

export const MobileUserController = {
  async register(req: Request, res: Response) {
    const result = await AuthService.register(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: USER_MESSAGES.REGISTERED,
      data: result,
    });
  },

  async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      return successResponse(res, result, USER_MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      return errorResponse(res, StatusCodes.UNAUTHORIZED, USER_MESSAGES.LOGIN_FAILED, { error });
    }
  },
};

