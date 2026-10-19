import { randomUUID } from 'node:crypto';
import type { Database } from './db';
import { validateFile, maxFileBytes } from '../documents';
import { parseDocument, chunkText } from '../ingestion';
import { ApiError, textField } from './http';
import { ownedDocument, beginProcessing, finishProcessing } from './repository';
import { requireBlob, blobMetadata, readOriginal, removeOriginal } from './blob-store';
export function documentMime(type: string) {
  return type === 'PDF'
    ? 'application/pdf'
    : ['TXT', 'MD', 'MARKDOWN'].includes(type)
      ? 'text/plain'
      : 'application/octet-stream';
}
export async function prepareUpload(db: Database, userId: string, body: Record<string, unknown>) {
  requireBlob();
  const name = textField(body.name, '파일 이름');
  const size = body.size;
  if (typeof size !== 'number' || !Number.isInteger(size))
    throw new ApiError('파일 용량을 확인하세요.');
  const validation = validateFile({ name, size });
  if (validation) throw new ApiError(validation);
  const id = randomUUID();
  const type = name.split('.').pop()!.toUpperCase();
  const blobPath = `${userId}/${id}/original.${type.toLowerCase()}`;
  await db.query(
    'INSERT INTO documents(id,user_id,name,file_type,size_bytes,blob_path) VALUES($1,$2,$3,$4,$5,$6)',
    [id, userId, name, type, size, blobPath],
  );
  return { id, pathname: blobPath, contentType: documentMime(type) };
}
export async function completeUpload(db: Database, userId: string, id: string) {
  const doc = await ownedDocument(db, userId, id);
  const metadata = await blobMetadata(doc.blob_path);
  if (
    metadata.pathname !== doc.blob_path ||
    metadata.size !== doc.size_bytes ||
    metadata.size > maxFileBytes
  )
    throw new ApiError('업로드 원본의 경로 또는 크기가 일치하지 않습니다.', 422);
  // A public store must never be silently accepted for private documents.
  if (!new URL(metadata.url).hostname.endsWith('.private.blob.vercel-storage.com'))
    throw new ApiError('Blob 저장소를 비공개(Private)로 생성해야 합니다.', 503);
  await db.query(
    'UPDATE documents SET uploaded_at=COALESCE(uploaded_at,now()) WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL',
    [id, userId],
  );
  return { ok: true };
}
export async function processDocument(db: Database, userId: string, id: string) {
  let doc = await ownedDocument(db, userId, id);
  if (!doc.uploaded_at) {
    await completeUpload(db, userId, id);
    doc = await ownedDocument(db, userId, id);
  }
  const token = await beginProcessing(db, userId, id);
  try {
    const original = await readOriginal(doc.blob_path);
    // Blob GET size comes from Content-Length, which may be absent for streamed
    // responses or describe encoded bytes. Validate the bounded stream itself
    // below against the provider metadata verified by completeUpload instead.
    const reader = original.stream.getReader();
    const pieces: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxFileBytes) {
        await reader.cancel();
        throw new Error('원본 파일 크기가 제한을 초과합니다.');
      }
      pieces.push(value);
    }
    if (size !== doc.size_bytes) throw new Error('원본 파일 크기가 일치하지 않습니다.');
    let parsed;
    try {
      parsed = await parseDocument(new Uint8Array(Buffer.concat(pieces)), doc.file_type);
    } catch (error) {
      throw new ApiError(error instanceof Error ? error.message : '문서 분석 실패', 422);
    }
    const text = parsed.text.replace(/\u0000/g, '').trim();
    const parts = chunkText(text);
    await finishProcessing(db, userId, id, token, text, parsed.pages, parts);
    return { chunks: parts.length, pages: parsed.pages };
  } catch (error) {
    const failure =
      error instanceof ApiError
        ? error.message
        : '문서 분석에 실패했습니다. 파일 형식과 텍스트를 확인하세요.';
    try {
      await finishProcessing(db, userId, id, token, '', 0, [], failure);
    } catch {}
    throw new ApiError(failure, 422);
  }
}
export async function cleanupDeleted(db: Database, userId?: string) {
  const rows = await db.query<{ id: string; blob_path: string }>(
    `SELECT id,blob_path FROM documents WHERE deleted_at IS NOT NULL AND upload_token_expires_at<$1${userId ? ' AND user_id=$2' : ''} LIMIT 100`,
    userId ? [Date.now() - 60000, userId] : [Date.now() - 60000],
  );
  let count = 0;
  for (const row of rows) {
    await removeOriginal(row.blob_path);
    await db.query('DELETE FROM documents WHERE id=$1 AND deleted_at IS NOT NULL', [row.id]);
    count++;
  }
  return { removed: count };
}
export async function deleteDocument(db: Database, userId: string, id: string) {
  const doc = await ownedDocument(db, userId, id, true);
  await db.transaction([
    {
      text: 'UPDATE documents SET deleted_at=COALESCE(deleted_at,now()) WHERE id=$1 AND user_id=$2',
      params: [id, userId],
    },
    {
      text: 'DELETE FROM document_chunks WHERE document_id=$1 AND user_id=$2',
      params: [id, userId],
    },
  ]);
  // Retain a hidden tombstone until issued upload tokens expire. Otherwise an
  // in-flight direct upload could recreate the original after deletion.
  await removeOriginal(doc.blob_path);
  if (Number(doc.upload_token_expires_at) < Date.now() - 60000)
    await db.query('DELETE FROM documents WHERE id=$1 AND user_id=$2 AND deleted_at IS NOT NULL', [
      id,
      userId,
    ]);
  return { ok: true };
}
