import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getDb } from '@/lib/server/db';
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
  prepareUpload,
  completeUpload,
  processDocument,
  deleteDocument,
  documentMime,
  cleanupDeleted,
} from '@/lib/server/documents';
import { readOriginal, requireBlob } from '@/lib/server/blob-store';
import { answerQuestion } from '@/lib/server/answer';
import { googleConfig, startGoogle, finishGoogle } from '@/lib/server/google-sso';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
async function handle(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    if (request.method !== 'GET') checkOrigin(request);
    const route = (await params).path;
    const endpoint = route.join('/');
    const method = request.method;
    if (endpoint === 'health' && method === 'GET')
      return json({
        databaseConfigured: !!process.env.DATABASE_URL,
        blobConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
      });
    if (
      endpoint === 'auth/session' &&
      method === 'GET' &&
      !request.headers.get('cookie')?.includes('documind_session=')
    )
      return json({ session: null });
    if (endpoint === 'auth/sso/providers' && method === 'GET') {
      const config = googleConfig();
      return json({ google: !!config && new URL(request.url).origin === config.origin });
    }
    const db = getDb();
    if (endpoint === 'auth/sso/google/start' && method === 'GET')
      return await startGoogle(db, request);
    if (endpoint === 'auth/sso/google/link' && method === 'POST')
      return await startGoogle(db, request, true);
    if (endpoint === 'auth/sso/google/callback' && method === 'GET')
      return await finishGoogle(db, request);
    if (endpoint === 'auth/session' && method === 'GET') {
      const user = await currentUser(db, request);
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
      await logout(db, request);
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, '', 0) });
    }
    const user = await requireUser(db, request);
    if (endpoint === 'auth/sso/google/account' && method === 'GET') {
      const [identity] = await db.query<{ email: string }>(
        "SELECT email FROM sso_identities WHERE provider='google' AND user_id=$1",
        [user.id],
      );
      return json({ email: identity?.email || null });
    }
    if (endpoint === 'auth/password' && method === 'POST') {
      const token = await changePassword(db, user, await readJson(request));
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, token) });
    }
    if (endpoint === 'settings' && method === 'GET') {
      const [version] = await db.query(
        'SELECT max(version)::integer AS version FROM documind_schema_versions',
      );
      return json({
        storage: 'Neon PostgreSQL + Private Vercel Blob',
        schemaVersion: version?.version,
        aiEnabled: !!process.env.RAG_API_KEY,
      });
    }
    if (endpoint === 'documents' && method === 'GET')
      return json({ documents: await listDocuments(db, user.id) });
    if (endpoint === 'documents' && method === 'POST') {
      await cleanupDeleted(db, user.id);
      return json(await prepareUpload(db, user.id, await readJson(request)), 201);
    }
    if (endpoint === 'documents/cleanup' && method === 'POST')
      return json(await cleanupDeleted(db, user.id));
    if (endpoint === 'blob/upload' && method === 'POST') {
      requireBlob();
      const body = await readJson(request);
      if (body.type !== 'blob.generate-client-token')
        throw new ApiError('지원하지 않는 업로드 요청입니다.');
      const result = await handleUpload({
        body: body as unknown as HandleUploadBody,
        request,
        onBeforeGenerateToken: async (pathname, payload) => {
          let id;
          try {
            id = JSON.parse(payload || '{}').documentId;
          } catch {
            throw new ApiError('문서 ID를 확인하세요.');
          }
          if (!isUuid(id)) throw new ApiError('문서 ID를 확인하세요.');
          const doc = await ownedDocument(db, user.id, id);
          if (doc.blob_path !== pathname || doc.uploaded_at)
            throw new ApiError('업로드 경로 또는 문서 상태를 확인하세요.');
          const validUntil = Date.now() + 15 * 60000;
          await db.query(
            'UPDATE documents SET upload_token_expires_at=GREATEST(upload_token_expires_at,$1) WHERE id=$2 AND user_id=$3 AND deleted_at IS NULL',
            [validUntil, id, user.id],
          );
          return {
            maximumSizeInBytes: doc.size_bytes,
            allowedContentTypes: [documentMime(doc.file_type)],
            validUntil,
            allowOverwrite: false,
            addRandomSuffix: false,
          };
        },
      });
      return json(result);
    }
    if (route[0] === 'documents' && route[1]) {
      const id = route[1];
      if (!isUuid(id)) throw new ApiError('문서를 찾을 수 없습니다.', 404);
      if (route.length === 2 && method === 'DELETE')
        return json(await deleteDocument(db, user.id, id));
      const doc = await ownedDocument(db, user.id, id);
      if (route.length === 2 && method === 'GET') {
        const chunks = await db.query(
          'SELECT id,document_id,position,content FROM document_chunks WHERE document_id=$1 AND user_id=$2 ORDER BY position',
          [id, user.id],
        );
        return json({ text: doc.extracted_text, chunks });
      }
      if (route.length === 2 && method === 'PATCH') {
        const body = await readJson(request);
        const name = body.name === undefined ? doc.name : textField(body.name, '문서 이름');
        const category =
          body.category === undefined ? doc.category : textField(body.category, '카테고리', 80);
        await db.query(
          'UPDATE documents SET name=$1,category=$2 WHERE id=$3 AND user_id=$4 AND deleted_at IS NULL',
          [name, category, id, user.id],
        );
        return json({ ok: true });
      }
      if (route.length === 3 && route[2] === 'complete' && method === 'POST')
        return json(await completeUpload(db, user.id, id));
      if (route.length === 3 && route[2] === 'process' && method === 'POST')
        return json(await processDocument(db, user.id, id));
      if (route.length === 3 && route[2] === 'original' && method === 'GET') {
        if (!doc.uploaded_at) throw new ApiError('업로드가 아직 완료되지 않았습니다.', 409);
        const original = await readOriginal(doc.blob_path);
        const inline =
          doc.file_type === 'PDF' &&
          doc.status === 'ready' &&
          !new URL(request.url).searchParams.has('download');
        return new Response(original.stream, {
          headers: {
            'Content-Type': inline ? 'application/pdf' : 'application/octet-stream',
            'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="document.${doc.file_type.toLowerCase()}"; filename*=UTF-8''${encodeURIComponent(doc.name).replaceAll("'", '%27')}`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': 'sandbox',
          },
        });
      }
    }
    if (endpoint === 'conversations' && method === 'GET')
      return json({
        conversations: await db.query(
          'SELECT id,title FROM conversations WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
          [user.id],
        ),
      });
    if (route[0] === 'conversations' && route.length === 2 && method === 'GET') {
      if (
        !isUuid(route[1]) ||
        !(
          await db.query('SELECT id FROM conversations WHERE id=$1 AND user_id=$2', [
            route[1],
            user.id,
          ])
        ).length
      )
        throw new ApiError('대화를 찾을 수 없습니다.', 404);
      return json({
        turns: await db.query(
          'SELECT id,question,answer,citations,mode FROM (SELECT * FROM chat_turns WHERE conversation_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 100) recent ORDER BY created_at',
          [route[1], user.id],
        ),
      });
    }
    if (endpoint === 'dashboard' && method === 'GET') {
      const raw = Number(new URL(request.url).searchParams.get('days') || 30);
      const days = [7, 30, 90].includes(raw) ? raw : 30;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const [[count], recent] = await Promise.all([
        db.query(
          'SELECT count(*)::integer AS count FROM chat_turns WHERE user_id=$1 AND created_at>=$2',
          [user.id, since],
        ),
        db.query(
          'SELECT id,question,mode,created_at FROM chat_turns WHERE user_id=$1 AND created_at>=$2 ORDER BY created_at DESC LIMIT 10',
          [user.id, since],
        ),
      ]);
      return json({ count: count?.count || 0, recent });
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
        !(
          await db.query('SELECT id FROM conversations WHERE id=$1 AND user_id=$2', [
            conversationId,
            user.id,
          ])
        ).length
      )
        throw new ApiError('대화를 찾을 수 없습니다.', 404);
      if (
        !(
          await db.query(
            "SELECT id FROM documents WHERE user_id=$1 AND status='ready' AND deleted_at IS NULL LIMIT 1",
            [user.id],
          )
        ).length
      )
        throw new ApiError('처리가 완료된 문서를 먼저 업로드하세요.', 409);
      const citations = await searchChunks(
        db,
        user.id,
        question,
        Array.isArray(ids) && ids.length ? ids : undefined,
      );
      const result = await answerQuestion(question, citations);
      return json(
        await saveTurn(db, user.id, {
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
