// Optional one-time import. Does not modify or delete the legacy SQLite files.
import './load-env.mjs';
import { DatabaseSync } from 'node:sqlite';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { put, head, BlobNotFoundError } from '@vercel/blob';
import { getDb, type Row } from '../lib/server/db';
import { readOriginal, requireBlob } from '../lib/server/blob-store';
import { documentMime } from '../lib/server/documents';
const hash = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
async function main() {
  const index = process.argv.indexOf('--source');
  if (index < 0 || !process.argv[index + 1]) throw new Error('source required');
  const directory = path.resolve(process.argv[index + 1]);
  const source = new DatabaseSync(path.join(directory, 'documind.sqlite'), { readOnly: true });
  let users: Row[], documents: Row[], chunks: Row[], conversations: Row[], turns: Row[];
  try {
    source.exec('BEGIN');
    users = source.prepare('SELECT * FROM users').all();
    documents = source.prepare('SELECT * FROM documents').all();
    chunks = source.prepare('SELECT * FROM document_chunks').all();
    conversations = source.prepare('SELECT * FROM conversations').all();
    turns = source.prepare('SELECT * FROM chat_turns').all();
    source.exec('COMMIT');
  } finally {
    source.close();
  }
  for (const doc of documents) {
    if (!/^[a-f0-9-]{36}$/i.test(String(doc.id))) throw new Error('invalid source id');
    const size = (await stat(path.join(directory, 'uploads', String(doc.id)))).size;
    if (size !== Number(doc.size_bytes)) throw new Error('source original missing or changed');
  }
  console.log(
    `Source counts: users=${users.length}, documents=${documents.length}, chunks=${chunks.length}, conversations=${conversations.length}, turns=${turns.length}`,
  );
  if (!process.argv.includes('--apply')) {
    console.log(
      'Dry run only. Stop the legacy server, back up its data directory, configure Neon/Blob credentials, then pass --apply to import.',
    );
    return;
  }
  const db = getDb();
  requireBlob();
  for (const user of users) {
    const existing = await db.query(
      'SELECT id,email,password_hash FROM users WHERE id=$1 OR email=$2',
      [user.id, user.email],
    );
    if (
      existing.length &&
      (existing.length !== 1 ||
        existing[0].id !== user.id ||
        existing[0].email !== user.email ||
        existing[0].password_hash !== user.password_hash)
    )
      throw new Error('account conflict: use an empty target database');
    await db.query(
      'INSERT INTO users(id,email,name,company,password_hash,created_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING',
      [user.id, user.email, user.name, user.company, user.password_hash, user.created_at],
    );
  }
  for (const doc of documents) {
    const existing = await db.query('SELECT id,user_id FROM documents WHERE id=$1', [doc.id]);
    if (existing.length) {
      if (existing[0].user_id !== doc.user_id) throw new Error('document owner conflict');
      continue;
    }
    const bytes = await readFile(path.join(directory, 'uploads', String(doc.id)));
    const blobPath = `${doc.user_id}/${doc.id}/original.${String(doc.file_type).toLowerCase()}`;
    try {
      const stored = await head(blobPath);
      if (stored.size !== bytes.length) throw new Error('blob conflict');
      const original = await readOriginal(blobPath);
      const previous = new Uint8Array(await new Response(original.stream).arrayBuffer());
      if (hash(previous) !== hash(bytes)) throw new Error('blob checksum conflict');
    } catch (error) {
      if (!(error instanceof BlobNotFoundError)) throw error;
      await put(blobPath, bytes, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: documentMime(String(doc.file_type)),
      });
    }
    const parts = chunks.filter((c) => c.document_id === doc.id);
    const statements = [
      {
        text: 'INSERT INTO documents(id,user_id,name,file_type,size_bytes,blob_path,category,status,chunk_count,page_count,extracted_text,error_message,uploaded_at,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),$13)',
        params: [
          doc.id,
          doc.user_id,
          doc.name,
          doc.file_type,
          doc.size_bytes,
          blobPath,
          doc.category,
          doc.status,
          doc.chunk_count,
          doc.page_count,
          doc.extracted_text,
          doc.error_message,
          doc.created_at,
        ],
      },
      ...parts.map((c) => ({
        text: 'INSERT INTO document_chunks(id,document_id,user_id,position,content) VALUES($1,$2,$3,$4,$5)',
        params: [c.id, c.document_id, c.user_id, c.position, c.content],
      })),
    ];
    await db.transaction(statements);
  }
  for (const c of conversations) {
    const previous = await db.query('SELECT user_id FROM conversations WHERE id=$1', [c.id]);
    if (previous.length) {
      if (previous[0].user_id !== c.user_id) throw new Error('conversation owner conflict');
      continue;
    }
    await db.transaction([
      {
        text: 'INSERT INTO conversations(id,user_id,title,created_at) VALUES($1,$2,$3,$4)',
        params: [c.id, c.user_id, c.title, c.created_at],
      },
      ...turns
        .filter((t) => t.conversation_id === c.id)
        .map((t) => ({
          text: 'INSERT INTO chat_turns(id,user_id,conversation_id,question,answer,citations,mode,created_at) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8)',
          params: [
            t.id,
            t.user_id,
            t.conversation_id,
            t.question,
            t.answer,
            t.citations,
            t.mode,
            t.created_at,
          ],
        })),
    ]);
  }
  console.log(
    'Import completed. Legacy files were retained; old sessions were not migrated. Log in again with existing credentials.',
  );
}
void main().catch(() => {
  console.error(
    'Import failed. Verify source files, target schema, service credentials and ID/email conflicts. Safe to retry against the same untouched target; never delete the source backup.',
  );
  process.exitCode = 1;
});
