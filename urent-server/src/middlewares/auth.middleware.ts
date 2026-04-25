import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/api-response';
import { verifyAccessToken } from '../utils/auth-token';
import { resolveAppIdentity } from '../services/auth-identity.service';

const isFirebaseTokenExpiredError = (error: unknown) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'auth/id-token-expired'
  );
};

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, { code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }

  try {
    const token = authHeader.slice(7);
    const identity = await verifyAccessToken(token);
    req.user = await resolveAppIdentity(identity);
    return next();
  } catch (error) {
    if (isFirebaseTokenExpiredError(error)) {
      return sendError(res, { code: 'TOKEN_EXPIRED', message: 'Firebase ID token has expired' }, 401);
    }

    return sendError(res, { code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
  }
};
