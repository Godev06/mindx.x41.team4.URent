"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errorMiddleware = (error, _req, res, _next) => {
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ message });
};
exports.errorMiddleware = errorMiddleware;
