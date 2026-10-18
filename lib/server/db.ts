import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import path from 'node:path';

export function dataDirectory() {
  if (process.env.VERCEL)
    throw new Error(
      'SQLite 저장 모드는 Vercel에서 지원하지 않습니다. 영구 디스크가 있는 Node.js 서버에서 실행하세요.',
    );
  return path.resolve(
    /* turbopackIgnore: true */ process.env.DOCUMIND_DATA_DIR || path.join(process.cwd(), 'data'),
  );
}
export function openDatabase(directory: string) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const filename = path.join(directory, 'documind.sqlite');
  const db = new DatabaseSync(filename);
  chmodSync(filename, 0o600);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY);
    INSERT OR IGNORE INTO schema_version VALUES(1);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,company TEXT NOT NULL DEFAULT '',password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS auth_attempts(key TEXT PRIMARY KEY,attempts INTEGER NOT NULL,reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,file_type TEXT NOT NULL,size_bytes INTEGER NOT NULL,category TEXT NOT NULL DEFAULT '미분류',status TEXT NOT NULL DEFAULT 'processing',chunk_count INTEGER NOT NULL DEFAULT 0,page_count INTEGER NOT NULL DEFAULT 0,extracted_text TEXT NOT NULL DEFAULT '',error_message TEXT,processing_token TEXT,processing_started_at INTEGER,created_at TEXT NOT NULL,UNIQUE(id,user_id));
    CREATE INDEX IF NOT EXISTS documents_user ON documents(user_id,created_at);
    CREATE TABLE IF NOT EXISTS document_chunks(id TEXT PRIMARY KEY,document_id TEXT NOT NULL,user_id TEXT NOT NULL,position INTEGER NOT NULL,content TEXT NOT NULL,FOREIGN KEY(document_id,user_id) REFERENCES documents(id,user_id) ON DELETE CASCADE,UNIQUE(document_id,position));
    CREATE INDEX IF NOT EXISTS chunks_user ON document_chunks(user_id,document_id);
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(content,content='document_chunks',content_rowid='rowid',tokenize='unicode61');
    CREATE TRIGGER IF NOT EXISTS chunks_insert AFTER INSERT ON document_chunks BEGIN INSERT INTO chunks_fts(rowid,content) VALUES(new.rowid,new.content); END;
    CREATE TRIGGER IF NOT EXISTS chunks_delete AFTER DELETE ON document_chunks BEGIN INSERT INTO chunks_fts(chunks_fts,rowid,content) VALUES('delete',old.rowid,old.content); END;
    CREATE TRIGGER IF NOT EXISTS chunks_update AFTER UPDATE ON document_chunks BEGIN INSERT INTO chunks_fts(chunks_fts,rowid,content) VALUES('delete',old.rowid,old.content); INSERT INTO chunks_fts(rowid,content) VALUES(new.rowid,new.content); END;
    CREATE TABLE IF NOT EXISTS conversations(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),title TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(id,user_id));
    CREATE INDEX IF NOT EXISTS conversations_user ON conversations(user_id,created_at);
    CREATE TABLE IF NOT EXISTS chat_turns(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,conversation_id TEXT NOT NULL,question TEXT NOT NULL,answer TEXT NOT NULL,citations TEXT NOT NULL,mode TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(conversation_id,user_id) REFERENCES conversations(id,user_id) ON DELETE CASCADE);
    CREATE INDEX IF NOT EXISTS turns_user ON chat_turns(user_id,created_at);
  `);
  return db;
}
let singleton: DatabaseSync | undefined;
export function getDb() {
  return (singleton ??= openDatabase(dataDirectory()));
}
export function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
