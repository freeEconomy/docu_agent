'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  Send,
  PanelRight,
  X,
  Copy,
  RefreshCw,
  Download,
  Plus,
  FileSearch,
  ThumbsUp,
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
  MessageSquare,
} from 'lucide-react';
import { useWorkspace } from './workspace-provider';
import { FileIcon, Modal, downloadText } from './ui';
import { mockAnswer, budgetText, approvalText } from '@/lib/documents';
type Message = { id: string; role: 'user' | 'assistant'; text: string; citations: string[] };
const opening =
  '2024년 3분기 클라우드 인프라 전환 예산의 세부 집행 계획과, 3천만 원 초과 지출 시 필요한 승인 절차를 사내 규정 문서에 근거해서 정리해줘.';
export function Chat() {
  const { documents, notify } = useWorkspace();
  const query = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', role: 'user', text: opening, citations: [] },
  ]);
  const [showExample, setShowExample] = useState(true);
  const [input, setInput] = useState('');
  const [split, setSplit] = useState(false);
  const [context, setContext] = useState(['DOC-8942', 'DOC-7719']);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState(false);
  const [activeSource, setActiveSource] = useState('DOC-8942');
  const end = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    if (query.has('new')) {
      generation.current++;
      if (timer.current) clearTimeout(timer.current);
      setMessages([]);
      setShowExample(false);
      setBusy(false);
      setInput('');
    }
  }, [query]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function send(text = input) {
    if (!text.trim() || busy) return;
    const question = text.trim();
    const selected = documents.filter((d) => context.includes(d.id));
    const sources = selected.filter((d) => d.status === 'ready').map((d) => d.id);
    setMessages((ms) => [
      ...ms,
      { id: crypto.randomUUID(), role: 'user', text: question, citations: [] },
    ]);
    setInput('');
    setBusy(true);
    const current = generation.current;
    timer.current = setTimeout(() => {
      if (current !== generation.current) return;
      setMessages((ms) => [
        ...ms,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: mockAnswer(question, selected),
          citations: sources.slice(0, 2),
        },
      ]);
      setBusy(false);
      setTimeout(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }, 900);
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify('답변을 복사했습니다.');
    } catch {
      notify('클립보드 접근이 허용되지 않았습니다.');
    }
  }
  useEffect(() => {
    setSplit(window.innerWidth > 1050);
  }, []);
  const sources = documents.filter((d) => context.includes(d.id) && d.status === 'ready');
  return (
    <div className="chat-root">
      <section className="chat-heading">
        <div className="row gap-3">
          <span className="ai-icon">
            <BrainCircuit size={23} />
          </span>
          <div>
            <h1>2024년 3분기 클라우드 마이그레이션 예산 및 전결 규정 검토</h1>
            <div className="row flex-wrap text-xs muted mt-2">
              <span>참조 활성 컨텍스트:</span>
              {sources.map((d) => (
                <span className="tag" key={d.id}>
                  {d.name}
                </span>
              ))}
              <span>({sources.length}개 문서 고정)</span>
            </div>
          </div>
        </div>
        <div className="row mt-4">
          <div className="segmented">
            <button className={split ? 'active' : ''} onClick={() => setSplit(true)}>
              <PanelRight size={14} />
              스플릿 뷰
            </button>
            <button className={!split ? 'active' : ''} onClick={() => setSplit(false)}>
              <MessageSquare size={14} />
              단일 뷰
            </button>
          </div>
          <button
            className="icon-button"
            aria-label="대화 내역 내보내기"
            onClick={() =>
              downloadText(
                'DocuMind-대화.txt',
                messages.map((m) => `${m.role}: ${m.text}`).join('\n\n') +
                  (showExample ? '\n\n예시 답변: ' + budgetText + '\n' + approvalText : ''),
              )
            }
          >
            <Download size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="새 대화"
            onClick={() => {
              generation.current++;
              if (timer.current) clearTimeout(timer.current);
              setMessages([]);
              setShowExample(false);
              setBusy(false);
            }}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </section>
      <div className={`chat-layout ${split ? '' : 'single'}`}>
        <section className="conversation" aria-label="AI 대화">
          <div className="message-stream">
            {messages.length === 0 && (
              <div className="empty-chat">
                <BrainCircuit size={42} />
                <h2>사내 지식에서 답을 찾아보세요</h2>
                <p>문서를 선택하고 궁금한 내용을 질문하세요.</p>
                <button
                  className="button secondary"
                  onClick={() => send('3분기 예산 집행 계획을 요약해줘')}
                >
                  3분기 예산 집행 계획을 요약해줘 <ArrowRight size={16} />
                </button>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={m.id}>
                <div className={`message ${m.role}`}>
                  <span className={m.role === 'user' ? 'avatar' : 'ai-icon'}>
                    {m.role === 'user' ? 'SY' : <BrainCircuit size={22} />}
                  </span>
                  <div className="message-body">
                    {m.role === 'user' ? (
                      <>
                        <div className="message-meta">이서연 수석</div>
                        <div className="user-bubble">{m.text}</div>
                      </>
                    ) : (
                      <>
                        <div className="row flex-wrap mb-3">
                          <h3>DocuMind Intelligence</h3>
                          <span className="badge ready">Mock 응답</span>
                        </div>
                        <div className="answer-text">{m.text}</div>
                        <div className="row flex-wrap mt-3">
                          {m.citations.map((id) => {
                            const d = documents.find((d) => d.id === id);
                            return (
                              d && (
                                <Link className="citation" href={`/documents/${id}`} key={id}>
                                  <FileSearch size={14} />
                                  출처: {d.name}
                                  <ArrowRight size={14} />
                                </Link>
                              )
                            );
                          })}
                        </div>
                        <button className="text-button mt-3" onClick={() => copy(m.text)}>
                          <Copy size={14} />
                          답변 복사
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {i === 0 && showExample && (
                  <div className="message assistant">
                    <span className="ai-icon">
                      <BrainCircuit size={22} />
                    </span>
                    <div className="message-body">
                      <div className="row flex-wrap mb-4">
                        <h3>DocuMind Intelligence</h3>
                        <span className="badge ready">
                          <CheckCircle2 size={12} />
                          근거 검증 예시
                        </span>
                      </div>
                      <div className="summary-callout">
                        <Lightbulb size={23} />
                        <div>
                          <strong>핵심 요약 (Executive Summary)</strong>
                          <p>
                            2024년 3분기 클라우드 인프라 마이그레이션 총 배정 예산은{' '}
                            <b>1억 2,000만 원</b>이며, 이 중 3분기 내 <b>8,000만 원</b>이 우선
                            집행될 예정입니다. 단일 건 기준 <b>3,000만 원을 초과</b>하는 지출 건은
                            소관 부서 본부장 전결 후 반드시 <b>경영기획실 사전 합의(승인)</b>를
                            득해야 합니다.
                          </p>
                        </div>
                      </div>
                      <div className="section-heading">
                        <h3>1. 클라우드 마이그레이션 3분기 예산 배정 현황</h3>
                        <button
                          className="citation"
                          onClick={() => {
                            setSplit(true);
                            setActiveSource('DOC-8942');
                          }}
                        >
                          <FileSearch size={15} />
                          [출처 1: 경영계획서 p.18]
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      <div className="table-wrap">
                        <table className="budget-table">
                          <thead>
                            <tr>
                              <th>구분 항목</th>
                              <th>연간 총 배정액</th>
                              <th>3분기 집행 예정액</th>
                              <th>주요 집행 목적 및 상세</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                인프라 컨테이너화
                                <br />
                                (Kubernetes)
                              </td>
                              <td>6,000만 원</td>
                              <td>
                                <b>4,000만 원</b>
                              </td>
                              <td>AWS EKS 전환 및 MSA 아키텍처 배포 파이프라인 수립</td>
                            </tr>
                            <tr>
                              <td>클라우드 보안 감사 & 거버넌스</td>
                              <td>5,000만 원</td>
                              <td>
                                <b>4,000만 원</b>
                              </td>
                              <td>ISMS-P 클라우드 인증 대응 및 모의 침투 점검</td>
                            </tr>
                            <tr>
                              <td>DR 재해복구 자동화 구축</td>
                              <td>1,000만 원</td>
                              <td>- (4분기 이월)</td>
                              <td>멀티 리전 실시간 백업 구성</td>
                            </tr>
                            <tr className="total">
                              <td>합계 (Total)</td>
                              <td>1억 2,000만 원</td>
                              <td>8,000만 원</td>
                              <td>3분기 목표 달성률 66.7%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="section-heading">
                        <h3>2. 지출 승인 프로세스 및 전결 기준</h3>
                        <button
                          className="citation"
                          onClick={() => {
                            setSplit(true);
                            setActiveSource('DOC-7719');
                          }}
                        >
                          [출처 2: 전결규정 p.5]
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      <div className="card steps">
                        {[
                          [
                            '기안서 작성 및 견적 비교',
                            '3개 사 이상의 표준 견적서 비교표 첨부 필수 (인프라 및 라이선스 도입 포함).',
                          ],
                          [
                            '경영기획실 예산 적정성 사전 검토 (합의)',
                            '단일 건 3,000만 원 초과 시 소관 본부 상신 전, 경영기획실 예산팀 협의 서명을 반드시 득해야 합니다.',
                          ],
                          [
                            'IT전략본부장 최종 전결 및 계약 체결',
                            '5,000만 원 미만 건은 본부장 최종 전결 후 전자서명 집행. 5,000만 원 이상은 대표이사 결재 필요.',
                          ],
                        ].map(([title, desc], i) => (
                          <div className="step" key={title}>
                            <span>{i + 1}</span>
                            <div>
                              <strong>{title}</strong>
                              <p>{desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="row flex-wrap answer-actions">
                        <button onClick={() => copy(budgetText + '\n' + approvalText)}>
                          <Copy size={15} />
                          답변 복사
                        </button>
                        <button onClick={() => send(opening)}>
                          <RefreshCw size={15} />
                          재생성
                        </button>
                        <button
                          aria-label="답변 좋아요"
                          aria-pressed={liked}
                          className={liked ? 'text-primary' : ''}
                          onClick={() => {
                            setLiked(!liked);
                            notify(
                              liked ? '평가를 취소했습니다.' : '데모 답변 평가를 저장했습니다.',
                            );
                          }}
                        >
                          <ThumbsUp size={16} />
                        </button>
                        <button className="citation" onClick={() => setSplit(!split)}>
                          <PanelRight size={15} />
                          근거 패널 {split ? '활성화됨' : '열기'} (2건)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="processing-card" role="status">
                <RefreshCw size={20} className="animate-spin" />
                <div>
                  <b>RAG 지식 검색 및 추론 파이프라인 데모</b>
                  <p>선택한 문서에서 모의 응답을 준비하고 있습니다...</p>
                  <div className="progress">
                    <i style={{ width: '75%' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={end} />
          </div>
          <div className="composer-wrap">
            <div className="row flex-wrap text-xs muted mb-2">
              <SlidersHorizontal size={14} />
              검색 컨텍스트:
              {context.map((id) => {
                const d = documents.find((d) => d.id === id);
                return (
                  d && (
                    <span className="tag row" key={id}>
                      {d.name}
                      <button
                        aria-label={`${d.name} 컨텍스트 제거`}
                        onClick={() => setContext((c) => c.filter((x) => x !== id))}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                );
              })}
              <button className="text-button" onClick={() => setPicker(true)}>
                <Plus size={13} />
                문서 추가
              </button>
            </div>
            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <textarea
                aria-label="질문 입력"
                placeholder="사내 문서에 대해 무엇이든 질문하세요... (Shift+Enter로 줄바꿈)"
                value={input}
                maxLength={4000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <div className="row between">
                <span className="muted text-xs">Mock 응답 · {4000 - input.length}자 남음</span>
                <button className="button primary" disabled={busy || !input.trim()} type="submit">
                  질문하기
                  <Send size={16} />
                </button>
              </div>
            </form>
            <div className="suggestions">
              <span>추천 질의:</span>
              <button onClick={() => send('이번 분기 예산 집행 계획을 요약해줘')}>
                💡 이번 분기 예산 집행 계획
              </button>
              <button onClick={() => send('지출 승인 절차를 알려줘')}>💡 지출 승인 절차</button>
            </div>
          </div>
        </section>
        {split && (
          <aside className="evidence" aria-label="답변 근거 패널">
            <div className="evidence-header">
              <div className="row between">
                <h3 className="row">
                  <FileSearch size={19} />
                  답변 근거 및 청크 분석
                </h3>
                <button
                  className="icon-button"
                  aria-label="근거 패널 닫기"
                  onClick={() => setSplit(false)}
                >
                  <X size={19} />
                </button>
              </div>
              <div className="row between muted text-xs mt-3">
                답변 생성에 인용된 발췌 구문<span className="tag">{sources.length}건 추출됨</span>
              </div>
            </div>
            <div className="evidence-content">
              {sources.map((d, i) => (
                <article
                  className={`source-card ${activeSource === d.id ? 'selected' : ''}`}
                  key={d.id}
                >
                  <div className="row">
                    <FileIcon type={d.type} />
                    <div className="min-w-0 grow">
                      <strong className="source-title">{d.name}</strong>
                      <small className="muted">
                        {d.size} MB · 최종 갱신: {d.date}
                      </small>
                    </div>
                    <span className="tag">출처 {i + 1}</span>
                  </div>
                  <div className="row flex-wrap mt-3">
                    <span className="badge ready">● 신뢰도 {i === 0 ? '96.4' : '91.8'}%</span>
                    <span className="tag mono">Cosine Sim {i === 0 ? '0.89' : '0.84'}</span>
                    <span className="tag mono">
                      Page {d.id === 'DOC-8942' ? 18 : 5} / {d.pages}
                    </span>
                    <span className="tag mono">Chunk #{i === 0 ? 42 : 12}</span>
                  </div>
                  <blockquote>
                    <span className="muted mono text-xs">// [발췌 구문] 문서 컨텍스트</span>
                    <p>
                      <mark>{d.text.slice(0, 100)}</mark>
                      {d.text.slice(100, 210)}...
                    </p>
                  </blockquote>
                  <Link className="source-link" href={`/documents/${d.id}`}>
                    <FileSearch size={15} />
                    원본 문서 뷰어에서 확인
                    <ChevronRight size={16} />
                  </Link>
                </article>
              ))}
              {sources.length === 0 && (
                <p className="muted">준비된 컨텍스트 문서를 추가해 주세요.</p>
              )}
              <div className="inset mt-4">
                <strong className="text-xs">임베딩 청크 분포 (Top Cosine Sim)</strong>
                <svg viewBox="0 0 300 70" role="img" aria-label="모의 코사인 유사도 추이">
                  <path
                    d="M10 58L80 40L150 27L220 20L290 12"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                  {[80, 150, 220].map((x, i) => (
                    <circle key={x} cx={x} cy={[40, 27, 20][i]} r="4" fill="#4b41e1" />
                  ))}
                </svg>
                <small className="muted">Threshold: 0.75+ · Mock 데이터</small>
              </div>
            </div>
            <div className="evidence-footer">
              <strong className="text-green-800 text-xs">● 할루시네이션 방지 팩트체크 예시</strong>
              <div className="row between mt-2 text-xs">
                <span>Grounding Score (Mock)</span>
                <b>98 / 100</b>
              </div>
              <div className="progress green mt-2">
                <i style={{ width: '98%' }} />
              </div>
            </div>
          </aside>
        )}
      </div>
      {picker && (
        <Modal title="검색 컨텍스트 선택" onClose={() => setPicker(false)}>
          <p className="muted mb-4">답변의 근거로 사용할 준비된 문서를 선택하세요.</p>
          <div className="context-picker">
            {documents
              .filter((d) => d.status === 'ready')
              .map((d) => (
                <label className="row p-3" key={d.id}>
                  <input
                    type="checkbox"
                    checked={context.includes(d.id)}
                    onChange={(e) =>
                      setContext((c) =>
                        e.target.checked ? [...c, d.id] : c.filter((id) => id !== d.id),
                      )
                    }
                  />
                  <FileIcon type={d.type} />
                  {d.name}
                </label>
              ))}
          </div>
          <button className="button primary mt-5" onClick={() => setPicker(false)}>
            선택 완료
          </button>
        </Modal>
      )}
    </div>
  );
}
