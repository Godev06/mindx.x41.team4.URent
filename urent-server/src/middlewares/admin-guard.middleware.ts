// src/middlewares/admin-guard.ts
import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/api-response";

export const adminGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendError(
      res,
      {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      },
      401,
    );
  }

  if (req.user.role !== "admin") {
    return sendError(
      res,
      {
        code: "FORBIDDEN",
        message: "Admin access required",
      },
      403,
    );
  }

  return next();
};
