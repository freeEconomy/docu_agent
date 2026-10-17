'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  documentFromRow,
  readableError,
  validateFile,
  type KnowledgeDocument,
} from '@/lib/documents';
import { getSupabase, apiRequest } from '@/lib/supabase/client';
import { documentBucket } from '@/lib/supabase/config';
type Workspace = {
  documents: KnowledgeDocument[];
  hydrated: boolean;
  session: Session | null;
  loading: boolean;
  connectionError: string;
  uploading: boolean;
  notify: (message: string) => void;
  refresh: () => Promise<void>;
  addFiles: (files: File[]) => Promise<void>;
  removeDocuments: (ids: string[]) => Promise<void>;
  updateDocument: (id: string, patch: Partial<KnowledgeDocument>) => Promise<void>;
  reindex: (ids: string[]) => Promise<void>;
};
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const currentUser = useRef<string | undefined>(undefined);
  const uploadLock = useRef(false);
  const userId = session?.user.id;
  useEffect(() => {
    const client = getSupabase();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      if (currentUser.current !== next?.user.id) {
        setDocuments([]);
        setConnectionError('');
      }
      currentUser.current = next?.user.id;
      setSession(next);
      setHydrated(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('documents')
        .select(
          'id,name,file_type,size_bytes,chunk_count,page_count,category,status,storage_path,error_message,created_at',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (currentUser.current === userId) {
        setDocuments((data || []).map(documentFromRow));
        setConnectionError('');
      }
    } catch (error) {
      if (currentUser.current === userId) setConnectionError(readableError(error));
    } finally {
      if (currentUser.current === userId) setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    if (userId) void refresh();
    else {
      setDocuments([]);
      setLoading(false);
    }
  }, [userId, refresh]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 6500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function process(id: string) {
    await apiRequest(`/api/documents/${id}/process`, {});
  }
  async function reindex(ids: string[]) {
    if (!ids.length) return;
    try {
      for (const id of ids) {
        await process(id);
        await refresh();
      }
      setToast('문서 분석과 검색 인덱스 저장을 완료했습니다.');
    } catch (error) {
      setToast(readableError(error));
    } finally {
      await refresh();
    }
  }
  async function addFiles(files: File[]) {
    if (!userId) {
      setToast('로그인이 필요합니다.');
      return;
    }
    if (uploadLock.current) {
      setToast('현재 업로드가 끝난 후 다시 시도하세요.');
      return;
    }
    uploadLock.current = true;
    setUploading(true);
    const notices: string[] = [];
    const client = getSupabase();
    try {
      for (const file of files) {
        const validation = validateFile(file);
        if (validation) {
          notices.push(validation);
          continue;
        }
        if (currentUser.current !== userId) break;
        const id = crypto.randomUUID();
        const type = file.name.split('.').pop()!.toUpperCase();
        const path = `${userId}/${id}/original.${type.toLowerCase()}`;
        try {
          const { error } = await client.from('documents').insert({
            id,
            user_id: userId,
            name: file.name,
            file_type: type,
            size_bytes: file.size,
            storage_path: path,
          });
          if (error) throw error;
          const { error: uploadError } = await client.storage
            .from(documentBucket)
            .upload(path, file, {
              contentType: file.type || 'application/octet-stream',
              upsert: false,
            });
          if (uploadError) {
            const { error: cleanupError } = await client.from('documents').delete().eq('id', id);
            if (cleanupError)
              notices.push('업로드 실패 기록이 남았습니다. 해당 문서를 삭제하세요.');
            throw uploadError;
          }
          await refresh();
          await process(id);
          notices.push(`${file.name}: 등록 및 분석 완료`);
        } catch (error) {
          notices.push(`${file.name}: ${readableError(error)}`);
        }
        await refresh();
      }
    } finally {
      uploadLock.current = false;
      setUploading(false);
      setToast(notices.join(' / '));
    }
  }
  async function removeDocuments(ids: string[]) {
    try {
      for (const id of ids) {
        const doc = documents.find((d) => d.id === id);
        if (!doc) continue;
        const { error } = await getSupabase()
          .storage.from(documentBucket)
          .remove([doc.storagePath]);
        if (error) throw error;
        const { error: deleteError } = await getSupabase().from('documents').delete().eq('id', id);
        if (deleteError) throw deleteError;
      }
      setToast('선택한 문서와 원본 파일을 삭제했습니다.');
    } catch (error) {
      setToast(readableError(error));
    } finally {
      await refresh();
    }
  }
  async function updateDocument(id: string, patch: Partial<KnowledgeDocument>) {
    try {
      const updates: { name?: string; category?: string } = {};
      if (patch.name) updates.name = patch.name;
      if (patch.category) updates.category = patch.category;
      const { data, error } = await getSupabase()
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select('id')
        .single();
      if (error || !data) throw error || new Error('수정할 문서를 찾지 못했습니다.');
      setToast('문서 정보를 저장했습니다.');
    } catch (error) {
      setToast(readableError(error));
    } finally {
      await refresh();
    }
  }
  return (
    <Context.Provider
      value={{
        documents,
        session,
        hydrated,
        loading,
        connectionError,
        uploading,
        refresh,
        notify: setToast,
        addFiles,
        removeDocuments,
        updateDocument,
        reindex,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button onClick={() => setToast('')} aria-label="알림 닫기">
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error('WorkspaceProvider required');
  return context;
}
