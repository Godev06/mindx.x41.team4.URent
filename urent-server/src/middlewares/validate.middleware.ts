import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';
import { sendError } from '../utils/api-response';

export const validateBody = <T>(schema: ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(
          res,
          {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message
            }))
          },
          400
        );
      }

      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Invalid payload' }, 400);
    }
  };
};
