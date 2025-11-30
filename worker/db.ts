import type { User, Profile, Experience } from '@shared/types';

export class D1UserStore {
    constructor(private db: any) { } // Will be D1Database after types are generated

    async findByUsername(username: string): Promise<User | null> {
        const userRow = await this.db
            .prepare(`SELECT * FROM users WHERE username = ?`)
            .bind(username)
            .first();

        if (!userRow) return null;

        const profileRow = await this.db
            .prepare(`SELECT * FROM profiles WHERE user_id = ?`)
            .bind(userRow.id)
            .first();

        const experiencesRows = await this.db
            .prepare(`SELECT * FROM experiences WHERE user_id = ? AND is_verified = 1`)
            .bind(userRow.id)
            .all();

        const linksRows = await this.db
            .prepare(`SELECT * FROM links WHERE user_id = ?`)
            .bind(userRow.id)
            .all();

        return this.mapToUser(userRow, profileRow, experiencesRows.results || [], linksRows.results || []);
    }

    async findByEmail(email: string): Promise<User | null> {
        const userRow = await this.db
            .prepare(`SELECT * FROM users WHERE email = ?`)
            .bind(email)
            .first();

        if (!userRow) return null;

        const profileRow = await this.db
            .prepare(`SELECT * FROM profiles WHERE user_id = ?`)
            .bind(userRow.id)
            .first();

        const experiencesRows = await this.db
            .prepare(`SELECT * FROM experiences WHERE user_id = ? AND is_verified = 1`)
            .bind(userRow.id)
            .all();

        const linksRows = await this.db
            .prepare(`SELECT * FROM links WHERE user_id = ?`)
            .bind(userRow.id)
            .all();

        return this.mapToUser(userRow, profileRow, experiencesRows.results || [], linksRows.results || []);
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        const userRow = await this.db
            .prepare(`SELECT * FROM users WHERE google_id = ?`)
            .bind(googleId)
            .first();

        if (!userRow) return null;

        const profileRow = await this.db
            .prepare(`SELECT * FROM profiles WHERE user_id = ?`)
            .bind(userRow.id)
            .first();

        const experiencesRows = await this.db
            .prepare(`SELECT * FROM experiences WHERE user_id = ? AND is_verified = 1`)
            .bind(userRow.id)
            .all();

        const linksRows = await this.db
            .prepare(`SELECT * FROM links WHERE user_id = ?`)
            .bind(userRow.id)
            .all();

        return this.mapToUser(userRow, profileRow, experiencesRows.results || [], linksRows.results || []);
    }


    async findById(id: string): Promise<User | null> {
        const userRow = await this.db
            .prepare(`SELECT * FROM users WHERE id = ?`)
            .bind(id)
            .first();

        if (!userRow) return null;

        const profileRow = await this.db
            .prepare(`SELECT * FROM profiles WHERE user_id = ?`)
            .bind(userRow.id)
            .first();

        const experiencesRows = await this.db
            .prepare(`SELECT * FROM experiences WHERE user_id = ? AND is_verified = 1`)
            .bind(userRow.id)
            .all();

        const linksRows = await this.db
            .prepare(`SELECT * FROM links WHERE user_id = ?`)
            .bind(userRow.id)
            .all();

        return this.mapToUser(userRow, profileRow, experiencesRows.results || [], linksRows.results || []);
    }

