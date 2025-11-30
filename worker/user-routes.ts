import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Env } from './core-utils';
import { ok, bad, notFound, isStr } from './core-utils';
import type { Profile, User, Experience } from "@shared/types";
import { bearerAuth } from 'hono/bearer-auth';
import { D1UserStore } from './db';
import { generateToken, verifyToken as verifyJwt } from './auth';
import { hashPassword, verifyPassword } from './password';
import { log } from './logger';

// Schemas
const reservedUsernames = ['admin', 'root', 'api', 'dashboard', 'auth', 'login', 'signup', 'seals', 'profile', 'settings'];

const signupSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .refine(u => !reservedUsernames.includes(u.toLowerCase()), "Username is reserved"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  accountType: z.enum(['person', 'company', 'institution']),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const profileUpdateSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50),
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  links: z.object({
    twitter: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

const sealBioSchema = z.object({
  personHandle: z.string().min(1, "Target user handle is required"),
  role: z.string().min(1, "Role is required").max(100),
  period: z.string().min(1, "Period is required").max(50),
  description: z.string().max(280).optional(),
});

// Types
type JWTPayload = { user: { username: string; id: string } };
type AuthContext = Context<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>;

// Middleware & Helpers
const verifyToken = async (token: string, c: Context<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>) => {
  const secret = c.env.JWT_SECRET;
  if (!secret) {
    log.error("JWT_SECRET is not set!");
    return false;
  }

  const payload = await verifyJwt(token, secret);
  if (payload && payload.username && payload.id) {
    c.set('jwtPayload', { user: { username: payload.username, id: payload.id } });
    return true;
  }
  return false;
};

const handleValidationFailure = (c: Context, result: z.ZodError) => {
  const firstIssue = result.issues[0];
  const errorMessage = `'${firstIssue.path.join('.')}' field: ${firstIssue.message}.`;
  return bad(c, errorMessage);
};

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- PUBLIC ROUTES ---
  app.post('/api/signup', async (c) => {
    const body = await c.req.json();
    const result = signupSchema.safeParse(body);
    if (!result.success) return handleValidationFailure(c, result.error);

    const { password, accountType } = result.data;
    const username = result.data.username.trim();

    const userStore = new D1UserStore(c.env.DB);
    const existingUser = await userStore.findByUsername(username);
    if (existingUser) return bad(c, 'Username already taken');

    const passwordHash = await hashPassword(password);
    const avatarIcon = accountType === 'company' ? 'icons' : 'lorelei';
    const userId = crypto.randomUUID();

    const newUser: Omit<User, 'experiences'> = {
      id: userId,
      username,
      passwordHash,
      displayName: username,
      bio: `Welcome to my theirBio profile!`,
      avatarUrl: `https://api.dicebear.com/8.x/${avatarIcon}/svg?seed=${username}`,
      links: {},
      accountType,
    };

    await userStore.create(newUser);

    if (!c.env.JWT_SECRET) {
      log.error("JWT_SECRET missing during signup");
      return c.json({ success: false, error: "Server configuration error" }, 500);
    }

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