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

export const app = express();

app.use(
	cors({
		origin(origin, callback) {
			if (!origin || env.clientOrigins.includes(origin)) {
				callback(null, true);
				return;
			}

			callback(new Error(`CORS blocked for origin: ${origin}`));
		}
	})
);
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1', productRouter);
app.use('/api/v1', messageRouter);
app.use(errorMiddleware);
