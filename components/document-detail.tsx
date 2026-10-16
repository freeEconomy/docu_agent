'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Download,
  RefreshCw,
  SlidersHorizontal,
  Search,
  Copy,
  FileSearch,
  List,
  AlignLeft,
  History,
  Network,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from './workspace-provider';
import { Badge, FileIcon, Modal, downloadText } from './ui';
export function DocumentDetail({ id }: { id: string }) {
  const { documents, hydrated, originalFiles, reindex, notify, updateDocument } = useWorkspace();
  const doc = documents.find((d) => d.id === id);
  const [page, setPage] = useState(id === 'DOC-8942' ? 18 : id === 'DOC-7719' ? 5 : 1);
  const [zoom, setZoom] = useState(100);
  const [tab, setTab] = useState('chunks');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [showJson, setShowJson] = useState(true);
  const [mobilePane, setMobilePane] = useState('original');
  const file = originalFiles[id];
  useEffect(() => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;
    const url = URL.createObjectURL(file);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (!hydrated) return <div className="page-content">문서를 불러오는 중...</div>;
  if (!doc)
    return (
      <div className="empty-state">
        <FileSearch size={40} />
        <h1>문서를 찾을 수 없습니다</h1>
        <p>삭제되었거나 존재하지 않는 문서입니다.</p>
        <Link className="button primary" href="/documents">
          문서 목록으로
        </Link>
      </div>
    );
  const isSeed = !doc.uploaded;
  const hasMatch = !query || doc.text.toLowerCase().includes(query.toLowerCase());
  const chunkNumber = id === 'DOC-8942' ? 42 : id === 'DOC-7719' ? 12 : 1;
  function download() {
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      downloadText(doc!.name.replace(/\.[^.]+$/, '') + '-발췌.txt', doc!.text);
      notify('원본 파일이 없는 데모 문서입니다. 발췌 텍스트를 내려받았습니다.');
    }
  }
  return (
    <div className="detail-page">
      <header className="detail-heading">
        <div>
          <div className="row text-xs muted mb-3">
            <Link href="/documents">문서 지식 베이스</Link>
            <ChevronRight size={13} />
            {doc.category}
            <ChevronRight size={13} />
            <span className="text-primary">{doc.name}</span>
          </div>
          <div className="row">
            <FileIcon type={doc.type} />
            <h1>{doc.name}</h1>
          </div>
          <div className="row flex-wrap mt-3">
            <Badge status={doc.status} />
            <small className="muted">마지막 동기화: {doc.date} 14:30</small>
            <span className="tag mono">{doc.id.slice(0, 16)}</span>
          </div>
        </div>
        <div className="row flex-wrap">
          <button
            className="button secondary"
            onClick={() => {
              setName(doc.name);
              setCategory(doc.category);
              setEditing(true);
            }}
          >
            <SlidersHorizontal size={16} />
            메타데이터 편집
          </button>
          <button className="button secondary" onClick={download}>
            <Download size={16} />
            {file ? '원본 다운로드' : '발췌 다운로드'}
          </button>
          <button className="button primary" onClick={() => reindex([doc.id])}>
            <RefreshCw size={16} />
            문서 재분석 (Re-index)
          </button>
        </div>
      </header>
      <div className="detail-mobile-tabs segmented">
        <button
          className={mobilePane === 'original' ? 'active' : ''}
          onClick={() => setMobilePane('original')}
        >
          원본 미리보기
        </button>
        <button
          className={mobilePane === 'chunks' ? 'active' : ''}
          onClick={() => setMobilePane('chunks')}
        >
          청크 분석
        </button>
      </div>
      <div className="detail-grid">
        <section
          className={`viewer ${mobilePane === 'original' ? 'mobile-active' : ''}`}
          aria-label="원본 미리보기"
        >
          <div className="viewer-toolbar">
            <button
              className="icon-button"
              aria-label="이전 문서 페이지"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <input
              aria-label="문서 페이지"
              type="number"
              min={1}
              max={doc.pages}
              value={page}
              onChange={(e) =>
                setPage(Math.max(1, Math.min(doc.pages, Number(e.target.value) || 1)))
              }
            />
            <span>/ {doc.pages}</span>
            <button
              className="icon-button"
              aria-label="다음 문서 페이지"
              disabled={page >= doc.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="축소"
              disabled={zoom <= 70}
              onClick={() => setZoom((z) => z - 10)}
            >
              <Minus size={16} />
            </button>
            <span className="mono">{zoom}%</span>
            <button
              className="icon-button"
              aria-label="확대"
              disabled={zoom >= 150}
              onClick={() => setZoom((z) => z + 10)}
            >
              <Plus size={16} />
            </button>
            <button className="icon-button" aria-label="배율 초기화" onClick={() => setZoom(100)}>
              <RefreshCw size={15} />
            </button>
          </div>
          <div className="viewer-canvas">
            {blobUrl ? (
              <iframe
                title={`${doc.name} 원본 PDF`}
                src={`${blobUrl}#page=${page}&zoom=${zoom}`}
                className="pdf-frame"
              />
            ) : (
              <article className="paper" style={{ fontSize: `${zoom / 100}em` }}>
                <div className="paper-classification">
                  {doc.uploaded ? 'LOCAL DOCUMENT PREVIEW' : '2024 미래전략 종합계획서'}
                  <span>CONFIDENTIAL · INTERNAL ONLY</span>
                </div>
                {isSeed && (
                  <div className="preview-label">원본 PDF 대신 Stitch 기반 발췌 문서 미리보기</div>
                )}
                <div className="eyebrow mt-5">SECTION {id === 'DOC-8942' ? '3.2' : '1.1'}</div>
                <h2>
                  {id === 'DOC-8942'
                    ? '제 3 장: 클라우드 인프라 현대화 및 Q3 예산 집행 계획'
                    : doc.name}
                </h2>
                <small className="muted">
                  작성일: {doc.date} | 소관부서: {doc.category}
                </small>
                {doc.status === 'failed' ? (
                  <div className="error-box mt-5">{doc.text}</div>
                ) : (
                  <>
                    {isSeed && (
                      <p className="mt-6">
                        당사는 2024년 상반기 추진된 엔터프라이즈 프라이빗 클라우드 안정화 작업을
                        성공적으로 완료함에 따라, 3분기부터 대규모 하이브리드 워크로드 이관을
                        본격화한다. 레거시 온프레미스 코어 뱅킹 프레임워크의 MSA 분할 작업은 목표
                        일정 대비 104%의 공정률을 기록하고 있다.
                      </p>
                    )}
                    <div className="highlight-passage">
                      <div className="row between mb-3">
                        <span className="text-primary text-xs row">
                          <BrainIcon />
                          추출 청크 영역 #{chunkNumber}
                        </span>
                        <small className="muted mono">Page {page}</small>
                      </div>
                      <p>{doc.text}</p>
                      <div className="row between mt-5 text-xs muted">
                        <span className="text-green-800">◉ 벡터 인덱싱 예시 (1,536차원)</span>
                        <span>신뢰도: 0.964</span>
                      </div>
                    </div>
                    {isSeed && (
                      <>
                        <p>
                          인프라 전환 2단계가 완료되는 9월 말 시점에는 전사 트래픽의 약 78%가 신규
                          컨테이너 클러스터로 무중단 라우팅될 것으로 예상되며, 이를 통해 분기당
                          클라우드 유지보수 인건비 절감 효과는 약 3,800만 원에 달할 것으로 추산된다.
                        </p>
                        <h4 className="mt-5 mb-3">[표 3-4] Q3 클라우드 투자 소요 명세</h4>
                        <table className="paper-table">
                          <tbody>
                            <tr>
                              <td>컨테이너 클러스터</td>
                              <td>45,000,000 원</td>
                            </tr>
                            <tr>
                              <td>DR 스토리지 구축</td>
                              <td>52,000,000 원</td>
                            </tr>
                            <tr>
                              <td>보안 인증 평가</td>
                              <td>23,000,000 원</td>
                            </tr>
                          </tbody>
                        </table>
                      </>
                    )}
                  </>
                )}
                <footer className="row between muted text-xs mt-8">
                  <span>미래전략연구소 · {doc.category}</span>
                  <span>- {page} -</span>
                </footer>
              </article>
            )}
          </div>
          {doc.uploaded && !file && (
            <p className="text-xs muted p-3">
              새로고침 후에는 원본 파일이 유지되지 않습니다. 로컬 발췌 텍스트를 표시합니다.
            </p>
          )}
        </section>
        <section className={`chunk-panel ${mobilePane === 'chunks' ? 'mobile-active' : ''}`}>
          <div className="card chunk-tabs tabs">
            {[
              ['chunks', '벡터 청크 목록', List],
              ['text', '파싱 텍스트 원문', AlignLeft],
              ['history', '처리 이력', History],
            ].map(([value, label, Icon]) => {
              const I = Icon as typeof List;
              return (
                <button
                  className={tab === value ? 'active' : ''}
                  key={String(value)}
                  onClick={() => setTab(String(value))}
                >
                  <I size={15} />
                  {String(label)}
                  {value === 'chunks' && <span>{doc.chunks}</span>}
                </button>
              );
            })}
          </div>
          {tab === 'chunks' ? (
            <>
              <div className="card p-4 mt-4">
                <div className="search-field">
                  <Search size={15} />
                  <input
                    aria-label="청크 검색"
                    placeholder="청크 텍스트 검색..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              {hasMatch && doc.status !== 'failed' ? (
                <div className="card chunk-card mt-4">
                  <div className="row between">
                    <div className="row flex-wrap">
                      <span className="chunk-id">Chunk #{chunkNumber}</span>
                      <strong className="mono text-xs">
                        chunk-{doc.id.toLowerCase()}-{chunkNumber}
                      </strong>
                    </div>
                    <span className="tag mono">ID: vec_8a9f3b</span>
                  </div>
                  <div className="row mt-3">
                    <span className="tag">Page {page}</span>
                    <span className="tag mono">486 Tokens · Mock</span>
                  </div>
                  <div className="confidence-grid">
                    <div>
                      <small>
                        질의 일치도
                        <br />
                        (Confidence)
                      </small>
                      <strong className="text-green-800">96.4%</strong>
                      <div className="progress green">
                        <i style={{ width: '96.4%' }} />
                      </div>
                    </div>
                    <div>
                      <small>
                        코사인 거리
                        <br />
                        (Distance)
                      </small>
                      <strong>0.1124</strong>
                      <div className="progress">
                        <i style={{ width: '88%' }} />
                      </div>
                    </div>
                    <div>
                      <small>
                        Dense Vector
                        <br />
                        Norm
                      </small>
                      <strong>1,536-D</strong>
                      <div className="progress">
                        <i style={{ width: '100%', background: '#4b41e1' }} />
                      </div>
                    </div>
                  </div>
                  <h4 className="row text-xs mt-5 mb-3">
                    <AlignLeft size={15} />
                    파싱 및 정규화된 텍스트 본문 (Extracted Tokens)
                  </h4>
                  <div className="inset answer-text">{doc.text}</div>
                  <div className="inset mt-4">
                    <button
                      className="row between w-full text-xs"
                      onClick={() => setShowJson(!showJson)}
                    >
                      청크 페이로드 메타데이터 (Metadata Payload)
                      <span className="text-primary">JSON {showJson ? '축소 ⌃' : '펼치기 ⌄'}</span>
                    </button>
                    {showJson && (
                      <pre className="metadata-code">
                        {JSON.stringify(
                          {
                            chunk_id: `chunk-${doc.id}-${chunkNumber}`,
                            page,
                            section: doc.category,
                            tokens: 486,
                            vector_id: 'vec_8a9f3b',
                            similarity_score: 0.964,
                            embedding_model: 'text-embedding-3-large',
                            mock: true,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    )}
                  </div>
                  <button
                    className="button secondary small-button mt-5"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(doc.text);
                        notify('청크 텍스트를 복사했습니다.');
                      } catch {
                        notify('클립보드 접근이 허용되지 않았습니다.');
                      }
                    }}
                  >
                    <Copy size={14} />
                    텍스트 복사
                  </button>
                </div>
              ) : (
                <div className="card empty-state mt-4">
                  <Search size={28} />
                  <p>
                    {doc.status === 'failed'
                      ? '파싱에 실패하여 청크가 없습니다.'
                      : '검색 결과가 없습니다.'}
                  </p>
                </div>
              )}
              <div className="row between text-xs muted mt-5 mb-3">
                인접 컨텍스트 청크 (Neighboring Chunks)
                <span className="mono">Window: [-1, +1]</span>
              </div>
              {[
                [-1, '인프라 전환 2단계 일정 계획 및 마일스톤'],
                [1, '벤더사 계약 및 서드파티 라이선스 비용 내역'],
              ].map(([offset, title]) => (
                <button
                  className="card neighbor"
                  key={String(offset)}
                  onClick={() => {
                    setPage((p) => Math.max(1, Math.min(doc.pages, p + Number(offset))));
                    notify('데모 페이지를 이동했습니다. 인접 청크 내용은 샘플입니다.');
                  }}
                >
                  <div className="row between">
                    <span className="tag">Chunk #{Math.max(1, chunkNumber + Number(offset))}</span>
                    <b>{String(title)}</b>
                    <ChevronRight size={15} />
                  </div>
                  <p>
                    당사는 2024년 상반기 추진된 엔터프라이즈 프라이빗 클라우드 안정화 작업을
                    성공적으로 완료하며...
                  </p>
                </button>
              ))}
            </>
          ) : tab === 'text' ? (
            <div className="card p-6 mt-4">
              <h2>파싱 텍스트 원문</h2>
              <p className="answer-text mt-5">{doc.text}</p>
            </div>
          ) : (
            <div className="card p-6 mt-4">
              <h2>처리 이력 및 로그</h2>
              <div className="timeline mt-5">
                {[
                  '문서 등록 완료',
                  '텍스트 추출 완료',
                  doc.status === 'failed'
                    ? 'DRM 암호화 감지 · 파싱 실패'
                    : doc.status === 'processing'
                      ? '모의 임베딩 진행 중'
                      : '모의 벡터 인덱싱 완료',
                ].map((t, i) => (
                  <div key={t}>
                    <b>{t}</b>
                    <p className="muted text-xs">
                      {doc.date} 14:{28 + i} · Mock 이벤트
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
      <div className="card pipeline">
        <Network size={20} />
        <div>
          <strong>RAG 파이프라인 구성 사양 (Mock)</strong>
          <div className="row flex-wrap mt-3">
            <span className="tag mono">Parser: LlamaParse High-Res OCR</span>→
            <span className="tag mono">Chunk Size: 512 / Overlap: 50</span>→
            <span className="tag mono">Embedding: text-embedding-3-large</span>→
            <span className="tag mono">Qdrant Vector DB</span>
          </div>
        </div>
      </div>
      {editing && (
        <Modal title="메타데이터 편집" onClose={() => setEditing(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              updateDocument(doc.id, { name: name.trim(), category });
              setEditing(false);
              notify('문서 메타데이터를 저장했습니다.');
            }}
          >
            <label className="field">
              문서명
              <input
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field mt-4">
              카테고리
              <input
                required
                maxLength={50}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </label>
            <button className="button primary mt-6" type="submit">
              변경 저장
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function BrainIcon() {
  return <FileSearch size={14} />;
}
