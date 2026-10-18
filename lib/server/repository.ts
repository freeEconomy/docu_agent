import { randomUUID } from 'node:crypto';
import type { Database } from './db';
import { ApiError } from './http';
import type { Citation } from '../documents';
export type DocumentRow = {
  id: string;
  user_id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  blob_path: string;
  category: string;
  status: string;
  chunk_count: number;
  page_count: number;
  extracted_text: string;
  error_message: string | null;
  processing_token: string | null;
  processing_started_at: number | null;
  created_at: string;
  uploaded_at: string | null;
  upload_token_expires_at: number;
  deleted_at: string | null;
};
export async function ownedDocument(
  db: Database,
  userId: string,
  id: string,
  includeDeleted = false,
) {
  const [doc] = await db.query<DocumentRow>(
    `SELECT * FROM documents WHERE id=$1 AND user_id=$2${includeDeleted ? '' : ' AND deleted_at IS NULL'}`,
    [id, userId],
  );
  if (!doc) throw new ApiError('문서를 찾을 수 없습니다.', 404);
  return doc;
}
export async function listDocuments(db: Database, userId: string) {
  const rows = await db.query(
    'SELECT id,name,file_type,size_bytes,category,status,chunk_count,page_count,error_message,created_at FROM documents WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC',
    [userId],
  );
  return rows.map((row) => ({ ...row, storage_path: row.id }));
}
export async function beginProcessing(db: Database, userId: string, id: string) {
  const token = randomUUID();
  const rows = await db.query(
    "UPDATE documents SET status='processing',processing_token=$1,processing_started_at=$2,error_message=NULL WHERE id=$3 AND user_id=$4 AND deleted_at IS NULL AND uploaded_at IS NOT NULL AND (processing_started_at IS NULL OR processing_started_at<$5) RETURNING id",
    [token, Date.now(), id, userId, Date.now() - 300000],
  );
  if (!rows.length)
    throw new ApiError('문서가 없거나 이미 분석 중입니다. 중단된 작업은 5분 후 재시도하세요.', 409);
  return token;
}
export async function finishProcessing(
  db: Database,
  userId: string,
  id: string,
  token: string,
  text: string,
  pages: number,
  parts: string[],
  failure?: string,
) {
  if (failure) {
    const rows = await db.query(
      "UPDATE documents SET status='failed',error_message=$1,processing_token=NULL,processing_started_at=NULL WHERE id=$2 AND user_id=$3 AND processing_token=$4 AND deleted_at IS NULL RETURNING id",
      [failure.slice(0, 500), id, userId, token],
    );
    if (!rows.length) throw new ApiError('분석 작업이 만료되었거나 문서가 삭제되었습니다.', 409);
    return;
  }
  if (
    !parts.length ||
    parts.length > 500 ||
    parts.some((p) => !p.length || p.length > 1200) ||
    text.length > 400000
  )
    throw new ApiError('분석 텍스트의 크기를 확인하세요.');
  // Lock the live claim and replace chunks/status in a single transaction. The
  // version guard in each statement prevents stale or deleted jobs publishing.
  const statements = [
    {
      text: 'SELECT id FROM documents WHERE id=$1 AND user_id=$2 AND processing_token=$3 AND deleted_at IS NULL FOR UPDATE',
      params: [id, userId, token],
    },
    {
      text: 'DELETE FROM document_chunks WHERE document_id=$1 AND user_id=$2 AND EXISTS(SELECT 1 FROM documents WHERE id=$1 AND user_id=$2 AND processing_token=$3 AND deleted_at IS NULL)',
      params: [id, userId, token],
    },
    {
      text: 'INSERT INTO document_chunks(id,document_id,user_id,position,content) SELECT gen_random_uuid(),d.id,d.user_id,(p.ordinality-1)::integer,p.value FROM documents d CROSS JOIN unnest($4::text[]) WITH ORDINALITY AS p(value,ordinality) WHERE d.id=$1 AND d.user_id=$2 AND d.processing_token=$3 AND d.deleted_at IS NULL',
      params: [id, userId, token, parts],
    },
    {
      text: "UPDATE documents SET status='ready',extracted_text=$4,page_count=$5,chunk_count=$6,error_message=NULL,processing_token=NULL,processing_started_at=NULL WHERE id=$1 AND user_id=$2 AND processing_token=$3 AND deleted_at IS NULL RETURNING id",
      params: [id, userId, token, text, pages, parts.length],
    },
  ];
  const result = await db.transaction(statements);
  if (!result[0].length) throw new ApiError('분석 작업이 만료되었거나 문서가 삭제되었습니다.', 409);
}
export async function searchChunks(
  db: Database,
  userId: string,
  question: string,
  ids?: string[],
): Promise<Citation[]> {
  if (ids && ids.length === 0) return [];
  const terms = [...new Set(question.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])].slice(0, 20);
  if (!terms.length) return [];
  return db.query<Citation>(
    `SELECT c.id AS chunk_id,c.document_id,d.name AS document_name,c.position,c.content FROM document_chunks c JOIN documents d ON d.id=c.document_id WHERE c.user_id=$1 AND d.user_id=$1 AND d.deleted_at IS NULL AND d.status='ready' AND ($3::uuid[] IS NULL OR c.document_id=ANY($3::uuid[])) AND (c.search_vector @@ plainto_tsquery('simple',$4) OR EXISTS(SELECT 1 FROM unnest($2::text[]) t WHERE strpos(lower(c.content),t)>0)) ORDER BY (ts_rank_cd(c.search_vector,plainto_tsquery('simple',$4))+(SELECT count(*)::real FROM unnest($2::text[]) t WHERE strpos(lower(c.content),t)>0)) DESC,c.id LIMIT 6`,
    [userId, terms, ids || null, question],
  );
}
export async function saveTurn(
  db: Database,
  userId: string,
  input: {
    conversationId?: string;
    question: string;
    answer: string;
    citations: Citation[];
    mode: string;
  },
) {
  const conversationId = input.conversationId || randomUUID();
  const id = randomUUID();
  // Existing conversations are never upserted under another owner. Insert turn
  // only through an owned conversation, so the combined operation is atomic.
  const rows = await db.query<{ created_at: string }>(
    `WITH c AS (INSERT INTO conversations(id,user_id,title) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET title=conversations.title WHERE conversations.user_id=$2 RETURNING id,user_id), t AS (INSERT INTO chat_turns(id,user_id,conversation_id,question,answer,citations,mode) SELECT $4,user_id,id,$5,$6,$7::jsonb,$8 FROM c RETURNING created_at) SELECT * FROM t`,
    [
      conversationId,
      userId,
      input.question.slice(0, 120),
      id,
      input.question,
      input.answer,
      JSON.stringify(input.citations),
      input.mode,
    ],
  );
  if (!rows.length) throw new ApiError('대화를 찾을 수 없습니다.', 404);
  return { id, ...input, conversationId, created_at: rows[0].created_at };
}
