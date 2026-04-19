import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/api-response';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, { code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  try {
    const token = authHeader.slice(7);
    req.user = verifyToken(token);
    return next();
  } catch {
    return sendError(res, { code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }
};
