'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FileSearch, Download, RefreshCw, Pencil, ArrowLeft, FileText } from 'lucide-react';
import { useWorkspace } from './workspace-provider';
import { requestJson } from '@/lib/client';
import { readableError, type DocumentChunk } from '@/lib/documents';
import { Badge, Modal } from './ui';
export function DocumentDetail({ id }: { id: string }) {
  const { documents, loading, updateDocument, reindex, notify } = useWorkspace();
  const doc = documents.find((d) => d.id === id);
  const [text, setText] = useState('');
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [signedUrl, setSignedUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [chunkIndex, setChunkIndex] = useState(0);
  const [view, setView] = useState<'text' | 'original'>('text');
  useEffect(() => {
    let active = true;
    setText('');
    setChunks([]);
    setSignedUrl('');
    setError('');
    setChunkIndex(0);
    if (!doc) return;
    setBusy(true);
    void requestJson<{ text: string; chunks: DocumentChunk[] }>(`/api/documents/${id}`)
      .then((result) => {
        if (active) {
          setText(result.text);
          setChunks(result.chunks);
        }
      })
      .catch((e) => {
        if (active) setError(readableError(e));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [id, doc?.status, doc?.chunks]);
  async function original(download = false) {
    if (!doc) return;
    const url = `/api/documents/${id}/original${download ? '?download=1' : ''}`;
    if (download) {
      const a = document.createElement('a');
      a.href = url;
      a.click();
    } else {
      setSignedUrl(url);
      setView('original');
    }
  }

  if (!doc)
    return (
      <div className="empty-state">
        <FileSearch size={36} />
        <h1>{loading ? '문서를 불러오는 중…' : '문서를 찾을 수 없습니다'}</h1>
        <p>삭제되었거나 접근 권한이 없는 문서입니다.</p>
        <Link className="button primary mt-4" href="/documents">
          문서 목록으로
        </Link>
      </div>
    );
  const chunk = chunks[chunkIndex];
  return (
    <div className="page-content">
      <Link href="/documents" className="text-button">
        <ArrowLeft size={16} />
        문서 목록
      </Link>
      <header className="detail-heading mt-5">
        <div>
          <div className="row flex-wrap">
            <Badge status={doc.status} />
            <span className="tag">{doc.type}</span>
            <span className="tag">{doc.category}</span>
          </div>
          <h1 className="mt-3 break-all">{doc.name}</h1>
          <p className="muted mt-2">
            {doc.size.toFixed(2)} MB · {doc.pages ? `${doc.pages}페이지 · ` : ''}
            {doc.chunks}개 청크 · {doc.date}
          </p>
        </div>
        <div className="row flex-wrap">
          <button className="button secondary" disabled={busy} onClick={() => void reindex([id])}>
            <RefreshCw size={16} />
            재분석
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setName(doc.name);
              setCategory(doc.category);
              setEditing(true);
            }}
          >
            <Pencil size={16} />
            정보 수정
          </button>
          <button className="button primary" onClick={() => void original(true)}>
            <Download size={16} />
            원본 다운로드
          </button>
        </div>
      </header>
      {doc.error && (
        <p role="alert" className="error-box mt-4">
          {doc.error}
        </p>
      )}
      {error && (
        <p role="alert" className="error-box mt-4">
          {error}
        </p>
      )}
      <div className="document-real-grid mt-6">
        <section className="card p-5 min-w-0">
          <div className="row between flex-wrap">
            <h2 className="row">
              <FileText size={20} />
              문서 미리보기
            </h2>
            <div className="segmented">
              <button className={view === 'text' ? 'active' : ''} onClick={() => setView('text')}>
                추출 텍스트
              </button>
              <button
                className={view === 'original' ? 'active' : ''}
                onClick={() => void original()}
              >
                원본 미리보기
              </button>
            </div>
          </div>
          {view === 'original' && doc.type === 'PDF' && signedUrl ? (
            <>
              <p className="muted text-xs mt-4">로그인한 본인 계정의 원본 파일을 표시합니다.</p>
              <iframe title="원본 PDF 미리보기" src={signedUrl} className="original-frame mt-4" />
            </>
          ) : (
            <>
              <p className="muted text-xs mt-4">
                {view === 'original'
                  ? '이 형식은 브라우저 원본 렌더링을 지원하지 않아 추출한 텍스트를 표시합니다. 원본 다운로드를 이용하세요.'
                  : '업로드한 파일에서 실제 추출한 텍스트입니다.'}
              </p>
              <pre className="real-document-text">
                {busy
                  ? '텍스트를 불러오는 중…'
                  : text || '추출된 텍스트가 없습니다. 문서 상태를 확인하고 필요하면 재분석하세요.'}
              </pre>
            </>
          )}
        </section>
        <section className="card p-5 min-w-0">
          <h2 className="row">
            <FileSearch size={20} />
            청크 분석
          </h2>
          <p className="muted mt-3 mb-5">
            검색에 사용하는 실제 원문 조각입니다. 청크 간 180자가 겹칩니다.
          </p>
          {chunk ? (
            <>
              <label className="field">
                청크 선택
                <select
                  aria-label="청크 선택"
                  value={chunkIndex}
                  onChange={(e) => setChunkIndex(Number(e.target.value))}
                >
                  {chunks.map((c, i) => (
                    <option key={c.id} value={i}>
                      청크 #{c.position + 1} · {c.content.length}자
                    </option>
                  ))}
                </select>
              </label>
              <div className="inset mt-5">
                <strong>청크 #{chunk.position + 1}</strong>
                <p className="mono text-xs muted break-all mt-2">{chunk.id}</p>
                <pre className="real-chunk-text mt-4">{chunk.content}</pre>
              </div>
            </>
          ) : (
            <p className="muted">{busy ? '청크를 불러오는 중…' : '저장된 청크가 없습니다.'}</p>
          )}
        </section>
      </div>
      {editing && (
        <Modal title="문서 정보 수정" onClose={() => setEditing(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await updateDocument(id, { name, category });
              setEditing(false);
            }}
          >
            <label className="field">
              문서 이름
              <input
                required
                maxLength={240}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field mt-4">
              카테고리
              <input
                required
                maxLength={80}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </label>
            <button className="button primary mt-5" type="submit">
              변경 저장
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
