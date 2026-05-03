"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const api_response_1 = require("../utils/api-response");
const app_error_1 = require("../utils/app-error");
const errorMiddleware = (error, _req, res, _next) => {
    if (error instanceof zod_1.ZodError) {
        return (0, api_response_1.sendError)(res, {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message
            }))
        }, 400);
    }
    if ((0, app_error_1.isAppError)(error)) {
        return (0, api_response_1.sendError)(res, {
            code: error.code,
            message: error.message,
            details: error.details
        }, error.statusCode);
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return (0, api_response_1.sendError)(res, { code: 'INTERNAL_SERVER_ERROR', message }, 500);
};
exports.errorMiddleware = errorMiddleware;
