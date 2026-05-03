"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const zod_1 = require("zod");
const api_response_1 = require("../utils/api-response");
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
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
            return (0, api_response_1.sendError)(res, { code: 'VALIDATION_ERROR', message: 'Invalid payload' }, 400);
        }
    };
};
exports.validateBody = validateBody;