    async create(user: Omit<User, 'experiences'>): Promise<void> {
        // Insert user
        await this.db
            .prepare(`
        INSERT INTO users (id, username, email, google_id, password_hash, account_type, credits, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
            .bind(
                user.id,
                user.username,
                user.email || null,
                user.googleId || null,
                user.passwordHash,
                user.accountType,
                0,
                Math.floor(Date.now() / 1000)
            )
            .run();

        // Insert profile
        await this.db
            .prepare(`
        INSERT INTO profiles (user_id, display_name, bio, avatar_url, theme_config)
        VALUES (?, ?, ?, ?, ?)
      `)
            .bind(
                user.id,
                user.displayName || user.username,
                user.bio || '',
                user.avatarUrl || '',
                null
            )
            .run();
    }

    async listAll(limit: number = 100): Promise<User[]> {
        const usersRows = await this.db
            .prepare(`SELECT * FROM users LIMIT ?`)
            .bind(limit)
            .all();

        const users: User[] = [];
        for (const userRow of usersRows.results || []) {
            const profileRow = await this.db
                .prepare(`SELECT * FROM profiles WHERE user_id = ?`)
                .bind(userRow.id)
                .first();

            const experiencesRows = await this.db
                .prepare(`SELECT * FROM experiences WHERE user_id = ? AND is_verified = 1`)
                .bind(userRow.id)
                .all();

            const linksRows = await this.db
                .prepare(`SELECT * FROM links WHERE user_id = ?`)
                .bind(userRow.id)
                .all();

            users.push(this.mapToUser(userRow, profileRow, experiencesRows.results || [], linksRows.results || []));
        }

        return users;
    }

    async updateProfile(userId: string, profileData: Partial<Profile>): Promise<void> {
        try {
            const updates: string[] = [];
            const params: any[] = [];

            if (profileData.displayName !== undefined) {
                updates.push('display_name = ?');
                params.push(profileData.displayName);
            }
            if (profileData.bio !== undefined) {
                updates.push('bio = ?');
                params.push(profileData.bio);
            }
            if (profileData.avatarUrl !== undefined) {
                updates.push('avatar_url = ?');
                params.push(profileData.avatarUrl);
            }

            if (updates.length === 0) return;

            params.push(userId);
            const result = await this.db
                .prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`)
                .bind(...params)
                .run();

            console.log('Profile update result:', result);

            // Handle links separately if provided
            if (profileData.links) {
                await this.updateLinks(userId, profileData.links);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    async updateLinks(userId: string, links: any): Promise<void> {
        // Delete existing social links (we'll identify them by icon for now, or just wipe all for this user since we only support these 4)
        // For now, let's wipe all links for the user to keep it simple and consistent with the fixed SocialLinks type
        await this.db.prepare('DELETE FROM links WHERE user_id = ?').bind(userId).run();

        const linkItems = [
            { key: 'twitter', url: links.twitter, title: 'Twitter' },
            { key: 'github', url: links.github, title: 'GitHub' },
            { key: 'website', url: links.website, title: 'Website' },
            { key: 'linkedin', url: links.linkedin, title: 'LinkedIn' },
        ].filter(item => item.url);

        if (linkItems.length === 0) return;

        const stmt = this.db.prepare(`
            INSERT INTO links (id, user_id, title, url, icon, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const batch = linkItems.map((item, index) => stmt.bind(
            crypto.randomUUID(),
            userId,
            item.title,
            item.url,
            item.key,
            index,
            Math.floor(Date.now() / 1000)
        ));

        await this.db.batch(batch);
    }

    async delete(userId: string): Promise<boolean> {
        const result = await this.db
            .prepare(`DELETE FROM users WHERE id = ?`)
            .bind(userId)
            .run();

        return result.meta.changes > 0;
    }

    private mapToUser(userRow: any, profileRow: any, experiencesRows: any[], linksRows: any[] = []): User {
        const links: any = {};
        linksRows.forEach((link: any) => {
            if (['twitter', 'github', 'website', 'linkedin'].includes(link.icon)) {
                links[link.icon] = link.url;
            }
        });

        return {
            id: userRow.id,
            username: userRow.username,
            email: userRow.email || undefined,
            googleId: userRow.google_id || undefined,
            passwordHash: userRow.password_hash,
            displayName: profileRow?.display_name || userRow.username,
            bio: profileRow?.bio || '',
            avatarUrl: profileRow?.avatar_url || '',
            links: links,
            accountType: userRow.account_type as 'person' | 'company' | 'institution',
            experiences: experiencesRows.map((exp: any) => ({
                role: exp.role,
                period: exp.period,
                description: exp.description || '',
                sealedByOrgId: exp.sealed_by_user_id,
                sealedByOrgName: exp.organization_name,
                sealedByOrgAvatarUrl: '',
                sealedAt: new Date(exp.sealed_at * 1000).toISOString(),
            })),
        };
    }
}
