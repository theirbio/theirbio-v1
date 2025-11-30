import { Hono } from 'hono';
import { Env } from './core-utils';
import { D1UserStore } from './db';
import { generateToken } from './auth';
import { log } from './logger';
import type { User } from '@shared/types';

export const authRoutes = (app: Hono<{ Bindings: Env }>) => {
    const auth = new Hono<{ Bindings: Env }>();

    // Initiate Google OAuth flow
    auth.get('google', (c) => {
        const clientId = c.env.GOOGLE_CLIENT_ID;
        const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;

        const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        googleAuthUrl.searchParams.set('client_id', clientId);
        googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
        googleAuthUrl.searchParams.set('response_type', 'code');
        googleAuthUrl.searchParams.set('scope', 'openid email profile');
        googleAuthUrl.searchParams.set('access_type', 'offline');
        googleAuthUrl.searchParams.set('prompt', 'consent');

        return c.redirect(googleAuthUrl.toString());
    });

    // Handle Google OAuth callback
    auth.get('google/callback', async (c) => {
        const code = c.req.query('code');
        const error = c.req.query('error');

        if (error) {
            log.error(`Google OAuth error: ${error}`);
            return c.redirect(`/?error=oauth_failed`);
        }

        if (!code) {
            return c.redirect('/?error=no_code');
        }

        try {
            // Exchange code for access token
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: c.env.GOOGLE_CLIENT_ID,
                    client_secret: c.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: `${new URL(c.req.url).origin}/auth/google/callback`,
                    grant_type: 'authorization_code',
                }),
            });

            if (!tokenResponse.ok) {
                log.error('Failed to exchange code for token');
                return c.redirect('/?error=token_exchange_failed');
            }

            const tokens = await tokenResponse.json<{ access_token: string; id_token: string }>();

            // Get user info from Google
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });

            if (!userInfoResponse.ok) {
                log.error('Failed to get user info from Google');
                return c.redirect('/?error=userinfo_failed');
            }

            const googleUser = await userInfoResponse.json<{
                id: string;
                email: string;
                name: string;
                picture: string;
            }>();

            const userStore = new D1UserStore(c.env.DB);

            // Check if user exists by Google ID
            let user = await userStore.findByGoogleId(googleUser.id);

            if (!user) {
                // Check if user exists by email (account linking)
                user = await userStore.findByEmail(googleUser.email);

                if (user) {
                    // Link Google account to existing user
                    await c.env.DB.prepare(`UPDATE users SET google_id = ? WHERE id = ?`)
                        .bind(googleUser.id, user.id)
                        .run();

                    user.googleId = googleUser.id;
                    log.info(`Linked Google account to existing user: ${user.username}`);
                } else {
                    // Create new user from Google account
                    const userId = crypto.randomUUID();
                    const username = googleUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `user${Date.now()}`;

                    const newUser: Omit<User, 'experiences'> = {
                        id: userId,
                        username,
                        email: googleUser.email,
                        googleId: googleUser.id,
                        passwordHash: '', // No password for Google users
                        displayName: googleUser.name,
                        bio: 'Welcome to my theirBio profile!',
                        avatarUrl: googleUser.picture,
                        links: {},
                        accountType: 'person',
                    };

                    await userStore.create(newUser);
                    user = { ...newUser, experiences: [] };
                    log.info(`Created new user from Google: ${username}`);
                }
            }

            // Generate JWT
            const token = await generateToken(
                { username: user.username, id: user.id },
                c.env.JWT_SECRET
            );

            // Redirect to frontend with token
            return c.redirect(`/?token=${token}`);

        } catch (error) {
            log.error('Google OAuth error:', error);
            return c.redirect('/?error=server_error');
        }
    });

    app.route('/auth', auth);
};
