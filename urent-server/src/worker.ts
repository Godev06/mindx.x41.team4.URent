import { handleAsNodeRequest } from 'cloudflare:node';
import { createServer } from 'node:http';
import { runtimeSecrets } from './config/runtime';

// ─── State ────────────────────────────────────────────────────────────────────
let expressApp: any = null;
let initPromise: Promise<void> | null = null;

// ─── Node HTTP server (required by handleAsNodeRequest) ───────────────────────
const server = createServer((req, res) => {
  if (expressApp) {
    expressApp(req, res);
  } else {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, code: 'NOT_READY', message: 'App is initializing' }));
  }
});
server.listen(3000);

// ─── CORS helpers ─────────────────────────────────────────────────────────────
const CORS_METHODS = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
const CORS_HEADERS_ALLOW = 'Content-Type, Authorization, X-Requested-With';

function getCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': CORS_METHODS,
    'Access-Control-Allow-Headers': CORS_HEADERS_ALLOW,
    'Vary': 'Origin',
  };
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return true;
  return (
    origin.endsWith('.pages.dev') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  );
}

function errorResponse(origin: string, status: number, code: string, message: string, details?: string): Response {
  return new Response(
    JSON.stringify({ success: false, error: { code, message, details } }),
    { status, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
  );
}

// ─── App initialization (Promise lock — runs once per isolate) ────────────────
async function initApp(envVars: Record<string, string>) {
  Object.assign(process.env, envVars);

  // Set JWT secret in runtimeSecrets singleton BEFORE importing app modules.
  // This ensures signToken/verifyToken always use the correct secret.
  runtimeSecrets.jwtSecret = envVars.JWT_SECRET || '';
  runtimeSecrets.jwtExpiresIn = envVars.JWT_EXPIRES_IN || '1d';
  runtimeSecrets.firebaseApiKey = envVars.FIREBASE_API_KEY || '';

  // firebase-admin is excluded intentionally: uses native gRPC incompatible with Edge.
  // Token verification is done via Firebase REST API in utils/auth-token.ts instead.
  const [{ app }, { connectDb }] = await Promise.all([
    import('./app'),
    import('./config/db'),
  ]);

  await connectDb(); // db.ts already has 10s timeout
  expressApp = app;
}

// ─── Request handler with timeout ─────────────────────────────────────────────
async function handleWithTimeout(request: Request, timeoutMs = 25000): Promise<Response> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`handleAsNodeRequest timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([handleAsNodeRequest(3000, request), timeout]);
}

// ─── Cloudflare Worker entry point ────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Record<string, string>, _ctx: ExecutionContext): Promise<Response> {
    const rawOrigin = request.headers.get('Origin') ?? '';
    const origin = isAllowedOrigin(rawOrigin) ? rawOrigin || '*' : 'null';
    const { pathname } = new URL(request.url);

    // 1. Preflight — always return immediately
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
    }

    // 2. Debug endpoints
    if (pathname === '/debug-init') {
      if (!initPromise) initPromise = initApp(env);
      const result = await initPromise
        .then(() => ({ ok: true, initialized: !!expressApp, jwtSecretSet: !!_jwtSecret }))
        .catch((e: Error) => ({ ok: false, error: e.message, stack: e.stack }));
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) }
      });
    }

    if (pathname === '/debug-jwt') {
      if (!initPromise) initPromise = initApp(env);
      await initPromise;
      const { signToken, verifyToken } = await import('./utils/jwt');
      try {
        const token = await signToken({ sub: 'debug-test', email: 'debug@test.com' });
        const verified = await verifyToken(token);
        return new Response(JSON.stringify({
          ok: true,
          tokenPreview: token.substring(0, 60) + '...',
          verified,
          secretLen: runtimeSecrets.jwtSecret.length,
        }), { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
      } catch (e: any) {
        return new Response(JSON.stringify({ ok: false, error: e.message, secretLen: runtimeSecrets.jwtSecret.length }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
      }
    }

    // 3. Main request flow
    try {
      // Promise lock: all concurrent requests wait on the same init promise
      if (!initPromise) {
        initPromise = initApp(env);
      }
      try {
        await initPromise;
      } catch (initErr: any) {
        // Reset so next request can retry
        initPromise = null;
        return errorResponse(origin, 503, 'INIT_FAILED', 'Backend failed to initialize', initErr.message);
      }

      // Forward request to Express via Node.js HTTP bridge (with 25s timeout)
      const response = await handleWithTimeout(request);

      // Force-inject CORS headers on ALL responses (even Express 500 errors)
      const newHeaders = new Headers(response.headers);
      for (const [k, v] of Object.entries(getCorsHeaders(origin))) {
        newHeaders.set(k, v);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });

    } catch (err: any) {
      // handleAsNodeRequest timed out or threw — still return CORS headers
      return errorResponse(origin, 500, 'WORKER_ERROR', 'Unexpected worker error', err.message);
    }
  },
};
