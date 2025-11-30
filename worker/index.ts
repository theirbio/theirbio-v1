// Making changes to this file is **STRICTLY** forbidden. Please add your routes in `userRoutes.ts` file.
// Deployment trigger: Google OAuth routes enabled

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { userRoutes } from './user-routes';
import { authRoutes } from './auth-routes';
import { Env, GlobalDurableObject } from './core-utils';
import { log } from './logger';
import { errorHandler } from './errors';

// Need to export GlobalDurableObject to make it available in wrangler
export { GlobalDurableObject };
export interface ClientErrorReport {
  message: string;
  url: string;
  userAgent: string;
  timestamp: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: boolean;
  errorBoundaryProps?: Record<string, unknown>;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: unknown;
}
const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());

// Apply CORS to all routes (including /auth/*)
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',') || [];
  // Fallback for local dev if not set
  if (allowedOrigins.length === 0) allowedOrigins.push('http://localhost:3000');

  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0]; // Default to first allowed
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Register routes - ORDER MATTERS!
app.get('/test-debug', (c) => c.text('Debug route works!'));

authRoutes(app);
userRoutes(app);

app.get('/api/health', (c) => c.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } }));

app.post('/api/client-errors', async (c) => {
  try {
    const e = await c.req.json<ClientErrorReport>();
    if (!e.message) return c.json({ success: false, error: 'Missing required fields' }, 400);
    log.error('[CLIENT ERROR]', e);
    return c.json({ success: true });
  } catch (error) {
    log.error('[CLIENT ERROR HANDLER] Failed:', error);
    return c.json({ success: false, error: 'Failed to process' }, 500);
  }
});

app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));
app.onError(errorHandler);

console.log('Server is running')

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;