import {
  authenticatedClient,
  ApiError,
  checkDb,
  errorResponse,
  isUuid,
} from '@/lib/supabase/server';
import { documentBucket } from '@/lib/supabase/config';
import { parseDocument, chunkText } from '@/lib/ingestion';
import { maxFileBytes } from '@/lib/documents';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { client } = await authenticatedClient(request);
    const { id } = await params;
    if (!isUuid(id)) throw new ApiError('올바르지 않은 문서 ID입니다.');
    const { data: doc, error } = await client
      .from('documents')
      .select('storage_path,file_type,size_bytes')
      .eq('id', id)
      .maybeSingle();
    checkDb(error);
    if (!doc) throw new ApiError('문서를 찾을 수 없습니다.', 404);
    const { data: token, error: claimError } = await client.rpc('begin_document_processing', {
      doc_id: id,
    });
    if (claimError)
      throw new ApiError('문서가 이미 처리 중입니다. 중단된 작업은 5분 후 다시 시도하세요.', 409);
    try {
      const { data: file, error: downloadError } = await client.storage
        .from(documentBucket)
        .download(doc.storage_path);
      if (downloadError || !file)
        throw new Error('저장된 원본 파일을 읽지 못했습니다. 파일을 다시 업로드하세요.');
      if (file.size > maxFileBytes || file.size !== Number(doc.size_bytes))
        throw new Error('원본 파일 용량을 확인해 주세요.');
      const parsed = await parseDocument(new Uint8Array(await file.arrayBuffer()), doc.file_type);
      const text = parsed.text.replace(/\u0000/g, '').trim();
      const parts = chunkText(text);
      const { error: finishError } = await client.rpc('finish_document_processing', {
        doc_id: id,
        token,
        body: text,
        pages: parsed.pages,
        parts,
      });
      checkDb(finishError);
      return Response.json({ chunks: parts.length, pages: parsed.pages });
    } catch (error) {
      const failure = error instanceof Error ? error.message : '문서 분석에 실패했습니다.';
      const { error: failError } = await client.rpc('finish_document_processing', {
        doc_id: id,
        token,
        body: '',
        pages: 0,
        parts: [],
        failure,
      });
      if (failError) console.error('Unable to persist ingestion failure');
      throw new ApiError(failure, 422);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
