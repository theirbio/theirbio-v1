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

        return this.mapToUser(userRow, profileRow, experiencesRows.results || []);
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

        return this.mapToUser(userRow, profileRow, experiencesRows.results || []);
    }

    async create(user: Omit<User, 'experiences'>, email?: string): Promise<void> {
        // Insert user
        await this.db
            .prepare(`
        INSERT INTO users (id, username, email, password_hash, account_type, credits, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
            .bind(
                user.id,
                user.username,
                email || `${user.username}@placeholder.com`,
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

            users.push(this.mapToUser(userRow, profileRow, experiencesRows.results || []));
        }

        return users;
    }

    async updateProfile(userId: string, profileData: Partial<Profile>): Promise<void> {
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
        await this.db
            .prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`)
            .bind(...params)
            .run();

        // Handle links separately if provided
        if (profileData.links) {
            // For now, we'll store links in a simple format
            // In a production app, you'd have a separate links table
        }
    }

    async delete(userId: string): Promise<boolean> {
        const result = await this.db
            .prepare(`DELETE FROM users WHERE id = ?`)
            .bind(userId)
            .run();

        return result.meta.changes > 0;
    }

    private mapToUser(userRow: any, profileRow: any, experiencesRows: any[]): User {
        return {
            id: userRow.id,
            username: userRow.username,
            passwordHash: userRow.password_hash,
            displayName: profileRow?.display_name || userRow.username,
            bio: profileRow?.bio || '',
            avatarUrl: profileRow?.avatar_url || '',
            links: {}, // TODO: Implement links storage
            accountType: userRow.account_type as 'person' | 'company',
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
