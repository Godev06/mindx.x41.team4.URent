"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const zod_1 = require("zod");
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    message: 'Validation failed',
                    errors: error.issues.map((issue) => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                });
            }
            return res.status(400).json({ message: 'Invalid payload' });
        }
    };
};
exports.validateBody = validateBody;
