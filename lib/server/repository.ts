import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { transaction } from './db';
import { ApiError } from './http';
import type { Citation } from '../documents';
export type DocumentRow = {
  id: string;
  user_id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  category: string;
  status: string;
  chunk_count: number;
  page_count: number;
  extracted_text: string;
  error_message: string | null;
  processing_token: string | null;
  processing_started_at: number | null;
  created_at: string;
};
export function ownedDocument(db: DatabaseSync, userId: string, id: string) {
  const row = db.prepare('SELECT * FROM documents WHERE id=? AND user_id=?').get(id, userId) as
    | DocumentRow
    | undefined;
  if (!row) throw new ApiError('문서를 찾을 수 없습니다.', 404);
  return row;
}
export function listDocuments(db: DatabaseSync, userId: string) {
  return db
    .prepare(
      'SELECT id,name,file_type,size_bytes,category,status,chunk_count,page_count,error_message,created_at FROM documents WHERE user_id=? ORDER BY created_at DESC',
    )
    .all(userId)
    .map((row) => ({ ...row, storage_path: row.id }));
}
export function beginProcessing(db: DatabaseSync, userId: string, id: string) {
  const token = randomUUID();
  const result = db
    .prepare(
      "UPDATE documents SET status='processing',processing_token=?,processing_started_at=?,error_message=NULL WHERE id=? AND user_id=? AND (processing_started_at IS NULL OR processing_started_at<?)",
    )
    .run(token, Date.now(), id, userId, Date.now() - 300000);
  if (!result.changes)
    throw new ApiError('문서가 없거나 이미 분석 중입니다. 중단된 작업은 5분 후 재시도하세요.', 409);
  return token;
}
export function finishProcessing(
  db: DatabaseSync,
  userId: string,
  id: string,
  token: string,
  text: string,
  pages: number,
  parts: string[],
  failure?: string,
) {
  transaction(db, () => {
    const row = db
      .prepare('SELECT id FROM documents WHERE id=? AND user_id=? AND processing_token=?')
      .get(id, userId, token);
    if (!row) throw new ApiError('분석 작업이 만료되었거나 문서가 삭제되었습니다.', 409);
    if (failure) {
      db.prepare(
        "UPDATE documents SET status='failed',error_message=?,processing_token=NULL,processing_started_at=NULL WHERE id=? AND user_id=?",
      ).run(failure.slice(0, 500), id, userId);
      return;
    }
    if (
      !parts.length ||
      parts.length > 500 ||
      parts.some((p) => !p.length || p.length > 1200) ||
      text.length > 400000
    )
      throw new ApiError('분석 텍스트의 크기를 확인하세요.');
    db.prepare('DELETE FROM document_chunks WHERE document_id=? AND user_id=?').run(id, userId);
    const insert = db.prepare('INSERT INTO document_chunks VALUES(?,?,?,?,?)');
    parts.forEach((part, index) => insert.run(randomUUID(), id, userId, index, part));
    db.prepare(
      "UPDATE documents SET status='ready',extracted_text=?,page_count=?,chunk_count=?,error_message=NULL,processing_token=NULL,processing_started_at=NULL WHERE id=? AND user_id=?",
    ).run(text, pages, parts.length, id, userId);
  });
}
export function searchChunks(
  db: DatabaseSync,
  userId: string,
  question: string,
  ids?: string[],
): Citation[] {
  if (ids && ids.length === 0) return [];
  const terms = [...new Set(question.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])].slice(0, 20);
  if (!terms.length) return [];
  const fts = terms.map((t) => '"' + t.replaceAll('"', '""') + '"').join(' OR ');
  const score = terms
    .map(() => '(CASE WHEN instr(lower(c.content),?)>0 THEN 1.0 ELSE 0 END)')
    .join('+');
  const filter = ids ? ` AND c.document_id IN (${ids.map(() => '?').join(',')})` : '';
  const sql = `SELECT c.id AS chunk_id,c.document_id,d.name AS document_name,c.position,c.content,(${score} + CASE WHEN c.rowid IN (SELECT rowid FROM chunks_fts WHERE chunks_fts MATCH ?) THEN 1.0 ELSE 0 END) AS rank FROM document_chunks c JOIN documents d ON d.id=c.document_id WHERE c.user_id=? AND d.user_id=? AND d.status='ready'${filter} AND (${terms.map(() => 'instr(lower(c.content),?)>0').join(' OR ')} OR c.rowid IN (SELECT rowid FROM chunks_fts WHERE chunks_fts MATCH ?)) ORDER BY rank DESC,c.id LIMIT 6`;
  return db
    .prepare(sql)
    .all(...terms, fts, userId, userId, ...(ids || []), ...terms, fts) as unknown as Citation[];
}
export function saveTurn(
  db: DatabaseSync,
  userId: string,
  input: {
    conversationId?: string;
    question: string;
    answer: string;
    citations: Citation[];
    mode: string;
  },
) {
  return transaction(db, () => {
    const conversationId = input.conversationId || randomUUID();
    const now = new Date().toISOString();
    if (input.conversationId) {
      if (
        !db
          .prepare('SELECT id FROM conversations WHERE id=? AND user_id=?')
          .get(conversationId, userId)
      )
        throw new ApiError('대화를 찾을 수 없습니다.', 404);
    } else
      db.prepare('INSERT INTO conversations VALUES(?,?,?,?)').run(
        conversationId,
        userId,
        input.question.slice(0, 120),
        now,
      );
    const id = randomUUID();
    db.prepare('INSERT INTO chat_turns VALUES(?,?,?,?,?,?,?,?)').run(
      id,
      userId,
      conversationId,
      input.question,
      input.answer,
      JSON.stringify(input.citations),
      input.mode,
      now,
    );
    return { id, ...input, conversationId, created_at: now };
  });
}
