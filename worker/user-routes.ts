import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Env } from './core-utils';
import { ok, bad, notFound, isStr } from './core-utils';
import type { Profile, User, Experience } from "@shared/types";
import { bearerAuth } from 'hono/bearer-auth';
import { D1UserStore } from './db';
import { generateToken, verifyToken as verifyJwt } from './auth';

const token = await generateToken({ username, id: userId }, c.env.JWT_SECRET);
log.info(`New user signed up: ${username} (${accountType})`);
return ok(c, { user: { ...newUser, experiences: [] }, token });
  });

app.post('/api/login', async (c) => {
  const body = await c.req.json();
  const result = loginSchema.safeParse(body);
  if (!result.success) return handleValidationFailure(c, result.error);

  const { password } = result.data;
  const username = result.data.username.trim();

  const userStore = new D1UserStore(c.env.DB);
  const user = await userStore.findByUsername(username);
  if (!user) return notFound(c, 'User not found');

  // Verify password (support both legacy mock hash and new real hash)
  let isValid = false;
  if (user.passwordHash.startsWith('hashed_')) {
    // Legacy mock hash check
    isValid = user.passwordHash === `hashed_${password}`;
  } else {
    // Real hash check
    isValid = await verifyPassword(password, user.passwordHash);
  }

  if (!isValid) {
    log.warn(`Failed login attempt for user: ${username}`);
    return bad(c, 'Invalid credentials');
  }

  if (!c.env.JWT_SECRET) {
    log.error("JWT_SECRET missing during login");
    return c.json({ success: false, error: "Server configuration error" }, 500);
  }

  const token = await generateToken({ username, id: user.id }, c.env.JWT_SECRET);
  return ok(c, { user, token });
});

app.get('/api/users', async (c) => {
  const userStore = new D1UserStore(c.env.DB);
  const users = await userStore.listAll(100);

  const profiles: Profile[] = users.map(u => ({
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    links: u.links,
    accountType: u.accountType,
    experiences: u.experiences,
  }));

  return ok(c, profiles);
});

app.get('/api/users/:username', async (c) => {
  const username = c.req.param('username');
  if (!isStr(username)) return bad(c, 'Invalid username');

  const userStore = new D1UserStore(c.env.DB);
  const user = await userStore.findByUsername(username);
  if (!user) return notFound(c, 'User profile not found');

  const profile: Profile = {
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    links: user.links,
    accountType: user.accountType,
    experiences: user.experiences,
  };

  return ok(c, profile);
});

// --- AUTHENTICATED ROUTES ---
const authApp = new Hono<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>();
authApp.use('*', bearerAuth({ verifyToken }));

// Profile Management
const profileRoutes = new Hono<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>();

profileRoutes.put('/', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401);

  const body = await c.req.json();
  const result = profileUpdateSchema.safeParse(body);
  if (!result.success) return handleValidationFailure(c, result.error);

  const username = payload.user.username;
  const profileData = result.data;

  const userStore = new D1UserStore(c.env.DB);
  const user = await userStore.findByUsername(username);
  if (!user) return notFound(c, 'User not found');

  await userStore.updateProfile(user.id, profileData);
  const updatedUser = await userStore.findByUsername(username);

  log.info(`Profile updated for user: ${username}`);
  return ok(c, updatedUser);
});

profileRoutes.delete('/', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401);

  const username = payload.user.username;

  const userStore = new D1UserStore(c.env.DB);
  const user = await userStore.findByUsername(username);
  if (!user) return notFound(c, 'User not found');

  const deleted = await userStore.delete(user.id);
  if (!deleted) return notFound(c, 'User not found or already deleted.');

  log.info(`Account deleted: ${username}`);
  return ok(c, { message: 'Account deleted successfully' });
});

authApp.route('/profile', profileRoutes);

// Authenticated Seal Requests
const sealRoutes = new Hono<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>();

sealRoutes.post('/request', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401);

  const body = await c.req.json();
  const result = sealBioSchema.safeParse(body);
  if (!result.success) return handleValidationFailure(c, result.error);

  const { personHandle, role, period, description } = result.data;
  const requesterUsername = payload.user.username;

  const userStore = new D1UserStore(c.env.DB);
  const requester = await userStore.findByUsername(requesterUsername);

  // Only companies can seal (for now)
  if (!requester || requester.accountType !== 'company') {
    return bad(c, 'Only company accounts can issue seals.');
  }

  const personUser = await userStore.findByUsername(personHandle);
  if (!personUser) return notFound(c, 'Target user profile not found.');

  if (personUser.accountType !== 'person') {
    return bad(c, 'Bios can only be sealed for personal accounts.');
  }

  // Create pending seal (is_verified = 0)
  const experienceId = crypto.randomUUID();
  await c.env.DB.prepare(`
      INSERT INTO experiences (id, user_id, role, organization_name, period, description, is_verified, sealed_by_user_id, sealed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
    experienceId,
    personUser.id,
    role,
    requester.displayName || requester.username,
    period,
    description || '',
    0, // is_verified = 0 (Pending)
    requester.id,
    Math.floor(Date.now() / 1000)
  ).run();

  log.info(`Seal requested by ${requesterUsername} for ${personHandle}`);
  return ok(c, { message: 'Seal request sent successfully' });
});

authApp.route('/seals', sealRoutes);

// Mount the auth-required routes
app.route('/api', authApp);
}