import { readFile } from 'node:fs/promises';
import { getDb, dataDirectory } from '@/lib/server/db';
import {
  currentUser,
  requireUser,
  register,
  login,
  logout,
  sessionCookie,
  changePassword,
} from '@/lib/server/auth';
import {
  ApiError,
  json,
  errorResponse,
  checkOrigin,
  readJson,
  textField,
  isUuid,
} from '@/lib/server/http';
import { listDocuments, ownedDocument, searchChunks, saveTurn } from '@/lib/server/repository';
import {
  uploadDocument,
  processDocument,
  deleteDocument,
  originalPath,
} from '@/lib/server/documents';
import { answerQuestion } from '@/lib/server/answer';
import { maxFileBytes } from '@/lib/documents';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
async function handle(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    if (request.method !== 'GET') checkOrigin(request);
    const route = (await params).path;
    const endpoint = route.join('/');
    const method = request.method;
    const db = getDb();
    if (endpoint === 'auth/session' && method === 'GET') {
      const user = currentUser(db, request);
      return json({ session: user ? { user } : null });
    }
    if (['auth/login', 'auth/register'].includes(endpoint) && method === 'POST') {
      const body = await readJson(request);
      const result = endpoint === 'auth/login' ? await login(db, body) : await register(db, body);
      return json({ session: { user: result.user } }, 200, {
        'Set-Cookie': sessionCookie(request, result.token),
      });
    }
    if (endpoint === 'auth/logout' && method === 'POST') {
      logout(db, request);
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, '', 0) });
    }
    const user = requireUser(db, request);
    if (endpoint === 'auth/password' && method === 'POST') {
      const token = await changePassword(db, user, await readJson(request));
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, token) });
    }
    if (endpoint === 'settings' && method === 'GET')
      return json({
        storage: 'SQLite',
        database: 'data/documind.sqlite',
        documents: 'data/uploads',
        aiEnabled: !!process.env.RAG_API_KEY,
      });
    if (endpoint === 'documents' && method === 'GET')
      return json({ documents: listDocuments(db, user.id) });
    if (endpoint === 'documents' && method === 'POST') {
      if (!request.headers.get('content-type')?.startsWith('multipart/form-data'))
        throw new ApiError('파일 업로드 요청을 확인하세요.');
      // Bound the body even when a client omits or forges Content-Length.
      const limit = maxFileBytes + 65536;
      let size = 0;
      const reader = request.body?.getReader();
      const pieces: Uint8Array[] = [];
      if (reader)
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > limit) {
            await reader.cancel();
            throw new ApiError('파일당 최대 20MB까지 업로드할 수 있습니다.', 413);
          }
          pieces.push(value);
        }
      const form = await new Response(Buffer.concat(pieces), {
        headers: { 'Content-Type': request.headers.get('content-type')! },
      }).formData();
      const file = form.get('file');
      if (!(file instanceof File)) throw new ApiError('파일을 선택하세요.');
      return json(await uploadDocument(db, dataDirectory(), user.id, file), 201);
    }
    if (route[0] === 'documents' && route[1]) {
      const id = route[1];
      if (!isUuid(id)) throw new ApiError('문서를 찾을 수 없습니다.', 404);
      const doc = ownedDocument(db, user.id, id);
      if (route.length === 2 && method === 'GET') {
        const chunks = db
          .prepare(
            'SELECT id,document_id,position,content FROM document_chunks WHERE document_id=? AND user_id=? ORDER BY position',
          )
          .all(id, user.id);
        return json({ text: doc.extracted_text, chunks });
      }
      if (route.length === 2 && method === 'PATCH') {
        const body = await readJson(request);
        const name = body.name === undefined ? doc.name : textField(body.name, '문서 이름');
        const category =
          body.category === undefined ? doc.category : textField(body.category, '카테고리', 80);
        db.prepare('UPDATE documents SET name=?,category=? WHERE id=? AND user_id=?').run(
          name,
          category,
          id,
          user.id,
        );
        return json({ ok: true });
      }
      if (route.length === 2 && method === 'DELETE') {
        await deleteDocument(db, dataDirectory(), user.id, id);
        return json({ ok: true });
      }
      if (route.length === 3 && route[2] === 'process' && method === 'POST')
        return json(await processDocument(db, dataDirectory(), user.id, id));
      if (route.length === 3 && route[2] === 'original' && method === 'GET') {
        let bytes: Buffer;
        try {
          bytes = await readFile(originalPath(dataDirectory(), id));
        } catch {
          throw new ApiError('원본 파일을 찾을 수 없습니다.', 404);
        }
        const inline =
          doc.file_type === 'PDF' &&
          doc.status === 'ready' &&
          !new URL(request.url).searchParams.has('download');
        return new Response(new Uint8Array(bytes), {
          headers: {
            'Content-Type': inline ? 'application/pdf' : 'application/octet-stream',
            'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="document.${doc.file_type.toLowerCase()}"; filename*=UTF-8''${encodeURIComponent(doc.name).replaceAll("'", '%27')}`,
            'Content-Length': String(bytes.length),
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': 'sandbox',
          },
        });
      }
    }
    if (endpoint === 'conversations' && method === 'GET')
      return json({
        conversations: db
          .prepare(
            'SELECT id,title FROM conversations WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
          )
          .all(user.id),
      });
    if (route[0] === 'conversations' && route.length === 2 && method === 'GET') {
      if (
        !db.prepare('SELECT id FROM conversations WHERE id=? AND user_id=?').get(route[1], user.id)
      )
        throw new ApiError('대화를 찾을 수 없습니다.', 404);
      const turns = db
        .prepare(
          'SELECT id,question,answer,citations,mode FROM (SELECT * FROM chat_turns WHERE conversation_id=? AND user_id=? ORDER BY created_at DESC LIMIT 100) ORDER BY created_at',
        )
        .all(route[1], user.id)
        .map((t) => ({ ...t, citations: JSON.parse(String(t.citations)) }));
      return json({ turns });
    }
    if (endpoint === 'dashboard' && method === 'GET') {
      const raw = Number(new URL(request.url).searchParams.get('days') || 30);
      const days = [7, 30, 90].includes(raw) ? raw : 30;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const row = db
        .prepare('SELECT count(*) AS count FROM chat_turns WHERE user_id=? AND created_at>=?')
        .get(user.id, since);
      const recent = db
        .prepare(
          'SELECT id,question,mode,created_at FROM chat_turns WHERE user_id=? AND created_at>=? ORDER BY created_at DESC LIMIT 10',
        )
        .all(user.id, since);
      return json({ count: row?.count || 0, recent });
    }
    if (endpoint === 'chat' && method === 'POST') {
      const body = await readJson(request);
      const question = textField(body.question, '질문', 2000);
      const ids = body.documentIds;
      if (ids !== undefined && (!Array.isArray(ids) || ids.length > 100 || !ids.every(isUuid)))
        throw new ApiError('선택 문서를 확인하세요.');
      const conversationId = body.conversationId;
      if (conversationId !== undefined && !isUuid(conversationId))
        throw new ApiError('대화 ID를 확인하세요.');
      if (
        conversationId &&
        !db
          .prepare('SELECT id FROM conversations WHERE id=? AND user_id=?')
          .get(conversationId, user.id)
      )
        throw new ApiError('대화를 찾을 수 없습니다.', 404);
      if (
        !db
          .prepare("SELECT id FROM documents WHERE user_id=? AND status='ready' LIMIT 1")
          .get(user.id)
      )
        throw new ApiError('처리가 완료된 문서를 먼저 업로드하세요.', 409);
      const citations = searchChunks(
        db,
        user.id,
        question,
        Array.isArray(ids) && ids.length ? ids : undefined,
      );
      const result = await answerQuestion(question, citations);
      return json(
        saveTurn(db, user.id, {
          conversationId: conversationId as string | undefined,
          question,
          citations,
          ...result,
        }),
      );
    }
    throw new ApiError('요청한 경로를 찾을 수 없습니다.', 404);
  } catch (error) {
    return errorResponse(error);
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
