"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const swagger_1 = require("./config/swagger");
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_route_1 = require("./routes/auth.route");
const message_route_1 = require("./routes/message.route");
const profile_route_1 = require("./routes/profile.route");
const product_route_1 = require("./routes/product.route");
const settings_route_1 = require("./routes/settings.route");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin || env_1.env.clientOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
    }
}));
exports.app.use(express_1.default.json());
exports.app.use((0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 300 }));
exports.app.get('/health', (_req, res) => res.json({ ok: true }));
exports.app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
exports.app.get('/api-docs.json', (_req, res) => res.json(swagger_1.swaggerSpec));
exports.app.use('/api/v1/auth', auth_route_1.authRouter);
exports.app.use('/api/v1/profile', profile_route_1.profileRouter);
exports.app.use('/api/v1/settings', settings_route_1.settingsRouter);
exports.app.use('/api/v1', product_route_1.productRouter);
exports.app.use('/api/v1', message_route_1.messageRouter);
exports.app.use(error_middleware_1.errorMiddleware);
