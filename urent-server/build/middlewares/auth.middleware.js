"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGuard = void 0;
const jwt_1 = require("../utils/jwt");
const authGuard = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const token = authHeader.slice(7);
        req.user = (0, jwt_1.verifyToken)(token);
        return next();
    }
    catch {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};
exports.authGuard = authGuard;
