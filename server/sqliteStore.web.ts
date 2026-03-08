/**
 * Web-compatible SQLite Store
 * Uses sql.js without Electron dependencies
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import os from 'os';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

type ChangePayload<T = unknown> = {
  key: string;
  newValue: T | undefined;
  oldValue: T | undefined;
};

const DB_FILENAME = 'lobsterai.sqlite';

export class SqliteStore {
  private db: Database;
  private dbPath: string;
  private emitter = new EventEmitter();
  private static sqlPromise: Promise<SqlJsStatic> | null = null;

  private constructor(db: Database, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  static async create(userDataPath?: string): Promise<SqliteStore> {
    const basePath = userDataPath || path.join(os.homedir(), '.lobsterai', 'web');

    // Ensure directory exists
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    const dbPath = path.join(basePath, DB_FILENAME);

    // Initialize SQL.js
    if (!SqliteStore.sqlPromise) {
      SqliteStore.sqlPromise = initSqlJs({
        locateFile: (file: string) => {
          // For web server, load from node_modules
          return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
        }
      });
    }

    const SQL = await SqliteStore.sqlPromise;

    let db: Database;
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    const store = new SqliteStore(db, dbPath);
    store.initTables();
    return store;
  }

  private initTables(): void {
    // Key-value store table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Cowork sessions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cowork_sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        status TEXT DEFAULT 'idle',
        pinned INTEGER DEFAULT 0,
        cwd TEXT,
        system_prompt TEXT,
        execution_mode TEXT DEFAULT 'auto',
        active_skill_ids TEXT DEFAULT '[]',
        created_at INTEGER,
        updated_at INTEGER
      )
    `);

    // Cowork messages table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cowork_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT,
        timestamp INTEGER,
        metadata TEXT,
        FOREIGN KEY (session_id) REFERENCES cowork_sessions(id)
      )
    `);

    // MCP servers table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS mcp_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        enabled INTEGER DEFAULT 1,
        transport_type TEXT DEFAULT 'stdio',
        command TEXT,
        args TEXT DEFAULT '[]',
        env TEXT DEFAULT '{}',
        url TEXT,
        headers TEXT DEFAULT '{}',
        is_built_in INTEGER DEFAULT 0,
        github_url TEXT,
        registry_id TEXT,
        created_at INTEGER,
        updated_at INTEGER
      )
    `);

    // Scheduled tasks table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        enabled INTEGER DEFAULT 1,
        schedule TEXT NOT NULL,
        prompt TEXT NOT NULL,
        working_directory TEXT,
        system_prompt TEXT,
        execution_mode TEXT DEFAULT 'auto',
        expires_at TEXT,
        notify_platforms TEXT DEFAULT '[]',
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // Task runs table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS scheduled_task_runs (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        session_id TEXT,
        status TEXT DEFAULT 'running',
        started_at TEXT,
        finished_at TEXT,
        duration_ms INTEGER,
        error TEXT,
        trigger TEXT DEFAULT 'scheduled',
        FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id)
      )
    `);

    // User memories table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_memories (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        confidence REAL DEFAULT 0.5,
        status TEXT DEFAULT 'created',
        is_explicit INTEGER DEFAULT 0,
        source_session_id TEXT,
        created_at INTEGER,
        updated_at INTEGER
      )
    `);

    this.save();
  }

  getDatabase(): Database {
    return this.db;
  }

  getSaveFunction(): () => void {
    return () => this.save();
  }

  save(): void {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  get<T>(key: string): T | undefined {
    const result = this.db.exec('SELECT value FROM kv WHERE key = ?', [key]);
    if (result.length === 0 || result[0].values.length === 0) {
      return undefined;
    }
    try {
      return JSON.parse(result[0].values[0][0] as string) as T;
    } catch {
      return undefined;
    }
  }

  set<T>(key: string, value: T): void {
    const oldValue = this.get(key);
    const valueStr = JSON.stringify(value);

    this.db.run(
      'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)',
      [key, valueStr]
    );
    this.save();

    this.emitter.emit('change', {
      key,
      newValue: value,
      oldValue,
    } as ChangePayload<T>);
  }

  delete(key: string): void {
    const oldValue = this.get(key);
    this.db.run('DELETE FROM kv WHERE key = ?', [key]);
    this.save();

    this.emitter.emit('change', {
      key,
      newValue: undefined,
      oldValue,
    } as ChangePayload);
  }

  onChange(callback: (payload: ChangePayload) => void): () => void {
    this.emitter.on('change', callback);
    return () => this.emitter.off('change', callback);
  }
}

export default SqliteStore;
