import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './routes/auth.route';
import { profileRouter } from './routes/profile.route';
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
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/settings', settingsRouter);
app.use(errorMiddleware);
