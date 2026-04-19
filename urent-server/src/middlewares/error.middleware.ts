import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/api-response';
import { isAppError } from '../utils/app-error';

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
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

  if (isAppError(error)) {
    return sendError(
      res,
      {
        code: error.code,
        message: error.message,
        details: error.details
      },
      error.statusCode
    );
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return sendError(res, { code: 'INTERNAL_SERVER_ERROR', message }, 500);
};
