/**
 * Vercel serverless entry: must default-export the Express app.
 * All routes and middleware live in src/server.ts (imports src/app.ts).
 */
import app from '../src/server';

export default app;
