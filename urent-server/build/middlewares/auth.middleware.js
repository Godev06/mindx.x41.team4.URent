"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGuard = void 0;
const api_response_1 = require("../utils/api-response");
const auth_token_1 = require("../utils/auth-token");
const auth_identity_service_1 = require("../services/auth-identity.service");
const isFirebaseTokenExpiredError = (error) => {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'auth/id-token-expired');
};
const authGuard = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return (0, api_response_1.sendError)(res, { code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
    }
    try {
        const token = authHeader.slice(7);
        const identity = await (0, auth_token_1.verifyAccessToken)(token);
        req.user = await (0, auth_identity_service_1.resolveAppIdentity)(identity);
        return next();
    }
    catch (error) {
        if (isFirebaseTokenExpiredError(error)) {
            return (0, api_response_1.sendError)(res, { code: 'TOKEN_EXPIRED', message: 'Firebase ID token has expired' }, 401);
        }
        return (0, api_response_1.sendError)(res, { code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401);
    }
};
exports.authGuard = authGuard;
