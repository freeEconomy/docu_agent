'use client';
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { seedDocuments, validateFile, type KnowledgeDocument } from '@/lib/documents';
type Workspace = {
  documents: KnowledgeDocument[];
  hydrated: boolean;
  notify: (message: string) => void;
  addFiles: (files: File[]) => Promise<void>;
  removeDocuments: (ids: string[]) => void;
  updateDocument: (id: string, patch: Partial<KnowledgeDocument>) => void;
  reindex: (ids: string[]) => void;
  originalFiles: Record<string, File>;
};
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState(seedDocuments);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState('');
  const [originalFiles, setOriginalFiles] = useState<Record<string, File>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('documind-documents-v1');
      if (saved) {
        const value = JSON.parse(saved);
        if (
          Array.isArray(value) &&
          value.every(
            (d) =>
              typeof d.id === 'string' &&
              typeof d.name === 'string' &&
              typeof d.text === 'string' &&
              ['ready', 'processing', 'failed'].includes(d.status),
          )
        )
          setDocuments(
            value.map((d) =>
              d.uploaded && d.status === 'processing' ? { ...d, status: 'ready' } : d,
            ),
          );
      }
    } catch {}
    setHydrated(true);
    return () => timers.current.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (hydrated)
      try {
        localStorage.setItem('documind-documents-v1', JSON.stringify(documents));
      } catch {}
  }, [documents, hydrated]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  function updateDocument(id: string, patch: Partial<KnowledgeDocument>) {
    setDocuments((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }
  function reindex(ids: string[]) {
    setDocuments((ds) => ds.map((d) => (ids.includes(d.id) ? { ...d, status: 'processing' } : d)));
    timers.current.push(
      setTimeout(() => {
        setDocuments((ds) =>
          ds.map((d) =>
            ids.includes(d.id) ? { ...d, status: 'ready', chunks: d.chunks || 8 } : d,
          ),
        );
        setToast('모의 인덱싱이 완료되었습니다.');
      }, 1600),
    );
  }
  async function addFiles(files: File[]) {
    const added: KnowledgeDocument[] = [];
    const originals: Record<string, File> = {};
    const errors: string[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
        continue;
      }
      const id = `DOC-${crypto.randomUUID()}`;
      const type = file.name.split('.').pop()!.toUpperCase();
      let text =
        '이 문서는 업로드 데모입니다. 바이너리 문서의 텍스트 추출과 임베딩은 다음 단계에서 연동합니다.';
      if (['TXT', 'MD', 'MARKDOWN'].includes(type)) text = (await file.text()).slice(0, 100000);
      added.push({
        id,
        name: file.name,
        type,
        size: Math.max(0.001, file.size / 1024 / 1024),
        chunks: 0,
        pages: 1,
        category: '미분류',
        owner: '이서연 수석',
        date: new Date()
          .toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
          .replaceAll('-', '.'),
        status: 'processing',
        text,
        uploaded: true,
      });
      originals[id] = file;
    }
    setDocuments((ds) => [...added, ...ds]);
    setOriginalFiles((fs) => ({ ...fs, ...originals }));
    if (added.length) reindex(added.map((d) => d.id));
    setToast(
      [added.length ? `${added.length}개 문서 등록 · 모의 처리 중` : '', ...errors]
        .filter(Boolean)
        .join(' / '),
    );
  }
  return (
    <Context.Provider
      value={{
        documents,
        hydrated,
        notify: setToast,
        addFiles,
        updateDocument,
        reindex,
        originalFiles,
        removeDocuments: (ids) => {
          setDocuments((ds) => ds.filter((d) => !ids.includes(d.id)));
          setOriginalFiles((fs) =>
            Object.fromEntries(Object.entries(fs).filter(([id]) => !ids.includes(id))),
          );
          setToast(`${ids.length}개 문서를 삭제했습니다.`);
        },
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
