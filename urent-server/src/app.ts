import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './routes/auth.route';
import { messageRouter } from './routes/message.route';
import { profileRouter } from './routes/profile.route';
import { productRouter } from './routes/product.route';
import { settingsRouter } from './routes/settings.route';
import { notificationRouter } from './routes/notification.route';
import { orderRouter } from './routes/order.route';

export const app = express();

const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');

app.use(
	cors({
		origin(origin, callback) {
			if (!origin) return callback(null, true);
			
			const normalized = normalizeOrigin(origin);
			
			// Allow Vercel preview deployments and local development origins
			if (
				normalized.endsWith('.vercel.app') || 
				normalized.includes('localhost') || 
				normalized.includes('127.0.0.1') ||
				env.clientOrigins.includes(normalized)
			) {
				return callback(null, true);
			}

			callback(new Error(`CORS blocked for origin: ${origin}`));
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
	})
);
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/debug-post', (req, res) => {
	res.json({ ok: true, bodyReceived: req.body });
});

app.get('/', (req, res) => {
	console.log(`\x1b[32m[WELCOME]\x1b[0m \x1b[36m${req.method}\x1b[0m ${req.originalUrl}`);
	res.json({
		success: true,
		message: "Welcome to URent API",
		status: "running",
		docs: "/api-docs",
		timestamp: new Date().toISOString()
	});
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1', productRouter);
app.use('/api/v1', messageRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/orders', orderRouter);

// 404 Fallback Middleware
app.use((req, res, _next) => {
	console.log(`\x1b[33m[404]\x1b[0m \x1b[36m${req.method}\x1b[0m ${req.originalUrl}`);
	res.status(404).json({
		success: false,
		status: 404,
		message: "Route not found",
		method: req.method,
		path: req.originalUrl,
		timestamp: new Date().toISOString()
	});
});

app.use(errorMiddleware);
