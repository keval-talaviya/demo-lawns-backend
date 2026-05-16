import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';
import { StatusCodes } from 'http-status-codes';
import { errorResponse } from '../common/response';
import { GLOBAL_MESSAGES } from '../common/messages';

type ValidationTarget = 'body' | 'params' | 'query';

interface ValidatorOptions {
  target?: ValidationTarget;
}

export const validatorMiddleware = (
  schema: ObjectSchema,
  options: ValidatorOptions = { target: 'body' },
) =>
  (req: Request, res: Response, next: NextFunction) => {
    const target = options.target ?? 'body';
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      return errorResponse(res, StatusCodes.BAD_REQUEST, GLOBAL_MESSAGES.VALIDATION_FAILED, {
        details: error.details,
      });
    }

    req[target] = value;
    return next();
  };











