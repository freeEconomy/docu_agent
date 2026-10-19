import { createHash } from 'node:crypto';
import type { Database } from './db';
import type { Citation } from '../documents';
import { ApiError } from './http';
import {
  embeddingModel,
  embeddingDimensions,
  embeddingVersion,
  answerModel,
  requireAI,
  createEmbeddings,
} from './rag-provider';
import { searchChunks } from './repository';
import { answerQuestion } from './answer';
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const textHash = (s: string) => hash(s);
const contentHashSql = "encode(sha256(convert_to(c.content,'UTF8')),'hex')";
const noMatch =
  '문서에서 질문에 답할 충분한 근거를 찾지 못했습니다. 관련 문서나 질문의 범위를 확인해 주세요.';
function limit(name: string, fallback: number, max: number) {
  const value = Number(process.env[name] || fallback);
  return Number.isInteger(value) && value > 0 ? Math.min(value, max) : fallback;
}
export function ragLimits() {
  return {
    userQuestions: limit('RAG_DAILY_QUESTIONS', 10, 1000),
    globalQuestions: limit('RAG_GLOBAL_DAILY_QUESTIONS', 20, 10000),
    userEmbeddingCharacters: limit('RAG_DAILY_EMBEDDING_CHARACTERS', 200000, 2000000),
    globalEmbeddingCharacters: limit('RAG_GLOBAL_DAILY_EMBEDDING_CHARACTERS', 1000000, 10000000),
  };
}
export async function reserveUsage(
  db: Database,
  userId: string,
  questions: number,
  characters: number,
) {
  const limits = ragLimits();
  try {
    await db.query(
      `WITH limits(scope,qmax,cmax) AS (VALUES ('global',$4::integer,$5::integer),($1::text,$6::integer,$7::integer)), claimed AS (
 INSERT INTO rag_usage AS u(scope,day,chat_requests,embedding_characters)
 SELECT scope,(now() AT TIME ZONE 'UTC')::date,$2,$3 FROM limits WHERE $2<=qmax AND $3<=cmax ORDER BY scope
 ON CONFLICT(scope,day) DO UPDATE SET chat_requests=u.chat_requests+EXCLUDED.chat_requests,embedding_characters=u.embedding_characters+EXCLUDED.embedding_characters
 WHERE u.chat_requests+EXCLUDED.chat_requests<=(SELECT qmax FROM limits WHERE scope=u.scope) AND u.embedding_characters+EXCLUDED.embedding_characters<=(SELECT cmax FROM limits WHERE scope=u.scope)
 RETURNING scope) SELECT 1/(CASE WHEN count(*)=2 THEN 1 ELSE 0 END)::integer AS ok FROM claimed`,
      [
        'user:' + userId,
        questions,
        characters,
        limits.globalQuestions,
        limits.globalEmbeddingCharacters,
        limits.userQuestions,
        limits.userEmbeddingCharacters,
      ],
    );
  } catch (error) {
    if ((error as { code?: string }).code === '22012')
      throw new ApiError(
        '비용 보호를 위한 오늘의 AI 사용 한도에 도달했습니다. 내일 다시 이용하거나 관리자에게 문의하세요.',
        429,
      );
    throw error;
  }
}
export function normalizeVector(vector: unknown): number[] {
  if (
    !Array.isArray(vector) ||
    vector.length !== embeddingDimensions ||
    vector.some((v) => typeof v !== 'number' || !Number.isFinite(v))
  )
    throw new ApiError('임베딩 응답 형식이 올바르지 않습니다.', 502);
  const norm = Math.hypot(...vector);
  if (!norm) throw new ApiError('유효한 임베딩을 생성하지 못했습니다.', 502);
  return vector.map((v) => v / norm);
}
export async function embedTexts(
  db: Database,
  userId: string,
  texts: string[],
): Promise<Map<string, number[]>> {
  requireAI();
  const unique = [...new Map(texts.map((t) => [textHash(t), t])).entries()];
  const found = unique.length
    ? await db.query<{ text_hash: string; embedding: number[] }>(
        'SELECT text_hash,embedding FROM rag_embeddings WHERE user_id=$1 AND model=$2 AND text_hash=ANY($3::text[])',
        [userId, embeddingVersion, unique.map(([h]) => h)],
      )
    : [];
  const vectors = new Map(found.map((r) => [r.text_hash, r.embedding]));
  const missing = unique.filter(([h]) => !vectors.has(h));
  for (let offset = 0; offset < missing.length; offset += 32) {
    const batch = missing.slice(offset, offset + 32);
    await reserveUsage(
      db,
      userId,
      0,
      batch.reduce((n, [, t]) => n + t.length, 0),
    );
    const data = await createEmbeddings(batch.map(([, t]) => t));
    const byIndex = new Map<number, number[]>();
    for (const row of data) {
      if (
        !Number.isInteger(row.index) ||
        row.index < 0 ||
        row.index >= batch.length ||
        byIndex.has(row.index)
      )
        throw new ApiError('임베딩 응답 순서가 올바르지 않습니다.', 502);
      byIndex.set(row.index, normalizeVector(row.embedding));
    }
    await db.transaction(
      batch.map(([h], i) => ({
        text: 'INSERT INTO rag_embeddings(user_id,model,text_hash,embedding) VALUES($1,$2,$3,$4::real[]) ON CONFLICT DO NOTHING',
        params: [userId, embeddingVersion, h, byIndex.get(i)],
      })),
    );
    batch.forEach(([h], i) => vectors.set(h, byIndex.get(i)!));
  }
  return vectors;
}
export async function prepareRag(db: Database, userId: string, ids?: string[]) {
  requireAI();
  if (ids?.length === 0) return { processed: 0, hasMore: false };
  const rows = await db.query<{ content: string }>(
    `SELECT DISTINCT c.content FROM document_chunks c JOIN documents d ON d.id=c.document_id AND d.user_id=c.user_id LEFT JOIN rag_embeddings e ON e.user_id=c.user_id AND e.model=$3 AND e.text_hash=${contentHashSql} WHERE c.user_id=$1 AND d.status='ready' AND d.deleted_at IS NULL AND ($2::uuid[] IS NULL OR d.id=ANY($2::uuid[])) AND e.text_hash IS NULL ORDER BY c.content LIMIT 33`,
    [userId, ids || null, embeddingVersion],
  );
  await embedTexts(
    db,
    userId,
    rows.slice(0, 32).map((r) => r.content),
  );
  return { processed: Math.min(rows.length, 32), hasMore: rows.length > 32 };
}
export function selectEvidence(
  semantic: (Citation & { similarity: number })[],
  lexical: Citation[],
): Citation[] {
  const ranks = new Map<string, { citation: Citation; score: number }>();
  for (const list of [semantic, lexical])
    list.forEach((c, i) => {
      const old = ranks.get(c.chunk_id);
      ranks.set(c.chunk_id, { citation: c, score: (old?.score || 0) + 1 / (40 + i) });
    });
  const selected: Citation[] = [];
  for (const { citation } of [...ranks.values()].sort((a, b) => b.score - a.score)) {
    const normalized = citation.content.replace(/\s/g, '');
    if (selected.some((c) => c.content.replace(/\s/g, '') === normalized)) continue;
    if (selected.filter((c) => c.document_id === citation.document_id).length >= 3) continue;
    selected.push({ ...citation, content: citation.content.slice(0, 1200) });
    if (selected.length === 4) break;
  }
  return selected;
}
export async function hybridSearch(
  db: Database,
  userId: string,
  question: string,
  vector: number[],
  ids?: string[],
) {
  if (ids?.length === 0) return [];
  const semantic = await db.query<Citation & { similarity: number }>(
    `SELECT c.id AS chunk_id,c.document_id,d.name AS document_name,c.position,c.content,v.similarity FROM document_chunks c JOIN documents d ON d.id=c.document_id AND d.user_id=c.user_id JOIN rag_embeddings e ON e.user_id=c.user_id AND e.model=$4 AND e.text_hash=${contentHashSql} CROSS JOIN LATERAL (SELECT sum(a.value * ($3::real[])[a.ordinality::integer]) AS similarity FROM unnest(e.embedding) WITH ORDINALITY a(value,ordinality)) v WHERE c.user_id=$1 AND d.status='ready' AND d.deleted_at IS NULL AND ($2::uuid[] IS NULL OR d.id=ANY($2::uuid[])) AND v.similarity>=0.3 ORDER BY v.similarity DESC,c.id LIMIT 12`,
    [userId, ids || null, vector, embeddingVersion],
  );
  return selectEvidence(semantic, await searchChunks(db, userId, question, ids));
}
export async function ragAnswer(db: Database, userId: string, question: string, ids?: string[]) {
  requireAI();
  const corpus = await db.query<{ id: string; name: string; rag_revision: string }>(
    "SELECT id,name,rag_revision FROM documents WHERE user_id=$1 AND status='ready' AND deleted_at IS NULL AND ($2::uuid[] IS NULL OR id=ANY($2::uuid[])) ORDER BY id",
    [userId, ids || null],
  );
  if (!corpus.length)
    return { answer: noMatch, mode: 'no_match', citations: [] as Citation[], cached: false };
  const normalized = question.trim().replace(/\s+/g, ' ');
  const cacheKey = hash(
    JSON.stringify(['rag-v1', answerModel(), embeddingVersion, normalized, corpus]),
  );
  const [cached] = await db.query<{ answer: string; mode: string; citations: Citation[] }>(
    'SELECT answer,mode,citations FROM rag_answer_cache WHERE user_id=$1 AND cache_key=$2 AND expires_at>$3',
    [userId, cacheKey, Date.now()],
  );
  if (cached) return { ...cached, cached: true };
  const prepared = await prepareRag(db, userId, ids);
  if (prepared.hasMore)
    throw new ApiError('문서의 AI 검색 준비가 더 필요합니다. 잠시 후 다시 질문해 주세요.', 409);
  await reserveUsage(db, userId, 1, 0);
  const vectors = await embedTexts(db, userId, [normalized]);
  const citations = await hybridSearch(
    db,
    userId,
    normalized,
    vectors.get(textHash(normalized))!,
    ids,
  );
  const result = citations.length
    ? await answerQuestion(question, citations)
    : { answer: noMatch, mode: 'no_match', citations: [] as Citation[] };
  // A renamed, removed, or re-indexed document produces a new corpus key. Cached
  // answers are never shared across owners or retrieved without current scope.
  await db.query(
    'INSERT INTO rag_answer_cache(user_id,cache_key,answer,citations,mode,expires_at) VALUES($1,$2,$3,$4::jsonb,$5,$6) ON CONFLICT(user_id,cache_key) DO UPDATE SET answer=EXCLUDED.answer,citations=EXCLUDED.citations,mode=EXCLUDED.mode,expires_at=EXCLUDED.expires_at',
    [
      userId,
      cacheKey,
      result.answer,
      JSON.stringify(result.citations),
      result.mode,
      Date.now() + 3600000,
    ],
  );
  await db.query('DELETE FROM rag_answer_cache WHERE user_id=$1 AND expires_at<$2', [
    userId,
    Date.now(),
  ]);
  return { ...result, cached: false };
}
