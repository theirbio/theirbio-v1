import { Hono, type Context } from "hono";
import { z } from "zod";
import type { Env } from './core-utils';
import { UserEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Profile, User, Experience } from "@shared/types";
import { bearerAuth } from 'hono/bearer-auth';
// Schemas
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  accountType: z.enum(['person', 'company']),
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
    const userEntity = new UserEntity(c.env, username);
    if (await userEntity.exists()) {
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
    const userEntity = new UserEntity(c.env, username);
    if (await userEntity.exists()) return bad(c, 'Username already taken');
    const passwordHash = `hashed_${password}`;
    const avatarIcon = accountType === 'company' ? 'icons' : 'lorelei';
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      displayName: username,
      bio: `Welcome to my theirBio profile!`,
      avatarUrl: `https://api.dicebear.com/8.x/${avatarIcon}/svg?seed=${username}`,
      links: {},
      accountType,
      experiences: [],
    };
    await UserEntity.create(c.env, newUser);
    const token = `mock-jwt-for-${username}`;
    return ok(c, { user: newUser, token });
  });
  app.post('/api/login', async (c) => {
    const body = await c.req.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) return handleValidationFailure(c, result.error);
    const { password } = result.data;
    const username = result.data.username.trim();
    const userEntity = new UserEntity(c.env, username);
    if (!await userEntity.exists()) return notFound(c, 'User not found');
    const user = await userEntity.getState();
    const mockHashedPassword = `hashed_${password}`;
    if (user.passwordHash !== mockHashedPassword) return bad(c, 'Invalid credentials');
    const token = `mock-jwt-for-${username}`;
    return ok(c, { user, token });
  });
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const { items: users } = await UserEntity.list(c.env, null, 100);
    const validUsers = users.filter(u => u && u.id && u.username);
    const profiles: Profile[] = validUsers.map(u => ({
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
    const userEntity = new UserEntity(c.env, username);
    if (!await userEntity.exists()) return notFound(c, 'User profile not found');
    const profile = await userEntity.getProfile();
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
    const userEntity = new UserEntity(c.env, username);
    if (!await userEntity.exists()) return notFound(c, 'User not found');
    const updatedProfile = await userEntity.updateProfile(profileData);
    const fullUser = await userEntity.getState();
    return ok(c, { ...fullUser, ...updatedProfile });
  });
  profileRoutes.delete('/', async (c) => {
    const payload = c.get('jwtPayload');
    if (!payload) return c.json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401);
    const username = payload.user.username;
    const deleted = await UserEntity.delete(c.env, username);
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
    const personEntity = new UserEntity(c.env, personHandle);
    if (!await personEntity.exists()) {
      return notFound(c, 'Target user profile not found.');
    }
    const personUser = await personEntity.getState();
    if (personUser.accountType !== 'person') {
      return bad(c, 'Bios can only be sealed for personal accounts.');
    }
    // Hardcoded sealer details for demo mode
    const newExperience: Experience = {
      role,
      period,
      description: description || '',
      sealedByOrgId: 'demo_company',
      sealedByOrgName: 'Demo Company',
      sealedByOrgAvatarUrl: `https://api.dicebear.com/8.x/icons/svg?seed=demo`,
      sealedAt: new Date().toISOString(),
    };
    await personEntity.mutate(s => ({
      ...s,
      experiences: [...(s.experiences || []), newExperience],
    }));
    return c.json({ success: true, data: newExperience }, 201);
  });
  // This route is now attached to the main app to be public
  app.route('/api/seals', sealRoutes);
  // Mount the auth-required routes
  app.route('/api', authApp);
}