import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(process.cwd(), 'watch_party.db');
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initDbSchema(dbInstance);
  return dbInstance;
}

async function initDbSchema(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host_id TEXT NOT NULL,
      current_video_id TEXT NOT NULL,
      is_playing INTEGER NOT NULL DEFAULT 0,
      current_time REAL NOT NULL DEFAULT 0,
      last_updated INTEGER NOT NULL,
      mod_can_manage_roles INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_participants (
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      user_role TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS action_requests (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      action_type TEXT NOT NULL,
      payload TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      room_id TEXT NOT NULL,
      room_name TEXT NOT NULL,
      host_name TEXT NOT NULL,
      video_id TEXT NOT NULL,
      video_title TEXT NOT NULL,
      video_description TEXT,
      thumbnail_url TEXT,
      watched_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      autoplay INTEGER NOT NULL DEFAULT 1,
      sync_threshold REAL NOT NULL DEFAULT 1.5,
      theme TEXT NOT NULL DEFAULT 'light',
      notifications INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );
  `);
  console.log('[DB] SQLite database schema initialized successfully.');
}
