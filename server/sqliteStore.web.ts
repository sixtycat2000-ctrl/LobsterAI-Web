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
        title TEXT NOT NULL,
        claude_session_id TEXT,
        status TEXT NOT NULL DEFAULT 'idle',
        pinned INTEGER NOT NULL DEFAULT 0,
        cwd TEXT NOT NULL,
        system_prompt TEXT NOT NULL DEFAULT '',
        execution_mode TEXT,
        active_skill_ids TEXT DEFAULT '[]',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Cowork messages table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cowork_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER NOT NULL,
        sequence INTEGER,
        FOREIGN KEY (session_id) REFERENCES cowork_sessions(id) ON DELETE CASCADE
      )
    `);

    // MCP servers table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS mcp_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        enabled INTEGER NOT NULL DEFAULT 1,
        transport_type TEXT NOT NULL DEFAULT 'stdio',
        config_json TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
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
        updated_at TEXT,
        running_at_ms INTEGER,
        last_status TEXT,
        last_error TEXT,
        last_run_at TEXT
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
        running_at_ms INTEGER,
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
        fingerprint TEXT NOT NULL,
        created_at INTEGER,
        updated_at INTEGER,
        last_used_at INTEGER
      )
    `);

    // User memory sources table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_memory_sources (
        id TEXT PRIMARY KEY,
        memory_id TEXT NOT NULL,
        session_id TEXT,
        message_id TEXT,
        role TEXT NOT NULL DEFAULT 'system',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (memory_id) REFERENCES user_memories(id) ON DELETE CASCADE
      )
    `);

    // Cowork config table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cowork_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Migration: Fix mcp_servers table schema if it has old columns
    this.migrateMcpServersTable();

    this.save();
  }

  private migrateMcpServersTable(): void {
    // Check if mcp_servers has old schema (with 'command' column instead of 'config_json')
    const colsResult = this.db.exec("PRAGMA table_info(mcp_servers);");
    if (colsResult.length === 0) return; // Table doesn't exist yet

    const columns = colsResult[0].values.map((row) => row[1] as string);

    // If 'command' column exists but 'config_json' doesn't, we need to migrate
    if (columns.includes('command') && !columns.includes('config_json')) {
      console.log('[Migration] Migrating mcp_servers table to new schema...');

      // Read existing data
      const existingData = this.db.exec('SELECT * FROM mcp_servers;');
      const oldRows = existingData[0]?.values || [];

      // Drop old table and recreate with new schema
      this.db.run('DROP TABLE mcp_servers;');
      this.db.run(`
        CREATE TABLE mcp_servers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL DEFAULT '',
          enabled INTEGER NOT NULL DEFAULT 1,
          transport_type TEXT NOT NULL DEFAULT 'stdio',
          config_json TEXT NOT NULL DEFAULT '{}',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);

      // Migrate data - convert old columns to config_json
      const colNames = existingData[0]?.columns || [];
      for (const row of oldRows) {
        const rowData = Object.fromEntries(
          colNames.map((col, i) => [col, row[i]])
        ) as Record<string, unknown>;

        const configJson: Record<string, unknown> = {};
        if (rowData.command) configJson.command = rowData.command;
        if (rowData.args) configJson.args = JSON.parse(rowData.args as string || '[]');
        if (rowData.env) configJson.env = JSON.parse(rowData.env as string || '{}');
        if (rowData.url) configJson.url = rowData.url;
        if (rowData.headers) configJson.headers = JSON.parse(rowData.headers as string || '{}');
        if (rowData.is_built_in) configJson.isBuiltIn = true;
        if (rowData.github_url) configJson.githubUrl = rowData.github_url;
        if (rowData.registry_id) configJson.registryId = rowData.registry_id;

        this.db.run(
          `INSERT INTO mcp_servers (id, name, description, enabled, transport_type, config_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rowData.id as string,
            rowData.name as string,
            (rowData.description as string) || '',
            (rowData.enabled as number) ?? 1,
            (rowData.transport_type as string) || 'stdio',
            JSON.stringify(configJson),
            (rowData.created_at as number) || Date.now(),
            (rowData.updated_at as number) || Date.now(),
          ]
        );
      }

      console.log(`[Migration] Migrated ${oldRows.length} MCP server(s)`);
    }
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

  // Alias for compatibility with main process SqliteStore
  initializeTables(): void {
    this.initTables();
  }

  // Event listener methods for compatibility
  onDidChange(callback: (payload: ChangePayload) => void): () => void {
    return this.onChange(callback);
  }

  // Legacy memory methods (no-op for web version)
  tryReadLegacyMemoryText(): { text: string } | null {
    return null;
  }

  parseLegacyMemoryEntries(): { id: string; text: string }[] {
    return [];
  }

  // User memories methods
  getUserMemories(): Array<{ id: string; text: string; confidence: number; status: string }> {
    const result = this.db.exec('SELECT id, text, confidence, status FROM user_memories WHERE status != "deleted"');
    if (result.length === 0) return [];
    return result[0].values.map((row) => ({
      id: row[0] as string,
      text: row[1] as string,
      confidence: row[2] as number,
      status: row[3] as string,
    }));
  }

  // Additional methods for compatibility
  memoryFingerprint(): string {
    return '';
  }

  migrateLegacyMemoryFileToUserMemories(): Promise<number> {
    return Promise.resolve(0);
  }

  migrateFromElectronStore(): Promise<void> {
    return Promise.resolve();
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
