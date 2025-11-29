import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Env } from './core-utils';
import { ok, bad, notFound, isStr } from './core-utils';
import type { Profile, User, Experience } from "@shared/types";
import { bearerAuth } from 'hono/bearer-auth';
import { D1UserStore } from './db';

// Schemas
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
type JWTPayload = { user: { username: string; }; };
type AuthContext = Context<{ Bindings: Env; Variables: { jwtPayload: JWTPayload } }>;

// Middleware & Helpers
const verifyToken = async (token: string, c: Context<{ Bindings: Env }>) => {
  if (token.startsWith('mock-jwt-for-')) {
    const username = token.replace('mock-jwt-for-', '').trim();
    const userStore = new D1UserStore(c.env.DB);
    const user = await userStore.findByUsername(username);
    if (user) {
      return { user: { username } } as any;
    }
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

    const passwordHash = `hashed_${password}`;
    const avatarIcon = accountType === 'company' ? 'icons' : 'lorelei';

    const newUser: Omit<User, 'experiences'> = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      displayName: username,
      bio: `Welcome to my theirBio profile!`,
      avatarUrl: `https://api.dicebear.com/8.x/${avatarIcon}/svg?seed=${username}`,
      links: {},
      accountType,
    };

    await userStore.create(newUser);
    const token = `mock-jwt-for-${username}`;
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

    const mockHashedPassword = `hashed_${password}`;
    if (user.passwordHash !== mockHashedPassword) return bad(c, 'Invalid credentials');

    const token = `mock-jwt-for-${username}`;
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

    return ok(c, { message: 'Account deleted successfully' });
  });

  authApp.route('/profile', profileRoutes);

  // Seal Bio Management (Now public for demo)
  const sealRoutes = new Hono<{ Bindings: Env }>();

  sealRoutes.post('/', async (c) => {
    // Authentication removed for demo mode
    const body = await c.req.json();
    const result = sealBioSchema.safeParse(body);
    if (!result.success) return handleValidationFailure(c, result.error);

    const { personHandle, role, period, description } = result.data;

    const userStore = new D1UserStore(c.env.DB);
    const personUser = await userStore.findByUsername(personHandle);
    if (!personUser) {
      return notFound(c, 'Target user profile not found.');
    }

    if (personUser.accountType !== 'person') {
      return bad(c, 'Bios can only be sealed for personal accounts.');
    }

    // Insert experience directly into D1
    const experienceId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO experiences (id, user_id, role, organization_name, period, description, is_verified, sealed_by_user_id, sealed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      experienceId,
      personUser.id,
      role,
      'Demo Company',
      period,
      description || '',
      1, // is_verified
      'demo_company',
      Math.floor(Date.now() / 1000)
    ).run();

    const newExperience: Experience = {
      role,
      period,
      description: description || '',
      sealedByOrgId: 'demo_company',
      sealedByOrgName: 'Demo Company',
      sealedByOrgAvatarUrl: `https://api.dicebear.com/8.x/icons/svg?seed=demo`,
      sealedAt: new Date().toISOString(),
    };

    return c.json({ success: true, data: newExperience }, 201);
  });

  // This route is now attached to the main app to be public
  app.route('/api/seals', sealRoutes);

  // Mount the auth-required routes
  app.route('/api', authApp);
}