import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { validateFile, maxFileBytes } from '../documents';
import { parseDocument, chunkText } from '../ingestion';
import { ApiError } from './http';
import { ownedDocument, beginProcessing, finishProcessing } from './repository';
export function originalPath(directory: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError('문서 ID를 확인하세요.');
  return path.join(directory, 'uploads', id);
}
export async function uploadDocument(
  db: DatabaseSync,
  directory: string,
  userId: string,
  file: File,
) {
  const validation = validateFile(file);
  if (validation) throw new ApiError(validation);
  if (file.name.length > 240) throw new ApiError('파일명은 240자 이하로 입력하세요.');
  const id = randomUUID();
  const filename = originalPath(directory, id);
  await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length !== file.size || bytes.length > maxFileBytes)
    throw new ApiError('파일 용량을 확인하세요.');
  await writeFile(filename, bytes, { flag: 'wx', mode: 0o600 });
  try {
    db.prepare(
      'INSERT INTO documents(id,user_id,name,file_type,size_bytes,created_at) VALUES(?,?,?,?,?,?)',
    ).run(
      id,
      userId,
      file.name,
      file.name.split('.').pop()!.toUpperCase(),
      file.size,
      new Date().toISOString(),
    );
  } catch (error) {
    await unlink(filename);
    throw error;
  }
  return { id };
}
export async function processDocument(
  db: DatabaseSync,
  directory: string,
  userId: string,
  id: string,
) {
  const doc = ownedDocument(db, userId, id);
  const token = beginProcessing(db, userId, id);
  try {
    const bytes = await readFile(originalPath(directory, id));
    if (bytes.length !== doc.size_bytes) throw new Error('원본 파일 크기가 일치하지 않습니다.');
    const parsed = await parseDocument(bytes, doc.file_type);
    const text = parsed.text.replace(/\u0000/g, '').trim();
    const parts = chunkText(text);
    finishProcessing(db, userId, id, token, text, parsed.pages, parts);
    return { chunks: parts.length, pages: parsed.pages };
  } catch (error) {
    const failure = error instanceof Error ? error.message : '문서 분석 실패';
    try {
      finishProcessing(db, userId, id, token, '', 0, [], failure);
    } catch {}
    throw new ApiError(failure, 422);
  }
}
export async function deleteDocument(
  db: DatabaseSync,
  directory: string,
  userId: string,
  id: string,
) {
  ownedDocument(db, userId, id);
  // Remove the original first. Missing originals allow deletion to be retried after a crash.
  try {
    await unlink(originalPath(directory, id));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  db.prepare('DELETE FROM documents WHERE id=? AND user_id=?').run(id, userId);
}
