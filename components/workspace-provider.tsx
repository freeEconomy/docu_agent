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
import {
  documentFromRow,
  readableError,
  validateFile,
  type KnowledgeDocument,
} from '@/lib/documents';
import { requestJson, apiRequest, type AppSession } from '@/lib/client';
type Workspace = {
  documents: KnowledgeDocument[];
  session: AppSession | null;
  hydrated: boolean;
  loading: boolean;
  connectionError: string;
  uploading: boolean;
  notify: (message: string) => void;
  refresh: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  addFiles: (files: File[]) => Promise<void>;
  removeDocuments: (ids: string[]) => Promise<void>;
  updateDocument: (id: string, patch: Partial<KnowledgeDocument>) => Promise<void>;
  reindex: (ids: string[]) => Promise<void>;
};
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [session, setSession] = useState<AppSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const uploadLock = useRef(false);
  const currentUser = useRef<string | undefined>(undefined);
  const userId = session?.user.id;
  const refreshSession = useCallback(async () => {
    try {
      const result = await requestJson<{ session: AppSession | null }>('/api/auth/session');
      if (currentUser.current !== result.session?.user.id) {
        setDocuments([]);
        setConnectionError('');
      }
      currentUser.current = result.session?.user.id;
      setSession(result.session);
    } catch (error) {
      setConnectionError(readableError(error));
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);
  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const result = await requestJson<{ documents: Record<string, unknown>[] }>('/api/documents');
      if (currentUser.current === userId) {
        setDocuments(result.documents.map(documentFromRow));
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
  async function signOut() {
    try {
      await apiRequest('/api/auth/logout', {});
      await refreshSession();
    } catch (error) {
      setToast(readableError(error));
      throw error;
    }
  }
  async function reindex(ids: string[]) {
    if (!ids.length) return;
    try {
      for (const id of ids) {
        await apiRequest(`/api/documents/${id}/process`, {});
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
    try {
      for (const file of files) {
        const validation = validateFile(file);
        if (validation) {
          notices.push(validation);
          continue;
        }
        if (currentUser.current !== userId) break;
        try {
          const form = new FormData();
          form.set('file', file);
          const { id } = await requestJson<{ id: string }>('/api/documents', {
            method: 'POST',
            body: form,
          });
          await refresh();
          await apiRequest(`/api/documents/${id}/process`, {});
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
      for (const id of ids) await requestJson(`/api/documents/${id}`, { method: 'DELETE' });
      setToast('선택한 문서와 원본 파일을 삭제했습니다.');
    } catch (error) {
      setToast(readableError(error));
    } finally {
      await refresh();
    }
  }
  async function updateDocument(id: string, patch: Partial<KnowledgeDocument>) {
    try {
      await requestJson(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: patch.name, category: patch.category }),
      });
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
        notify: setToast,
        refresh,
        refreshSession,
        signOut,
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
