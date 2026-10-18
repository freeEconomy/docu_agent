'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  UploadCloud,
  PlusCircle,
  Download,
  RefreshCw,
  Search,
  Trash2,
  Folder,
  Network,
  PieChart,
  BadgeCheck,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useWorkspace } from './workspace-provider';
import { Badge, FileIcon, Modal, StatCard, downloadText } from './ui';
export function Documents() {
  const {
    documents,
    addFiles,
    removeDocuments,
    reindex,
    notify,
    uploading,
    loading,
    connectionError,
  } = useWorkspace();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('전체');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [modal, setModal] = useState<'delete' | 'category' | null>(null);
  const [category, setCategory] = useState('경영기획');
  const { updateDocument } = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const pageSize = 5;
  const filtered = documents.filter(
    (d) =>
      (type === '전체' ||
        (type === 'PDF' && d.type === 'PDF') ||
        (type === 'DOCX' && d.type === 'DOCX') ||
        (type === 'TXT/MD' && ['TXT', 'MD', 'MARKDOWN'].includes(d.type))) &&
      (status === 'all' || d.status === status) &&
      `${d.name} ${d.category} ${d.text}`.toLowerCase().includes(search.toLowerCase()),
  );
  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, maxPage);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const ready = documents.filter((d) => d.status === 'ready').length;
  const processing = documents.filter((d) => d.status === 'processing');
  const failed = documents.filter((d) => d.status === 'failed').length;
  function exportDocuments() {
    downloadText(
      'DocuMind-문서목록.csv',
      '\uFEFF문서명,유형,용량(MB),청크수,상태\n' +
        documents
          .map((d) =>
            [d.name, d.type, d.size, d.chunks, d.status]
              .map((v) => '"' + String(v).replaceAll('"', '""') + '"')
              .join(','),
          )
          .join('\n'),
      'text/csv;charset=utf-8',
    );
  }
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <BadgeCheck size={16} />
            Document Knowledge Base
          </div>
          <h1>
            문서 지식 베이스 관리 <span>/ Knowledge Base</span>
          </h1>
          <p>AI 에이전트가 질문에 답변할 근거 문서를 등록하고 텍스트 분석 상태를 모니터링합니다.</p>
        </div>
        <div className="row flex-wrap">
          <button className="button secondary" onClick={exportDocuments}>
            <Download size={16} />
            내보내기
          </button>
          <button
            className="button secondary"
            onClick={() => reindex(documents.filter((d) => d.status !== 'failed').map((d) => d.id))}
          >
            <RefreshCw size={16} />
            전체 지식베이스 동기화
          </button>
          <button
            className="button primary"
            disabled={uploading || !!connectionError}
            onClick={() => input.current?.click()}
          >
            <PlusCircle size={17} />
            문서 일괄 등록
          </button>
        </div>
      </div>
      <div className="stats-grid three">
        <StatCard
          label="총 보관 문서"
          value={documents.length}
          suffix="건 등록됨"
          icon={<Folder size={23} />}
          detail={
            <>
              <div className="row between">
                <span>사용 중 용량: {documents.reduce((a, d) => a + d.size, 0).toFixed(1)} MB</span>
                <span>로컬 원본 파일</span>
              </div>
              <div className="progress mt-3">
                <i
                  style={{
                    width: `${Math.min(100, documents.reduce((a, d) => a + d.size, 0) / 50)}%`,
                  }}
                />
              </div>
            </>
          }
        />
        <StatCard
          label="검색 가능한 문서 청크"
          value={documents.reduce((a, d) => a + d.chunks, 0).toLocaleString()}
          suffix="개 청크"
          icon={<Network size={23} />}
          detail="실제 추출한 원문 · 키워드 및 부분 일치 검색"
        />
        <StatCard
          label="파싱 인덱싱 상태"
          value={<span className="text-green-800">{ready}</span>}
          suffix="완료"
          icon={<PieChart size={23} />}
          detail={
            <>
              <span className="text-primary">{processing.length} 분석 중</span>　•　
              <span className="text-red-600">{failed} 실패</span>
              <div className="progress green mt-3">
                <i
                  style={{ width: `${documents.length ? (ready / documents.length) * 100 : 0}%` }}
                />
              </div>
            </>
          }
        />
      </div>
      <section className="card upload-card">
        <div
          className={`dropzone ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void addFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <span className="upload-icon">
            <UploadCloud size={34} />
          </span>
          <h2>여기로 문서를 드래그하여 놓거나 파일을 선택하세요</h2>
          <p>
            지원 형식: <b>PDF, DOCX, HWPX, TXT, Markdown</b> (파일당 최대 20MB, 다중 선택 가능)
          </p>
          <button
            className="button primary mt-4"
            disabled={uploading || !!connectionError}
            onClick={() => input.current?.click()}
          >
            <PlusCircle size={18} />
            {uploading ? '업로드 및 분석 중…' : '파일 찾아보기'}
          </button>
          <small className="muted mt-3 block">
            비공개 로컬 원본 파일 저장 · PDF / DOCX / HWPX 텍스트 추출 · TXT / Markdown UTF-8 지원
          </small>
          <input
            ref={input}
            aria-label="문서 파일 선택"
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.docx,.hwpx,.txt,.md,.markdown"
            onChange={(e) => {
              void addFiles(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
        </div>
        {processing.length > 0 && (
          <div className="processing-upload">
            <FileIcon />
            <div className="grow">
              <b>{processing[0].name}</b>
              <p className="text-primary text-xs mt-2">
                <RefreshCw size={12} className="inline animate-spin" /> 원본 저장 및 텍스트 청크
                분석 중
              </p>
            </div>
            <div className="upload-progress">
              <span className="text-xs">청크 분석 처리 중</span>
              <div className="progress mt-2">
                <i className="indeterminate" />
              </div>
            </div>
          </div>
        )}
      </section>
      <section className="card filters-card">
        <div className="filter-row">
          <div className="tabs">
            {['전체', 'PDF', 'DOCX', 'TXT/MD'].map((t) => (
              <button
                key={t}
                className={type === t ? 'active' : ''}
                onClick={() => {
                  setType(t);
                  setPage(1);
                }}
              >
                {t === 'PDF'
                  ? 'PDF 문서'
                  : t === 'DOCX'
                    ? 'Word/DOCX'
                    : t === 'TXT/MD'
                      ? 'Markdown/TXT'
                      : t}
                {t === '전체' && <span>{documents.length}</span>}
              </button>
            ))}
          </div>
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="문서 검색"
              placeholder="문서명, 태그 또는 내용 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="인덱싱 상태 필터"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">전체 인덱싱 상태</option>
            <option value="ready">완료됨 (Ready)</option>
            <option value="processing">처리중 (Processing)</option>
            <option value="failed">파싱 실패 (Failed)</option>
          </select>
        </div>
        {selected.length > 0 && (
          <div className="bulk-actions">
            <span className="grow">
              ✓ 선택된 문서 <b>{selected.length}건</b>{' '}
              <span className="muted">　|　일괄 작업을 선택하세요.</span>
            </span>
            <button
              className="button small-button"
              onClick={() => {
                reindex(selected);
                setSelected([]);
              }}
            >
              <RefreshCw size={13} />
              일괄 재분석
            </button>
            <button className="button small-button" onClick={() => setModal('category')}>
              <SlidersHorizontal size={13} />
              카테고리 변경
            </button>
            <button className="button danger small-button" onClick={() => setModal('delete')}>
              <Trash2 size={13} />
              선택 삭제
            </button>
          </div>
        )}
      </section>
      <section className="card document-table">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="현재 페이지 문서 전체 선택"
                    checked={visible.length > 0 && visible.every((d) => selected.includes(d.id))}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...new Set([...selected, ...visible.map((d) => d.id)])]
                          : selected.filter((id) => !visible.some((d) => d.id === id)),
                      )
                    }
                  />
                </th>
                <th>문서명 및 유형</th>
                <th>용량</th>
                <th>청크 수</th>
                <th>등록일 및 업로더</th>
                <th>인덱싱 상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${d.name} 선택`}
                      checked={selected.includes(d.id)}
                      onChange={(e) =>
                        setSelected((s) =>
                          e.target.checked ? [...s, d.id] : s.filter((id) => id !== d.id),
                        )
                      }
                    />
                  </td>
                  <td>
                    <Link href={`/documents/${d.id}`} className="row document-name">
                      <FileIcon type={d.type} />
                      <div>
                        <b>{d.name}</b>
                        <div className="row mt-1">
                          <small className="mono muted">{d.id.slice(0, 13)}</small>
                          <small className="tag">{d.category}</small>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="mono muted">{d.size.toFixed(1)} MB</td>
                  <td>
                    <b className="text-primary">{d.chunks}</b> <span className="muted">Chunks</span>
                  </td>
                  <td>
                    {d.date}
                    <small className="block muted">{d.owner}</small>
                  </td>
                  <td>
                    <Badge status={d.status} />
                    {d.error && <small className="block text-red-600 mt-2">{d.error}</small>}
                  </td>
                  <td>
                    <div className="row">
                      <Link className="button small-button" href={`/documents/${d.id}`}>
                        상세보기
                      </Link>
                      <button
                        className="icon-button"
                        aria-label={`${d.name} 재분석`}
                        onClick={() => reindex([d.id])}
                      >
                        <RefreshCw size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`${d.name} 삭제`}
                        onClick={() => {
                          setSelected([d.id]);
                          setModal('delete');
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <div className="empty-state">
              <Search size={30} />
              <h3>
                {loading
                  ? '문서를 불러오는 중…'
                  : documents.length
                    ? '검색 결과가 없습니다'
                    : '아직 등록한 문서가 없습니다'}
              </h3>
              <p>
                {documents.length
                  ? '다른 검색어나 필터를 사용해 보세요.'
                  : '파일을 업로드하면 문서 기반 검색을 시작할 수 있습니다.'}
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setSearch('');
                  setType('전체');
                  setStatus('all');
                }}
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>
        <div className="pagination">
          <span>
            총 <b>{filtered.length}개</b> 문서 중{' '}
            {filtered.length ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
            {Math.min(currentPage * pageSize, filtered.length)} 표시 중
          </span>
          <div className="row">
            <button
              className="icon-button"
              aria-label="이전 페이지"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: maxPage }, (_, i) => (
              <button
                key={i}
                className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="icon-button"
              aria-label="다음 페이지"
              disabled={currentPage === maxPage}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
      <div className="tip">
        <Lightbulb size={22} />
        <p>
          <b>RAG 성능 향상 팁:</b> 표나 도표가 포함된 문서는 마크다운 또는 OCR 하이브리드 파서를
          사용하면 검색 품질을 높일 수 있습니다.
        </p>
        <button
          className="text-button"
          onClick={() =>
            notify(
              '텍스트가 있는 PDF·DOCX·HWPX와 UTF-8 TXT/Markdown을 지원합니다. 스캔 PDF는 OCR 후 업로드하고, 300페이지 또는 40만 자를 넘는 문서는 나누어 주세요.',
            )
          }
        >
          파싱 최적화 가이드 ↗
        </button>
      </div>
      {modal === 'delete' && (
        <Modal title="선택한 문서를 삭제할까요?" onClose={() => setModal(null)}>
          <p className="muted">
            {selected.length}개 문서의 원본 파일과 추출한 청크가 서버에서 삭제됩니다. 삭제한 문서는
            복구할 수 없습니다.
          </p>
          <div className="row justify-end mt-6">
            <button className="button secondary" onClick={() => setModal(null)}>
              취소
            </button>
            <button
              className="button danger"
              onClick={() => {
                removeDocuments(selected);
                setSelected([]);
                setModal(null);
              }}
            >
              삭제
            </button>
          </div>
        </Modal>
      )}
      {modal === 'category' && (
        <Modal title="카테고리 변경" onClose={() => setModal(null)}>
          <label className="field">
            카테고리
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {['경영기획', '인사총무', '기술개발', '정보보안', '교육운영', '미분류'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button
            className="button primary mt-5"
            onClick={() => {
              selected.forEach((id) => updateDocument(id, { category }));
              setModal(null);
              setSelected([]);
            }}
          >
            변경 저장
          </button>
        </Modal>
      )}
    </div>
  );
}
