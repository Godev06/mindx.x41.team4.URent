import { Response } from 'express';
import { ApiErrorPayload } from './app-error';

export interface ApiMeta {
  cursor?: string | null;
  nextCursor?: string | null;
  limit?: number;
  hasMore?: boolean;
  [key: string]: unknown;
}

export const sendSuccess = <T>(res: Response, data: T, meta?: ApiMeta, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data, meta: meta ?? null });
};

export const sendError = (res: Response, error: ApiErrorPayload, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, error });
};
