-- Migration number: 0001_initial_schema.sql

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  password_hash TEXT,
  account_type TEXT CHECK(account_type IN ('person', 'company', 'institution')) DEFAULT 'person',
  credits INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

DROP TABLE IF EXISTS profiles;
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  theme_config TEXT -- JSON: { mode: 'light'|'dark', color: string, font: string, layout: 'center'|'left' }
);

DROP TABLE IF EXISTS experiences;
CREATE TABLE experiences (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT,
  is_verified BOOLEAN DEFAULT 0,
  sealed_by_user_id TEXT REFERENCES users(id),
  sealed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

DROP TABLE IF EXISTS links;
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT,
  icon TEXT,
  sort_order INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Index for faster lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_experiences_user_id ON experiences(user_id);
CREATE INDEX idx_links_user_id ON links(user_id);
