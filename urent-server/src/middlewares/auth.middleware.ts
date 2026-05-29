import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/api-response';
import { verifyAccessToken } from '../utils/auth-token';
import { resolveAppIdentity } from '../services/auth-identity.service';
import { UserModel } from '../models/user.model';

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
    return sendError(res, { code: 'UNAUTHORIZED', message: 'Unauthorized - No Bearer token' }, 401);
  }

  try {
    const token = authHeader.slice(7);
    const identity = await verifyAccessToken(token);
    const resolved = await resolveAppIdentity(identity);

    // Với JWT token (không phải Firebase): luôn lấy role thực từ DB
    // để tránh dùng role cũ trong token (ví dụ sau khi DB bị xóa & tạo lại)
    if (resolved.authProvider === 'jwt') {
      const dbUser = await UserModel.findById(resolved.sub).select('role').lean();
      if (!dbUser) {
        return sendError(res, { code: 'UNAUTHORIZED', message: 'User not found' }, 401);
      }
      resolved.role = dbUser.role;
    }

    req.user = resolved;
    return next();
  } catch (error) {
    console.error('[authGuard] Token verification failed:', error instanceof Error ? error.message : String(error));
    
    if (isFirebaseTokenExpiredError(error)) {
      return sendError(res, { code: 'TOKEN_EXPIRED', message: 'Firebase ID token has expired' }, 401);
    }

    return sendError(res, { 
      code: 'UNAUTHORIZED', 
      message: 'Unauthorized',
      details: error instanceof Error ? error.message : String(error)
    } as any, 401);
  }
};

