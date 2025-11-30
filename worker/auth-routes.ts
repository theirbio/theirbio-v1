import { Hono } from 'hono';
import { Env } from './core-utils';

export const authRoutes = (app: Hono<{ Bindings: Env }>) => {
    const auth = new Hono<{ Bindings: Env }>();

    auth.get('/google', (c) => {
        return c.text('Google Auth not implemented yet', 501);
    });

    auth.get('/google/callback', (c) => {
        return c.text('Google Callback not implemented yet', 501);
    });

    app.route('/auth', auth);
};
