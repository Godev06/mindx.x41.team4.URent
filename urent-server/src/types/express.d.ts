import type { AuthenticatedUser } from '../utils/auth-token';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
