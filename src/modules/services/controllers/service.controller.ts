import { Request, Response } from 'express';
import { SERVICE_LIST } from '../../../common/constants';
import { successResponse } from '../../../common/response';

export const getServices = (_req: Request, res: Response) => {
  // Return the service list as-is
  return successResponse(res, { services: SERVICE_LIST }, 'Service list');
};
