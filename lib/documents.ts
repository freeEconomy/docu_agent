export type DocumentStatus = 'ready' | 'processing' | 'failed';
export type KnowledgeDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  chunks: number;
  pages: number;
  category: string;
  owner: string;
  date: string;
  status: DocumentStatus;
  text: string;
  storagePath: string;
  error?: string;
  uploaded?: boolean;
};
export type DocumentChunk = { id: string; document_id: string; position: number; content: string };
export type Citation = {
  document_id: string;
  document_name: string;
  chunk_id: string;
  position: number;
  content: string;
};
export const maxFileBytes = 20 * 1024 * 1024;
export function validateFile(file: Pick<File, 'name' | 'size'>): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !['pdf', 'docx', 'hwpx', 'txt', 'md', 'markdown'].includes(ext))
    return `${file.name}: 지원하지 않는 파일 형식입니다.`;
  if (file.size > maxFileBytes) return `${file.name}: 파일당 최대 20MB까지 등록할 수 있습니다.`;
  if (!file.size) return `${file.name}: 빈 파일은 등록할 수 없습니다.`;
  return null;
}
export function documentFromRow(row: Record<string, unknown>): KnowledgeDocument {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.file_type),
    size: Number(row.size_bytes) / 1024 / 1024,
    chunks: Number(row.chunk_count),
    pages: Number(row.page_count),
    category: String(row.category),
    owner: '내 계정',
    date: new Date(String(row.created_at))
      .toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
      .replaceAll('-', '.'),
    status: row.status as DocumentStatus,
    text: '',
    storagePath: String(row.storage_path),
    error: row.error_message ? String(row.error_message) : undefined,
    uploaded: true,
  };
}
export function readableError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : '요청에 실패했습니다.';
  if (/schema cache|does not exist|Could not find|PGRST20[025]/i.test(message))
    return 'Supabase 테이블이 아직 설치되지 않았습니다. 설정 화면의 데이터베이스 설치 안내를 확인하세요.';
  if (/fetch|network/i.test(message))
    return 'Supabase에 연결하지 못했습니다. 네트워크와 프로젝트 상태를 확인하세요.';
  return message;
}

export function citationsFromJson(value: unknown): Citation[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Citation =>
      item &&
      typeof item.document_id === 'string' &&
      typeof item.document_name === 'string' &&
      typeof item.chunk_id === 'string' &&
      typeof item.position === 'number' &&
      typeof item.content === 'string',
  );
}
